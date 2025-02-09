import express, { Request, Response, NextFunction } from 'express';
import os from 'os';
import process from 'process';
import dotenv from 'dotenv';
import { catchErrors } from './utils/catchErrors.js';
import authRoutes from './routes/auth.routes.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health-check', catchErrors(async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'UP',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    loadAverage: os.loadavg(),
    freeMemory: os.freemem(),
    totalMemory: os.totalmem(),
    platform: os.platform(),
    arch: os.arch(),
    currentTime: new Date().toISOString(),
    environment: process.env,
  };
  res.status(200).json(healthCheck);
}));

app.use('/auth', authRoutes)

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});