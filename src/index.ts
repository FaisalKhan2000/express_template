import express, { Request, Response, NextFunction } from 'express';
import os from 'os';
import process from 'process';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import { catchErrors } from './utils/catchErrors.js';
import authRoutes from './routes/auth.routes.js'
import requestId from './middleware/requestId.middleware.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestId)

// Health Check
app.get('/health-check', catchErrors(async (req: Request, res: Response) => {

  res.status(200).json({ status: 'UP' });
}));

app.use('/auth', authRoutes)

app.use(notFoundHandler);
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;