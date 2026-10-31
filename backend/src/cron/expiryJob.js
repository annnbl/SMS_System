import { Subscription } from '../models/Subscription.js';

/**
 * Subscription Expiry Job
 * Checks active subscriptions whose expiryDate has passed
 * Auto-closes subscriptions if plan.autoCloseOnEnd is enabled
 */
export const runExpiryJob = async () => {
  console.log('[Cron: Expiry] Checking for expired subscriptions...');
  try {
    const now = new Date();
    const expiredSubscriptions = await Subscription.find({
      status: 'Active',
      expiryDate: { $lte: now },
    }).populate('plan');

    console.log(`[Cron: Expiry] Found ${expiredSubscriptions.length} expired subscriptions.`);

    let closedCount = 0;
    for (const sub of expiredSubscriptions) {
      if (sub.plan && sub.plan.autoCloseOnEnd) {
        sub.status = 'Closed';
        sub.statusHistory.push({
          fromStatus: 'Active',
          toStatus: 'Closed',
          reason: 'Subscription reached expiry date (Auto-closed by scheduled policy)',
          timestamp: new Date(),
        });
        await sub.save();
        closedCount++;
        console.log(`[Cron: Expiry] Auto-closed subscription ${sub.subscriptionNumber}`);
      }
    }

    console.log(`[Cron: Expiry] Completed. Auto-closed ${closedCount} subscriptions.`);
    return { success: true, count: closedCount };
  } catch (err) {
    console.error('[Cron: Expiry] Fatal error running expiry job:', err);
    return { success: false, error: err.message };
  }
};
