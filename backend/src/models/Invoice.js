import mongoose from 'mongoose';

const invoiceLineTaxSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const invoiceLineSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, default: 0 },
    taxes: [invoiceLineTaxSchema],
    taxAmount: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    billingPeriodStart: {
      type: Date,
      required: true,
    },
    billingPeriodEnd: {
      type: Date,
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Confirmed', 'Paid', 'Cancelled', 'Overdue'],
      default: 'Draft',
      index: true,
    },
    lines: [invoiceLineSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxTotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountDue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Idempotent billing constraint: Never bill the same subscription for the same period start twice!
invoiceSchema.index({ subscription: 1, billingPeriodStart: 1 }, { unique: true });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ customer: 1, status: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
