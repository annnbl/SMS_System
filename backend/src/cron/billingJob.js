import { Subscription } from '../models/Subscription.js';
import { createInvoiceFromSubscription } from '../controllers/invoice.controller.js';

/**
 * Recurring Billing Job
 * Finds all Active subscriptions where nextInvoiceDate <= now
 * Generates an invoice idempotently and advances nextInvoiceDate
 */
export const runBillingJob = async () => {
  console.log('[Cron: Billing] Checking for due subscriptions...');
  try {
    const now = new Date();
    const dueSubscriptions = await Subscription.find({
      status: 'Active',
      nextInvoiceDate: { $lte: now },
    });

    console.log(`[Cron: Billing] Found ${dueSubscriptions.length} subscriptions due for billing.`);

    let generatedCount = 0;
    for (const sub of dueSubscriptions) {
      try {
        const result = await createInvoiceFromSubscription(sub._id, sub.nextInvoiceDate);
        if (result.created) {
          generatedCount++;
          console.log(`[Cron: Billing] Generated invoice ${result.invoice.invoiceNumber} for sub ${sub.subscriptionNumber}`);
        }
      } catch (subErr) {
        console.error(`[Cron: Billing] Error billing sub ${sub.subscriptionNumber}:`, subErr.message);
      }
    }

    console.log(`[Cron: Billing] Completed. Generated ${generatedCount} new invoices.`);
    return { success: true, count: generatedCount };
  } catch (err) {
    console.error('[Cron: Billing] Fatal error running billing job:', err);
    return { success: false, error: err.message };
  }
};
