import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { initCronJobs } from './cron/index.js';
import { initMailer } from './utils/mailer.js';

const startServer = async () => {
  try {
    console.log('--- Starting Brightloop SMS Backend ---');
    await connectDB();
    await initMailer();
    initCronJobs();

    app.listen(ENV.PORT, async () => {
      console.log(`[Server] Brightloop SMS API server running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
      console.log(`[Server] API Health check available at: http://localhost:${ENV.PORT}/api/health`);

      // Check if admin exists; if not, auto-seed default data
      const { User } = await import('./models/User.js');
      const adminExists = await User.findOne({ role: 'admin' });
      if (!adminExists) {
        console.log('[Server] No admin user detected. Running initial seed...');
        const { seedDatabase } = await import('./scripts/seed.js');
        await seedDatabase();
      }
    });
  } catch (err) {
    console.error('[Server] Critical initialization failure:', err);
    process.exit(1);
  }
};

startServer();
