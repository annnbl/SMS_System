import { Subscription, VALID_TRANSITIONS } from '../models/Subscription.js';
import { Plan } from '../models/Plan.js';
import { Product } from '../models/Product.js';
import { Tax } from '../models/Tax.js';
import { Discount } from '../models/Discount.js';
import { QuotationTemplate } from '../models/QuotationTemplate.js';

// Helper to calculate next billing date from a given start date and period
export const calculateNextDate = (startDate, billingPeriod) => {
  const d = new Date(startDate);
  switch (billingPeriod) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
};

// Generate unique subscription number
const generateSubscriptionNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Subscription.countDocuments();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SUB-${year}-${String(count + 1).padStart(4, '0')}-${randomSuffix}`;
};

/**
 * List subscriptions (Paginated, filtered, customer scoped)
 */
export const listSubscriptions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const query = {};

    // Customer scoping: Customers only see their own subscriptions
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (req.query.customer) {
      query.customer = req.query.customer;
    }

    if (req.query.status) query.status = req.query.status;
    if (req.query.plan) query.plan = req.query.plan;
    if (req.query.search) {
      query.subscriptionNumber = { $regex: req.query.search, $options: 'i' };
    }

    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .populate('customer', 'name email company phone')
        .populate('plan')
        .populate('lines.product', 'name salesPrice type')
        .populate('discount', 'code type value')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Subscription.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get subscription by ID
 */
export const getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('customer', 'name email company phone address')
      .populate('plan')
      .populate('lines.product')
      .populate('discount')
      .populate('statusHistory.changedBy', 'name email role');

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    // Role check for customer
    if (req.user.role === 'customer' && subscription.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: subscription });
  } catch (err) {
    next(err);
  }
};

/**
 * Create subscription (from scratch or from template)
 */
export const createSubscription = async (req, res, next) => {
  try {
    const {
      customer,
      plan: planId,
      templateId,
      startDate,
      expiryDate,
      paymentTerms,
      lines: incomingLines,
      discountCode,
      notes,
    } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({ success: false, message: 'A valid active plan is required.' });
    }

    let calculatedLines = [];
    const taxes = await Tax.find({ isActive: true });
    const defaultTax = taxes.find((t) => t.isDefault) || (taxes.length > 0 ? taxes[0] : null);

    if (templateId) {
      const template = await QuotationTemplate.findById(templateId).populate('lines.product');
      if (template) {
        calculatedLines = template.lines.map((l) => {
          const unit = l.unitPrice + (l.variantExtraPrice || 0);
          const sub = unit * l.quantity;
          let taxAmt = 0;
          const taxEntries = [];
          if (defaultTax) {
            taxAmt = (sub * defaultTax.rate) / 100;
            taxEntries.push({
              tax: defaultTax._id,
              name: defaultTax.name,
              rate: defaultTax.rate,
              amount: Number(taxAmt.toFixed(2)),
            });
          }
          return {
            product: l.product._id || l.product,
            variantName: l.variantName || '',
            variantExtraPrice: l.variantExtraPrice || 0,
            quantity: l.quantity,
            unitPrice: unit,
            taxes: taxEntries,
            subtotal: Number(sub.toFixed(2)),
            taxAmount: Number(taxAmt.toFixed(2)),
            amount: Number((sub + taxAmt).toFixed(2)),
          };
        });
      }
    } else if (incomingLines && incomingLines.length > 0) {
      for (const line of incomingLines) {
        const prod = await Product.findById(line.product);
        if (!prod) continue;
        const extraPrice = line.variantExtraPrice || 0;
        const unit = (line.unitPrice !== undefined ? line.unitPrice : prod.salesPrice) + extraPrice;
        const qty = line.quantity || 1;
        const sub = unit * qty;

        let taxAmt = 0;
        const taxEntries = [];
        if (line.taxes && line.taxes.length > 0) {
          for (const t of line.taxes) {
            const calculated = (sub * t.rate) / 100;
            taxAmt += calculated;
            taxEntries.push({
              tax: t.tax,
              name: t.name,
              rate: t.rate,
              amount: Number(calculated.toFixed(2)),
            });
          }
        } else if (defaultTax) {
          taxAmt = (sub * defaultTax.rate) / 100;
          taxEntries.push({
            tax: defaultTax._id,
            name: defaultTax.name,
            rate: defaultTax.rate,
            amount: Number(taxAmt.toFixed(2)),
          });
        }

        calculatedLines.push({
          product: prod._id,
          variantName: line.variantName || '',
          variantExtraPrice: extraPrice,
          quantity: qty,
          unitPrice: unit,
          taxes: taxEntries,
          subtotal: Number(sub.toFixed(2)),
          taxAmount: Number(taxAmt.toFixed(2)),
          amount: Number((sub + taxAmt).toFixed(2)),
        });
      }
    }

    if (calculatedLines.length === 0) {
      // Default to the plan's base line
      const baseSub = plan.price * plan.minQuantity;
      let taxAmt = 0;
      const taxEntries = [];
      if (defaultTax) {
        taxAmt = (baseSub * defaultTax.rate) / 100;
        taxEntries.push({
          tax: defaultTax._id,
          name: defaultTax.name,
          rate: defaultTax.rate,
          amount: Number(taxAmt.toFixed(2)),
        });
      }
      calculatedLines.push({
        product: null,
        variantName: '',
        variantExtraPrice: 0,
        quantity: plan.minQuantity,
        unitPrice: plan.price,
        taxes: taxEntries,
        subtotal: Number(baseSub.toFixed(2)),
        taxAmount: Number(taxAmt.toFixed(2)),
        amount: Number((baseSub + taxAmt).toFixed(2)),
      });
    }

    const subtotal = calculatedLines.reduce((acc, l) => acc + l.subtotal, 0);
    const taxTotal = calculatedLines.reduce((acc, l) => acc + l.taxAmount, 0);

    // Process discount if code provided
    let discountDoc = null;
    let discountAmount = 0;
    if (discountCode) {
      discountDoc = await Discount.findOne({ code: discountCode.toUpperCase() });
      if (discountDoc) {
        const prodIds = calculatedLines.map((l) => l.product).filter(Boolean);
        const check = discountDoc.isValidForOrder(subtotal, calculatedLines.length, prodIds);
        if (check.valid) {
          if (discountDoc.type === 'percentage') {
            discountAmount = (subtotal * discountDoc.value) / 100;
          } else {
            discountAmount = Math.min(discountDoc.value, subtotal);
          }
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount + taxTotal);
    const start = startDate ? new Date(startDate) : new Date();

    // Default expiry 1 year or according to plan
    let expiry = expiryDate ? new Date(expiryDate) : new Date(start);
    if (!expiryDate) {
      expiry.setFullYear(expiry.getFullYear() + 1);
    }

    const nextInvoice = calculateNextDate(start, plan.billingPeriod);
    const subscriptionNumber = await generateSubscriptionNumber();

    const subscription = await Subscription.create({
      subscriptionNumber,
      customer,
      plan: plan._id,
      startDate: start,
      expiryDate: expiry,
      nextInvoiceDate: nextInvoice,
      paymentTerms: paymentTerms || 'net15',
      status: 'Draft',
      statusHistory: [
        {
          fromStatus: 'None',
          toStatus: 'Draft',
          changedBy: req.user._id,
          reason: 'Initial creation',
          timestamp: new Date(),
        },
      ],
      lines: calculatedLines,
      subtotal: Number(subtotal.toFixed(2)),
      discount: discountDoc ? discountDoc._id : null,
      discountAmount: Number(discountAmount.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      quotationTemplate: templateId || null,
      notes: notes || '',
    });

    const populated = await Subscription.findById(subscription._id)
      .populate('customer', 'name email company')
      .populate('plan')
      .populate('lines.product');

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully in Draft status.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Transition subscription status with strict validation & audit log
 * Draft → Quotation → Confirmed → Active → Closed
 */
export const transitionStatus = async (req, res, next) => {
  try {
    const { status: targetStatus, reason } = req.body;
    const subscription = await Subscription.findById(req.params.id).populate('plan');

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    // Role check: Only admin and staff can transition status
    if (req.user.role === 'customer') {
      return res.status(403).json({ success: false, message: 'Forbidden: Customers cannot transition subscription status.' });
    }

    // Validate transition
    if (!subscription.canTransitionTo(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${subscription.status}' to '${targetStatus}'. Allowed: ${(
          VALID_TRANSITIONS[subscription.status] || []
        ).join(', ') || 'None'}`,
      });
    }

    // Check plan policy if pausing or closing
    if (targetStatus === 'Paused' && !subscription.plan.allowPause) {
      return res.status(400).json({
        success: false,
        message: 'Pausing is not allowed by this plan policy.',
      });
    }

    if (targetStatus === 'Closed' && !subscription.plan.allowEarlyClose && new Date() < subscription.expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Early close is disallowed by this plan policy before expiry date.',
      });
    }

    const previousStatus = subscription.status;
    subscription.status = targetStatus;

    // Add status history entry
    subscription.statusHistory.push({
      fromStatus: previousStatus,
      toStatus: targetStatus,
      changedBy: req.user._id,
      reason: reason || `Status changed from ${previousStatus} to ${targetStatus}`,
      timestamp: new Date(),
    });

    // If activated, ensure nextInvoiceDate is set
    if (targetStatus === 'Active' && !subscription.nextInvoiceDate) {
      subscription.nextInvoiceDate = calculateNextDate(subscription.startDate, subscription.plan.billingPeriod);
    }

    await subscription.save();

    res.status(200).json({
      success: true,
      message: `Subscription status updated to ${targetStatus}.`,
      data: subscription,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Renew subscription
 */
export const renewSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id).populate('plan');
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    if (!subscription.plan.allowRenew) {
      return res.status(400).json({
        success: false,
        message: 'Renewal is disallowed by this plan policy.',
      });
    }

    const currentExpiry = new Date(subscription.expiryDate);
    const newExpiry = new Date(currentExpiry);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);

    const prevStatus = subscription.status;
    subscription.expiryDate = newExpiry;
    subscription.status = 'Active';

    subscription.statusHistory.push({
      fromStatus: prevStatus,
      toStatus: 'Active',
      changedBy: req.user._id,
      reason: `Renewed subscription until ${newExpiry.toLocaleDateString()}`,
      timestamp: new Date(),
    });

    await subscription.save();

    res.status(200).json({
      success: true,
      message: `Subscription renewed until ${newExpiry.toLocaleDateString()}.`,
      data: subscription,
    });
  } catch (err) {
    next(err);
  }
};
