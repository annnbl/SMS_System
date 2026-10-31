import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice.js';
import { Subscription } from '../models/Subscription.js';
import { Discount } from '../models/Discount.js';
import { calculateNextDate } from './subscription.controller.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { sendInvoiceEmail } from '../utils/mailer.js';

// Unique invoice number generator
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}-${String(count + 1).padStart(4, '0')}-${randomSuffix}`;
};

/**
 * Helper to bill a subscription for a given period start safely and idempotently
 */
export const createInvoiceFromSubscription = async (subscriptionId, periodStart = null) => {
  const subscription = await Subscription.findById(subscriptionId)
    .populate('customer')
    .populate('plan')
    .populate('lines.product');

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (subscription.status !== 'Active') {
    throw new Error(`Cannot invoice subscription with status '${subscription.status}'`);
  }

  const pStart = periodStart ? new Date(periodStart) : new Date(subscription.startDate);
  const pEnd = calculateNextDate(pStart, subscription.plan.billingPeriod);

  // Check if invoice already exists for this exact period start (Idempotency safeguard)
  const existing = await Invoice.findOne({
    subscription: subscription._id,
    billingPeriodStart: pStart,
  });

  if (existing) {
    return { invoice: existing, created: false };
  }

  // Calculate payment due date based on payment terms
  const dueDate = new Date();
  switch (subscription.paymentTerms) {
    case 'immediate':
      dueDate.setDate(dueDate.getDate() + 1);
      break;
    case 'net15':
      dueDate.setDate(dueDate.getDate() + 15);
      break;
    case 'net30':
      dueDate.setDate(dueDate.getDate() + 30);
      break;
    case 'net60':
      dueDate.setDate(dueDate.getDate() + 60);
      break;
    default:
      dueDate.setDate(dueDate.getDate() + 15);
  }

  // Prepare invoice lines
  const invoiceLines = subscription.lines.map((l) => ({
    product: l.product ? l.product._id : null,
    description: l.product
      ? `${l.product.name}${l.variantName ? ` - ${l.variantName}` : ''}`
      : `${subscription.plan.name} Base Subscription`,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    subtotal: l.subtotal,
    taxes: l.taxes.map((t) => ({ name: t.name, rate: t.rate, amount: t.amount })),
    taxAmount: l.taxAmount,
    total: l.amount,
  }));

  // Check if discount is active and valid
  let appliedDiscount = 0;
  if (subscription.discount) {
    const discount = await Discount.findById(subscription.discount);
    if (discount) {
      const prodIds = subscription.lines.map((l) => l.product ? l.product._id : null).filter(Boolean);
      const validity = discount.isValidForOrder(subscription.subtotal, subscription.lines.length, prodIds);
      if (validity.valid) {
        if (discount.type === 'percentage') {
          appliedDiscount = (subscription.subtotal * discount.value) / 100;
        } else {
          appliedDiscount = Math.min(discount.value, subscription.subtotal);
        }
        // Increment discount usage atomically
        await Discount.findByIdAndUpdate(discount._id, { $inc: { usageCount: 1 } });
      }
    }
  }

  const invoiceNumber = await generateInvoiceNumber();
  const totalAmount = Math.max(0, subscription.subtotal - appliedDiscount + subscription.taxTotal);

  const invoice = await Invoice.create({
    invoiceNumber,
    subscription: subscription._id,
    customer: subscription.customer._id,
    billingPeriodStart: pStart,
    billingPeriodEnd: pEnd,
    dueDate,
    status: 'Draft',
    lines: invoiceLines,
    subtotal: subscription.subtotal,
    discountAmount: Number(appliedDiscount.toFixed(2)),
    taxTotal: subscription.taxTotal,
    totalAmount: Number(totalAmount.toFixed(2)),
    amountPaid: 0,
    amountDue: Number(totalAmount.toFixed(2)),
    notes: `Recurring billing for ${subscription.plan.name} (${subscription.plan.billingPeriod})`,
  });

  // Advance subscription nextInvoiceDate
  subscription.nextInvoiceDate = pEnd;
  await subscription.save();

  return { invoice, created: true };
};

/**
 * List invoices (paginated, customer scoped, filtered by status/date)
 */
export const listInvoices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const query = {};

    // Customer scoping: customers only see their own invoices
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (req.query.customer) {
      query.customer = req.query.customer;
    }

    if (req.query.status) query.status = req.query.status;
    if (req.query.subscription) query.subscription = req.query.subscription;
    if (req.query.search) {
      query.invoiceNumber = { $regex: req.query.search, $options: 'i' };
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('customer', 'name email company')
        .populate('subscription', 'subscriptionNumber plan')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: invoices,
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
 * Get single invoice
 */
export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name email company phone address')
      .populate({
        path: 'subscription',
        populate: { path: 'plan' },
      })
      .populate('lines.product');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (req.user.role === 'customer' && invoice.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

/**
 * Manually trigger invoice generation for a subscription
 */
export const generateInvoice = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const { periodStart } = req.body;
    const result = await createInvoiceFromSubscription(subscriptionId, periodStart);

    res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.created ? 'Invoice generated successfully.' : 'Invoice already existed for this billing period.',
      data: result.invoice,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Confirm draft invoice -> status: Confirmed
 */
export const confirmInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    if (invoice.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Only Draft invoices can be confirmed. Current status: ${invoice.status}`,
      });
    }

    invoice.status = 'Confirmed';
    await invoice.save();

    res.status(200).json({
      success: true,
      message: 'Invoice confirmed.',
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Cancel invoice
 */
export const cancelInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    if (invoice.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an invoice that has already been Paid.',
      });
    }

    invoice.status = 'Cancelled';
    await invoice.save();

    res.status(200).json({
      success: true,
      message: 'Invoice cancelled.',
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Send invoice email to customer with PDF attachment
 */
export const sendInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('subscription');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    const pdfBuffer = await generateInvoicePDF(invoice);
    await sendInvoiceEmail(invoice.customer.email, invoice, pdfBuffer);

    invoice.sentAt = new Date();
    if (invoice.status === 'Draft') invoice.status = 'Confirmed';
    await invoice.save();

    res.status(200).json({
      success: true,
      message: `Invoice email successfully sent to ${invoice.customer.email}.`,
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Stream invoice as PDF for printing/downloading
 */
export const printInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('subscription');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    if (req.user.role === 'customer' && invoice.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
