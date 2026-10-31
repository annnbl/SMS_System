import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Plan code is required'],
      trim: true,
      uppercase: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative'],
    },
    billingPeriod: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: [true, 'Billing period is required'],
      index: true,
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    availableFrom: {
      type: Date,
      default: Date.now,
      index: true,
    },
    availableTo: {
      type: Date,
      default: null,
      index: true,
    },
    autoCloseOnEnd: {
      type: Boolean,
      default: true,
    },
    allowEarlyClose: {
      type: Boolean,
      default: true,
    },
    allowPause: {
      type: Boolean,
      default: true,
    },
    allowRenew: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Plan = mongoose.model('Plan', planSchema);
