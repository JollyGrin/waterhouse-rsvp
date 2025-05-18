import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
// import { getAuth } from '@clerk/backend'; // Uncomment when implementing auth verification

// POST handler for creating a new reservation
export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    // Parse the form data
    const formData = await request.formData();
    
    // Extract form values
    const userId = formData.get('userId') as string;
    const studioId = formData.get('studioId') as string;
    const startTimeStr = formData.get('startTime') as string;
    const endTimeStr = formData.get('endTime') as string;
    const totalPriceStr = formData.get('totalPrice') as string;
    const status = formData.get('status') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string || null;
    const notes = formData.get('notes') as string || null;
    
    // Validate required fields
    if (!userId || !studioId || !startTimeStr || !endTimeStr || !totalPriceStr || !name || !email) {
      return json(
        { success: false, error: { message: 'Missing required fields' } },
        { status: 400 }
      );
    }
    
    // Parse dates and numbers
    const startTime = new Date(Number(startTimeStr));
    const endTime = new Date(Number(endTimeStr));
    const totalPrice = parseFloat(totalPriceStr);
    
    // Validate parsed values
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || isNaN(totalPrice)) {
      return json(
        { success: false, error: { message: 'Invalid date or price format' } },
        { status: 400 }
      );
    }
    
    // Validate time range
    if (startTime >= endTime) {
      return json(
        { success: false, error: { message: 'End time must be after start time' } },
        { status: 400 }
      );
    }
    
    // Verify user authentication with Clerk
    // Note: In a real implementation, you would validate the session token
    // and ensure the userId matches the authenticated user
    
    // Check for conflicting bookings
    const existingBooking = await prisma.reservation.findFirst({
      where: {
        studioId: studioId,
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
      return json(
        { success: false, error: { message: 'This time slot is already booked' } },
        { status: 409 }
      );
    }
    
    // Create the reservation in the database
    const newReservation = await prisma.reservation.create({
      data: {
        userId,
        studioId,
        startTime,
        endTime,
        totalPrice,
        status: status || 'pending',
        notes
      }
    });
    
    // Return success response with the created reservation
    return json({ success: true, reservation: newReservation }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating reservation:', error);
    
    return json(
      { success: false, error: { message: 'Failed to create reservation' } },
      { status: 500 }
    );
  }
};

// GET handler to list reservations (for future use)
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Optional query parameters for filtering
    const studioId = url.searchParams.get('studioId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    // Build the where clause based on filters
    const where: any = {};
    
    if (studioId) {
      where.studioId = studioId;
    }
    
    if (startDate && endDate) {
      where.OR = [
        {
          startTime: { gte: new Date(startDate), lt: new Date(endDate) },
        },
        {
          endTime: { gt: new Date(startDate), lte: new Date(endDate) },
        }
      ];
    }
    
    // Query the database for reservations
    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: { startTime: 'asc' }
    });
    
    return json({ success: true, reservations }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching reservations:', error);
    
    return json(
      { success: false, error: { message: 'Failed to fetch reservations' } },
      { status: 500 }
    );
  }
};
