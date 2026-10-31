import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// List payments (Customer scoped to own; Admin/Staff see all)
router.get('/', paymentController.listPayments);
router.get('/:id', paymentController.getPaymentById);

// Admin & Staff: Record payment against invoice
router.post('/', authorize('admin', 'staff'), paymentController.recordPayment);

export default router;
