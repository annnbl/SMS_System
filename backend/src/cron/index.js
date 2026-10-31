import cron from 'node-cron';
import { runBillingJob } from './billingJob.js';
import { runExpiryJob } from './expiryJob.js';
import { runOverdueJob } from './overdueJob.js';

export const initCronJobs = () => {
  console.log('[Cron] Initializing scheduled cron jobs...');

  // 1. Billing Job: Runs daily at 00:00 (Midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Triggering daily billing job...');
    await runBillingJob();
  });

  // 2. Expiry Job: Runs daily at 01:00 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('[Cron] Triggering daily subscription expiry job...');
    await runExpiryJob();
  });

  // 3. Overdue Job: Runs daily at 02:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] Triggering nightly overdue invoices job...');
    await runOverdueJob();
  });

  console.log('[Cron] Scheduled jobs active: Billing (00:00), Expiry (01:00), Overdue (02:00).');
};

export { runBillingJob, runExpiryJob, runOverdueJob };
