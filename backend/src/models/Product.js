import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    attribute: {
      type: String,
      required: true,
      trim: true, // e.g. "Brand", "Tier", "Region"
    },
    value: {
      type: String,
      required: true,
      trim: true, // e.g. "Odoo", "Enterprise", "US-East"
    },
    extraPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['software', 'service', 'addon', 'license'],
      default: 'software',
      index: true,
    },
    salesPrice: {
      type: Number,
      required: [true, 'Sales price is required'],
      min: [0, 'Sales price cannot be negative'],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    variants: [variantSchema],
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

productSchema.index({ name: 'text', notes: 'text' });

export const Product = mongoose.model('Product', productSchema);
