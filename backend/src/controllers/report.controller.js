import mongoose from 'mongoose';
import { Subscription } from '../models/Subscription.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Plan } from '../models/Plan.js';

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const { startDate, endDate, planId, customerId } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const invoiceMatch = {};
    if (startDate || endDate) invoiceMatch.issueDate = dateFilter;
    if (customerId) invoiceMatch.customer = new mongoose.Types.ObjectId(customerId);

    const subscriptionMatch = {};
    if (planId) subscriptionMatch.plan = new mongoose.Types.ObjectId(planId);
    if (customerId) subscriptionMatch.customer = new mongoose.Types.ObjectId(customerId);

    // Parallel aggregation pipelines for sub-second responses
    const [
      subscriptionStats,
      revenueStats,
      overdueInvoices,
      mrrStats,
      recentActivity,
    ] = await Promise.all([
      // 1. Subscription counts by status
      Subscription.aggregate([
        { $match: subscriptionMatch },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$totalAmount' },
          },
        },
      ]),

      // 2. Financial totals: Total Invoiced, Revenue Collected, Amount Outstanding
      Invoice.aggregate([
        { $match: invoiceMatch },
        {
          $group: {
            _id: null,
            totalInvoiced: { $sum: '$totalAmount' },
            revenueCollected: { $sum: '$amountPaid' },
            amountOutstanding: { $sum: '$amountDue' },
            invoiceCount: { $sum: 1 },
          },
        },
      ]),

      // 3. Overdue invoices list
      Invoice.find({
        status: { $in: ['Overdue', 'Confirmed'] },
        dueDate: { $lt: new Date() },
        amountDue: { $gt: 0 },
      })
        .populate('customer', 'name email company')
        .populate('subscription', 'subscriptionNumber')
        .sort({ dueDate: 1 })
        .limit(10),

      // 4. Monthly Recurring Revenue (MRR) calculation from active subscriptions
      Subscription.aggregate([
        { $match: { ...subscriptionMatch, status: 'Active' } },
        {
          $lookup: {
            from: 'plans',
            localField: 'plan',
            foreignField: '_id',
            as: 'planInfo',
          },
        },
        { $unwind: '$planInfo' },
        {
          $project: {
            totalAmount: 1,
            billingPeriod: '$planInfo.billingPeriod',
            monthlyMultiplier: {
              $switch: {
                branches: [
                  { case: { $eq: ['$planInfo.billingPeriod', 'daily'] }, then: 30 },
                  { case: { $eq: ['$planInfo.billingPeriod', 'weekly'] }, then: 4.33 },
                  { case: { $eq: ['$planInfo.billingPeriod', 'monthly'] }, then: 1 },
                  { case: { $eq: ['$planInfo.billingPeriod', 'yearly'] }, then: 1 / 12 },
                ],
                default: 1,
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            mrr: { $sum: { $multiply: ['$totalAmount', '$monthlyMultiplier'] } },
            activeCount: { $sum: 1 },
          },
        },
      ]),

      // 5. Recent payments
      Payment.find()
        .populate('customer', 'name email')
        .populate('invoice', 'invoiceNumber')
        .sort({ paymentDate: -1 })
        .limit(5),
    ]);

    // Format subscription counts
    const statusCounts = {
      Active: 0,
      Draft: 0,
      Quotation: 0,
      Confirmed: 0,
      Paused: 0,
      Closed: 0,
    };
    let totalSubs = 0;
    subscriptionStats.forEach((stat) => {
      if (statusCounts[stat._id] !== undefined) {
        statusCounts[stat._id] = stat.count;
      }
      totalSubs += stat.count;
    });

    const finance = revenueStats[0] || {
      totalInvoiced: 0,
      revenueCollected: 0,
      amountOutstanding: 0,
      invoiceCount: 0,
    };

    const mrr = mrrStats[0] ? Number(mrrStats[0].mrr.toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          activeSubscriptions: statusCounts.Active,
          totalSubscriptions: totalSubs,
          statusBreakdown: statusCounts,
          revenueCollected: Number(finance.revenueCollected.toFixed(2)),
          amountOutstanding: Number(finance.amountOutstanding.toFixed(2)),
          totalInvoiced: Number(finance.totalInvoiced.toFixed(2)),
          invoiceCount: finance.invoiceCount,
          mrr,
          arr: Number((mrr * 12).toFixed(2)),
        },
        overdueInvoices,
        recentPayments: recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};
