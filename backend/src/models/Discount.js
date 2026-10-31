import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Discount code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    appliesTo: {
      type: String,
      enum: ['all', 'specific_products'],
      default: 'all',
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    startDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    endDate: {
      type: Date,
      default: null,
      index: true,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
      min: 1,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
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

// Helper method to check validity
discountSchema.methods.isValidForOrder = function (amount = 0, quantity = 1, productIds = []) {
  if (!this.isActive) return { valid: false, reason: 'Discount is not active' };

  const now = new Date();
  if (this.startDate && now < this.startDate) {
    return { valid: false, reason: 'Discount has not started yet' };
  }
  if (this.endDate && now > this.endDate) {
    return { valid: false, reason: 'Discount has expired' };
  }
  if (this.usageLimit !== null && this.usageCount >= this.usageLimit) {
    return { valid: false, reason: 'Discount usage limit reached' };
  }
  if (amount < this.minPurchaseAmount) {
    return { valid: false, reason: `Minimum purchase amount is $${this.minPurchaseAmount}` };
  }
  if (quantity < this.minQuantity) {
    return { valid: false, reason: `Minimum quantity required is ${this.minQuantity}` };
  }
  if (this.appliesTo === 'specific_products') {
    const applicableIds = this.applicableProducts.map((p) => p.toString());
    const matches = productIds.some((id) => applicableIds.includes(id.toString()));
    if (!matches) {
      return { valid: false, reason: 'Discount not applicable to these products' };
    }
  }
  return { valid: true };
};

export const Discount = mongoose.model('Discount', discountSchema);
