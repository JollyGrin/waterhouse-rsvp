import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { Reservation } from '$lib/types/reservation';

export const load: PageLoad = async ({ fetch }) => {
  try {
    // Calculate start of today as the start date
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    // Format dates as ISO strings for the API
    const startDateParam = startOfToday.toISOString();

    // Fetch reservations from our API
    const response = await fetch(`/api/booking?startDate=${startDateParam}`, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch reservations');
    }

    const data = await response.json();
    console.log('RESPONSE:', data);

    return {
      reservations: (data.reservations || []) as Reservation[],
      success: data.success as boolean
    };
  } catch (err) {
    console.error('Error loading reservations:', err);
    throw error(500, {
      message: 'Failed to load reservations'
    });
  }
};
