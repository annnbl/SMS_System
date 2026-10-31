import { Router } from 'express';
import * as discountController from '../controllers/discount.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// Admin only management
router.get('/', authorize('admin'), discountController.listDiscounts);
router.get('/:id', authorize('admin'), discountController.getDiscountById);
router.post('/', authorize('admin'), discountController.createDiscount);
router.put('/:id', authorize('admin'), discountController.updateDiscount);
router.delete('/:id', authorize('admin'), discountController.deleteDiscount);

// Validation can be performed by Admin & Staff during subscription creation
router.post('/validate', authorize('admin', 'staff'), discountController.validateDiscountCode);

export default router;
