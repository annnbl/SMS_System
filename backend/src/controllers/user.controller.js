import { User } from '../models/User.js';
import { validatePasswordStrength } from '../utils/passwordValidator.js';

/**
 * List users (Admin & Staff)
 */
export const listUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { company: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: users,
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

/**
 * Create Staff account (Admin only)
 */
export const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, phone, company } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.message,
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const staffUser = await User.create({
      name,
      email,
      password,
      role: 'staff',
      phone,
      company: company || 'Brightloop Internal',
    });

    res.status(201).json({
      success: true,
      message: 'Internal staff account created successfully.',
      data: staffUser,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create Customer account (Admin & Staff)
 */
export const createCustomer = async (req, res, next) => {
  try {
    const { name, email, password, company, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.message,
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    const customer = await User.create({
      name,
      email,
      password,
      role: 'customer',
      company,
      phone,
      address,
    });

    res.status(201).json({
      success: true,
      message: 'Customer account created successfully.',
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res, next) => {
  try {
    // If customer, can only fetch own id
    if (req.user.role === 'customer' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * Update user
 */
export const updateUser = async (req, res, next) => {
  try {
    if (req.user.role === 'customer' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const updates = { ...req.body };
    delete updates.password; // use dedicated endpoint for password changes
    delete updates.refreshToken;
    delete updates.resetPasswordToken;

    // Only admin can change roles or isActive status
    if (req.user.role !== 'admin') {
      delete updates.role;
      delete updates.isActive;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};
