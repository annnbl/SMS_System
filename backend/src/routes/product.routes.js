import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// Publicly visible to all authenticated roles
router.get('/', productController.listProducts);
router.get('/:id', productController.getProductById);

// Admin-only creation, mutation, and deletion
router.post('/', authorize('admin'), productController.createProduct);
router.put('/:id', authorize('admin'), productController.updateProduct);
router.delete('/:id', authorize('admin'), productController.deleteProduct);

export default router;
