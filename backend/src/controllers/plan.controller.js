import { Plan } from '../models/Plan.js';

export const listPlans = async (req, res, next) => {
  try {
    const query = {};
    if (req.user && req.user.role === 'customer') {
      const now = new Date();
      query.isActive = true;
      query.availableFrom = { $lte: now };
      query.$or = [{ availableTo: null }, { availableTo: { $gte: now } }];
    } else if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    if (req.query.billingPeriod) query.billingPeriod = req.query.billingPeriod;

    const plans = await Plan.find(query).sort({ price: 1 });
    res.status(200).json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
};

export const getPlanById = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }
    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

export const createPlan = async (req, res, next) => {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Plan created successfully.',
      data: plan,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Plan updated successfully.',
      data: plan,
    });
  } catch (err) {
    next(err);
  }
};

export const deletePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Plan marked as inactive.',
    });
  } catch (err) {
    next(err);
  }
};
