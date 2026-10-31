import { Invoice } from '../models/Invoice.js';

/**
 * Nightly Overdue Invoices Job
 * Flags unpaid invoices past due date as 'Overdue'
 */
export const runOverdueJob = async () => {
  console.log('[Cron: Overdue] Scanning for overdue invoices...');
  try {
    const now = new Date();
    const result = await Invoice.updateMany(
      {
        status: { $in: ['Draft', 'Confirmed'] },
        dueDate: { $lt: now },
        amountDue: { $gt: 0 },
      },
      {
        $set: { status: 'Overdue' },
      }
    );

    console.log(`[Cron: Overdue] Completed. Flagged ${result.modifiedCount} invoices as Overdue.`);
    return { success: true, count: result.modifiedCount };
  } catch (err) {
    console.error('[Cron: Overdue] Fatal error running overdue job:', err);
    return { success: false, error: err.message };
  }
};
