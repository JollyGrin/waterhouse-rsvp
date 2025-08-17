import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@waterhouse-rsvp/shared';

const prisma = new PrismaClient();
export const bookingRouter = Router();

const createBookingSchema = z.object({
  userId: z.string(),
  studioId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  totalPrice: z.number().or(z.string().transform(v => parseFloat(v))),
  status: z.string().optional().default('pending'),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  notes: z.string().optional()
});

bookingRouter.post('/', async (req, res) => {
  try {
    const validation = createBookingSchema.safeParse(req.body);
    
    if (!validation.success) {
      const errors = validation.error.flatten();
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          fields: Object.keys(errors.fieldErrors),
          details: errors.fieldErrors
        }
      });
    }

    const data = validation.data;
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid time range: ${startTime.toISOString()} to ${endTime.toISOString()}`
        }
      });
    }

    const existingBooking = await prisma.reservation.findFirst({
      where: {
        studioId: data.studioId,
        AND: [
          {
            OR: [
              {
                startTime: { lt: endTime },
                endTime: { gt: startTime }
              }
            ]
          }
        ]
      }
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        error: { message: 'This time slot is already booked' }
      });
    }

    let user = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      console.log(`User ${data.userId} does not exist. Creating user record...`);
      user = await prisma.user.create({
        data: {
          id: data.userId,
          email: data.email,
          firstName: data.name.split(' ')[0],
          lastName: data.name.split(' ').slice(1).join(' ') || null
        }
      });
    }

    let studio = await prisma.studio.findUnique({
      where: { id: data.studioId }
    });

    if (!studio) {
      console.log(`Studio ${data.studioId} does not exist. Creating studio record...`);
      const hourlyRate = data.totalPrice / ((endTime.getTime() - startTime.getTime()) / 3600000);
      
      studio = await prisma.studio.create({
        data: {
          id: data.studioId,
          name: `Studio ${data.studioId}`,
          description: 'Automatically created studio',
          hourlyRate
        }
      });
    }

    const newReservation = await prisma.reservation.create({
      data: {
        userId: data.userId,
        studioId: data.studioId,
        startTime,
        endTime,
        totalPrice: data.totalPrice,
        status: data.status,
        notes: data.notes || null
      }
    });

    return res.status(201).json({
      success: true,
      reservation: newReservation
    });

  } catch (error) {
    console.error('Error creating reservation:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to create reservation' }
    });
  }
});

bookingRouter.get('/', async (req, res) => {
  try {
    const { studioId, startDate, endDate } = req.query;
    const where: any = {};

    if (studioId && typeof studioId === 'string') {
      where.studioId = studioId;
    }

    if (startDate && typeof startDate === 'string') {
      const startDateTime = new Date(startDate);
      
      if (!endDate) {
        where.OR = [
          { startTime: { gte: startDateTime } },
          { endTime: { gt: startDateTime } }
        ];
      } else {
        const endDateTime = new Date(endDate as string);
        where.OR = [
          {
            startTime: { gte: startDateTime, lt: endDateTime }
          },
          {
            endTime: { gt: startDateTime, lte: endDateTime }
          }
        ];
      }
    }

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: { startTime: 'asc' }
    });

    return res.json({
      success: true,
      reservations
    });

  } catch (error) {
    console.error('Error fetching reservations:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch reservations' }
    });
  }
});