import { Tax } from '../models/Tax.js';

export const listTaxes = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    const taxes = await Tax.find(query).sort({ isDefault: -1, rate: 1 });
    res.status(200).json({ success: true, data: taxes });
  } catch (err) {
    next(err);
  }
};

export const createTax = async (req, res, next) => {
  try {
    const { name, rate, type, isDefault } = req.body;
    if (isDefault) {
      // Unset previous default
      await Tax.updateMany({ isDefault: true }, { isDefault: false });
    }
    const tax = await Tax.create({ name, rate, type, isDefault });
    res.status(201).json({
      success: true,
      message: 'Tax rule created successfully.',
      data: tax,
    });
  } catch (err) {
    next(err);
  }
};

export const updateTax = async (req, res, next) => {
  try {
    if (req.body.isDefault) {
      await Tax.updateMany({ isDefault: true }, { isDefault: false });
    }
    const tax = await Tax.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!tax) {
      return res.status(404).json({ success: false, message: 'Tax rule not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Tax rule updated successfully.',
      data: tax,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTax = async (req, res, next) => {
  try {
    const tax = await Tax.findByIdAndDelete(req.params.id);
    if (!tax) {
      return res.status(404).json({ success: false, message: 'Tax rule not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Tax rule deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};
