import { Router } from 'express';
import * as planController from '../controllers/plan.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', planController.listPlans);
router.get('/:id', planController.getPlanById);

// Admin only
router.post('/', authorize('admin'), planController.createPlan);
router.put('/:id', authorize('admin'), planController.updatePlan);
router.delete('/:id', authorize('admin'), planController.deletePlan);

export default router;
