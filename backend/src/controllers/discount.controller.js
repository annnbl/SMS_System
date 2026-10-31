import { Discount } from '../models/Discount.js';

export const listDiscounts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      query.$or = [
        { code: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const [discounts, total] = await Promise.all([
      Discount.find(query).populate('applicableProducts', 'name salesPrice').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Discount.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: discounts,
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

export const getDiscountById = async (req, res, next) => {
  try {
    const discount = await Discount.findById(req.params.id).populate('applicableProducts', 'name salesPrice');
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found.' });
    }
    res.status(200).json({ success: true, data: discount });
  } catch (err) {
    next(err);
  }
};

export const createDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Discount created successfully.',
      data: discount,
    });
  } catch (err) {
    next(err);
  }
};

export const updateDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Discount updated successfully.',
      data: discount,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Discount deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Validate a discount code against order parameters
 */
export const validateDiscountCode = async (req, res, next) => {
  try {
    const { code, amount, quantity, productIds } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Discount code is required.' });
    }

    const discount = await Discount.findOne({ code: code.toUpperCase() });
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Invalid discount code.' });
    }

    const check = discount.isValidForOrder(amount, quantity, productIds || []);
    if (!check.valid) {
      return res.status(400).json({ success: false, message: check.reason });
    }

    let calculatedDiscount = 0;
    if (discount.type === 'percentage') {
      calculatedDiscount = (amount * discount.value) / 100;
    } else {
      calculatedDiscount = Math.min(discount.value, amount);
    }

    res.status(200).json({
      success: true,
      message: 'Discount is valid.',
      data: {
        discountId: discount._id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        calculatedDiscount: Number(calculatedDiscount.toFixed(2)),
      },
    });
  } catch (err) {
    next(err);
  }
};
