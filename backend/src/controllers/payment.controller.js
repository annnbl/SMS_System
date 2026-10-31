import mongoose from 'mongoose';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';

// Unique payment number generator
const generatePaymentNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Payment.countDocuments();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PAY-${year}-${String(count + 1).padStart(4, '0')}-${randomSuffix}`;
};

/**
 * List payments (paginated, customer scoped)
 */
export const listPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (req.query.customer) {
      query.customer = req.query.customer;
    }

    if (req.query.invoice) query.invoice = req.query.invoice;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('customer', 'name email company')
        .populate('invoice', 'invoiceNumber totalAmount amountDue status')
        .populate('recordedBy', 'name email')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: payments,
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
 * Record payment against an invoice (supports partial payments & transactions)
 */
export const recordPayment = async (req, res, next) => {
  const session = await mongoose.startSession().catch(() => null);

  try {
    const { invoiceId, amount, method, referenceNumber, notes, paymentDate } = req.body;

    if (!invoiceId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid invoice ID and positive payment amount are required.',
      });
    }

    const executeInTransaction = async (sess) => {
      const invoice = await Invoice.findById(invoiceId).session(sess || null);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'Paid') {
        throw new Error('Invoice has already been fully paid');
      }
      if (invoice.status === 'Cancelled') {
        throw new Error('Cannot record payment for a cancelled invoice');
      }

      const paymentNumber = await generatePaymentNumber();
      const payment = new Payment({
        paymentNumber,
        invoice: invoice._id,
        customer: invoice.customer,
        amount: Number(amount),
        method: method || 'credit_card',
        referenceNumber: referenceNumber || '',
        notes: notes || '',
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        recordedBy: req.user._id,
      });

      await payment.save({ session: sess || undefined });

      // Update invoice amounts
      const newAmountPaid = Number((invoice.amountPaid + Number(amount)).toFixed(2));
      const newAmountDue = Math.max(0, Number((invoice.totalAmount - newAmountPaid).toFixed(2)));

      invoice.amountPaid = newAmountPaid;
      invoice.amountDue = newAmountDue;

      if (newAmountDue === 0) {
        invoice.status = 'Paid';
        invoice.paidAt = new Date();
      } else if (invoice.status === 'Draft') {
        invoice.status = 'Confirmed';
      }

      await invoice.save({ session: sess || undefined });

      return { payment, invoice };
    };

    let result;
    if (session) {
      try {
        session.startTransaction();
        result = await executeInTransaction(session);
        await session.commitTransaction();
      } catch (txnError) {
        await session.abortTransaction().catch(() => {});
        // If replica set is not configured on local MongoDB, fallback gracefully to non-transactional execution
        if (txnError.message && txnError.message.includes('Transaction numbers are only allowed on a replica set member or mongos')) {
          result = await executeInTransaction(null);
        } else {
          throw txnError;
        }
      } finally {
        session.endSession();
      }
    } else {
      result = await executeInTransaction(null);
    }

    res.status(201).json({
      success: true,
      message: `Payment of $${result.payment.amount.toFixed(2)} recorded successfully. Invoice status: ${result.invoice.status}.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'name email company')
      .populate('invoice')
      .populate('recordedBy', 'name');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    if (req.user.role === 'customer' && payment.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};
