import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authenticate, authorize } from './middlewares/auth.js';
import { runBillingJob, runExpiryJob, runOverdueJob } from './cron/index.js';

const app = express();

// Security and CORS
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and Vite dev origins, or requests with no origin (like mobile/curl)
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local dev environment
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'Brightloop Subscription Management System API',
  });
});

// Admin manual cron triggers (for testing and instant demonstration)
app.post('/api/cron/trigger/:job', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { job } = req.params;
    let result;
    if (job === 'billing') {
      result = await runBillingJob();
    } else if (job === 'expiry') {
      result = await runExpiryJob();
    } else if (job === 'overdue') {
      result = await runOverdueJob();
    } else {
      return res.status(400).json({ success: false, message: `Unknown job: ${job}` });
    }
    res.status(200).json({ success: true, message: `Job ${job} triggered successfully`, result });
  } catch (err) {
    next(err);
  }
});

// Mount Main API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;
