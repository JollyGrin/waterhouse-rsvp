import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
// import { getAuth } from '@clerk/backend'; // Uncomment when implementing auth verification

// POST handler for creating a new reservation
export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    // Parse the form data
    const formData = await request.formData();
    
    // Debug all form data
    console.log('Received form data:');
    const formDataObj: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      formDataObj[key] = value as string;
      console.log(`${key}: ${value}`);
    }
    
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
    
    // Enhanced validation with specific error messages
    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!studioId) missingFields.push('studioId');
    if (!startTimeStr) missingFields.push('startTime');
    if (!endTimeStr) missingFields.push('endTime');
    if (!totalPriceStr) missingFields.push('totalPrice');
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    
    if (missingFields.length > 0) {
      const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
      console.error(errorMessage);
      return json(
        { success: false, error: { message: errorMessage, fields: missingFields } },
        { status: 400 }
      );
    }
    
    // Parse dates and numbers
    let startTime: Date;
    let endTime: Date;
    let totalPrice: number;
    
    try {
      console.log('Parsing startTime:', startTimeStr);
      startTime = new Date(startTimeStr); // Now expecting ISO string
      if (isNaN(startTime.getTime())) throw new Error('Invalid startTime format');
      
      console.log('Parsing endTime:', endTimeStr);
      endTime = new Date(endTimeStr); // Now expecting ISO string
      if (isNaN(endTime.getTime())) throw new Error('Invalid endTime format');
      
      console.log('Parsing totalPrice:', totalPriceStr);
      totalPrice = parseFloat(totalPriceStr);
      if (isNaN(totalPrice)) throw new Error('Invalid totalPrice format');
      
      console.log('Parsed values:', { 
        startTime: startTime.toISOString(), 
        endTime: endTime.toISOString(), 
        totalPrice 
      });
    } catch (err) {
      const errorMessage = `Error parsing data: ${(err as Error).message}`;
      console.error(errorMessage);
      return json(
        { success: false, error: { message: errorMessage } },
        { status: 400 }
      );
    }
    
    // Validate time range
    if (startTime >= endTime) {
      const errorMessage = `Invalid time range: ${startTime.toISOString()} to ${endTime.toISOString()}`;
      console.error(errorMessage);
      return json(
        { success: false, error: { message: errorMessage } },
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
    
    // Check if user exists, create if not (using Clerk ID)
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      console.log(`User ${userId} does not exist. Creating user record...`);
      user = await prisma.user.create({
        data: {
          id: userId,
          email: email,
          firstName: name.split(' ')[0], // Simple name splitting
          lastName: name.split(' ').slice(1).join(' ') || null
        }
      });
      console.log(`Created user record:`, user);
    }
    
    // Check if studio exists, create if not
    let studio = await prisma.studio.findUnique({
      where: { id: studioId }
    });
    
    if (!studio) {
      console.log(`Studio ${studioId} does not exist. Creating studio record...`);
      
      // Create a default studio with the ID from the form
      // In a real app, you would probably have a separate admin interface for creating studios
      studio = await prisma.studio.create({
        data: {
          id: studioId,
          name: `Studio ${studioId}`,
          description: 'Automatically created studio',
          hourlyRate: totalPrice / ((endTime.getTime() - startTime.getTime()) / 3600000) // Calculate hourly rate
        }
      });
      console.log(`Created studio record:`, studio);
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
    
    // Handle date filtering
    if (startDate) {
      // If only startDate is provided (e.g., "now minus 1 hour"),
      // filter reservations that start after or end after this time
      if (!endDate) {
        where.OR = [
          { startTime: { gte: new Date(startDate) } },
          { endTime: { gt: new Date(startDate) } }
        ];
      } 
      // If both dates are provided, use the original range logic
      else {
        where.OR = [
          {
            startTime: { gte: new Date(startDate), lt: new Date(endDate) },
          },
          {
            endTime: { gt: new Date(startDate), lte: new Date(endDate) },
          }
        ];
      }
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
