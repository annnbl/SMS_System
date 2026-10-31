import { QuotationTemplate } from '../models/QuotationTemplate.js';

export const listTemplates = async (req, res, next) => {
  try {
    const templates = await QuotationTemplate.find({ isActive: true })
      .populate('plan')
      .populate('lines.product');
    res.status(200).json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
};

export const getTemplateById = async (req, res, next) => {
  try {
    const template = await QuotationTemplate.findById(req.params.id)
      .populate('plan')
      .populate('lines.product');
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }
    res.status(200).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const template = await QuotationTemplate.create(req.body);
    const populated = await QuotationTemplate.findById(template._id)
      .populate('plan')
      .populate('lines.product');
    res.status(201).json({
      success: true,
      message: 'Quotation template created successfully.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const template = await QuotationTemplate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('plan')
      .populate('lines.product');

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Quotation template updated successfully.',
      data: template,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const template = await QuotationTemplate.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Template archived.',
    });
  } catch (err) {
    next(err);
  }
};
