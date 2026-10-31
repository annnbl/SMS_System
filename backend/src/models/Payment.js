import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: [true, 'Invoice is required'],
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Payment amount must be greater than zero'],
    },
    method: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'stripe', 'paypal', 'cash', 'other'],
      default: 'credit_card',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ invoice: 1, paymentDate: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
