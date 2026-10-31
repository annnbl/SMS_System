import { Router } from 'express';
import * as subController from '../controllers/subscription.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// List subscriptions (Customers scoped to own; Admin/Staff see all)
router.get('/', subController.listSubscriptions);
router.get('/:id', subController.getSubscriptionById);

// Creation and management (Admin & Staff)
router.post('/', authorize('admin', 'staff'), subController.createSubscription);
router.post('/:id/transition', authorize('admin', 'staff'), subController.transitionStatus);
router.post('/:id/renew', authorize('admin', 'staff', 'customer'), subController.renewSubscription);

export default router;
