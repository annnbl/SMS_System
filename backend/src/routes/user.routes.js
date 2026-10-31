import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// List users (Admin & Staff)
router.get('/', authorize('admin', 'staff'), userController.listUsers);

// Create Staff (ADMIN ONLY)
router.post('/staff', authorize('admin'), userController.createStaff);

// Create Customer (Admin & Staff)
router.post('/customer', authorize('admin', 'staff'), userController.createCustomer);

// Get User by ID
router.get('/:id', userController.getUserById);

// Update User
router.put('/:id', userController.updateUser);

export default router;
