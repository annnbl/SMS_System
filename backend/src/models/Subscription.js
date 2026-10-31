import mongoose from 'mongoose';

const subscriptionLineTaxSchema = new mongoose.Schema(
  {
    tax: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tax',
    },
    name: { type: String, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const subscriptionLineSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantName: { type: String, default: '' },
    variantExtraPrice: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxes: [subscriptionLineTaxSchema],
    subtotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    amount: { type: Number, required: true, default: 0 },
  },
  { _id: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan is required'],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    nextInvoiceDate: {
      type: Date,
      index: true,
    },
    paymentTerms: {
      type: String,
      enum: ['immediate', 'net15', 'net30', 'net60'],
      default: 'net15',
    },
    status: {
      type: String,
      enum: ['Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed'],
      default: 'Draft',
      index: true,
    },
    statusHistory: [statusHistorySchema],
    lines: [subscriptionLineSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discount',
      default: null,
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
    quotationTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuotationTemplate',
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

// Allowed status transitions
// Draft -> Quotation -> Confirmed -> Active -> Closed
// Paused is allowed if plan allows it when Active
export const VALID_TRANSITIONS = {
  Draft: ['Quotation', 'Closed'],
  Quotation: ['Draft', 'Confirmed', 'Closed'],
  Confirmed: ['Active', 'Closed'],
  Active: ['Paused', 'Closed'],
  Paused: ['Active', 'Closed'],
  Closed: ['Draft'], // allow renew/reopen to Draft
};

subscriptionSchema.methods.canTransitionTo = function (nextStatus) {
  const allowed = VALID_TRANSITIONS[this.status] || [];
  return allowed.includes(nextStatus);
};

// Compound index for billing cron job query optimization
subscriptionSchema.index({ status: 1, nextInvoiceDate: 1 });
subscriptionSchema.index({ status: 1, expiryDate: 1 });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
