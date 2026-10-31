import { Router } from 'express';
import * as taxController from '../controllers/tax.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', taxController.listTaxes);

// Admin only
router.post('/', authorize('admin'), taxController.createTax);
router.put('/:id', authorize('admin'), taxController.updateTax);
router.delete('/:id', authorize('admin'), taxController.deleteTax);

export default router;
