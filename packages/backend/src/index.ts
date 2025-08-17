import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import dotenv from 'dotenv';
import { healthRouter } from './routes/health.js';
import { bookingRouter } from './routes/booking.js';
import { errorHandler } from './middleware/error.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', healthRouter);
app.use('/api/booking', bookingRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});