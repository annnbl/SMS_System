import mongoose from 'mongoose';

const templateLineSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantName: {
      type: String,
      default: '',
    },
    variantExtraPrice: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const quotationTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      unique: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan is required'],
    },
    validityDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    lines: [templateLineSchema],
    terms: {
      type: String,
      default: 'Payment due per subscription agreement. Standard cancellation policy applies.',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const QuotationTemplate = mongoose.model('QuotationTemplate', quotationTemplateSchema);
