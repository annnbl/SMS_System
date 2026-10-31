import { Router } from 'express';
import * as templateController from '../controllers/quotationTemplate.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// View templates (Admin & Staff)
router.get('/', authorize('admin', 'staff'), templateController.listTemplates);
router.get('/:id', authorize('admin', 'staff'), templateController.getTemplateById);

// Admin only creation and modifications
router.post('/', authorize('admin'), templateController.createTemplate);
router.put('/:id', authorize('admin'), templateController.updateTemplate);
router.delete('/:id', authorize('admin'), templateController.deleteTemplate);

export default router;
