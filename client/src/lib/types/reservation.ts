export interface Reservation {
  id: string;
  userId: string;
  studioId: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  notes?: string | null;
}
