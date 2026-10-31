import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// Admin only reporting dashboard
router.get('/dashboard', authorize('admin'), reportController.getDashboardMetrics);

export default router;
