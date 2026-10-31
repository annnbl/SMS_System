import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// List invoices (Customer scoped to own; Admin/Staff see all)
router.get('/', invoiceController.listInvoices);
router.get('/:id', invoiceController.getInvoiceById);

// Stream PDF (Customer allowed for own invoices, Admin/Staff for all)
router.get('/:id/pdf', invoiceController.printInvoicePDF);

// Admin & Staff operations
router.post('/generate/:subscriptionId', authorize('admin', 'staff'), invoiceController.generateInvoice);
router.post('/:id/confirm', authorize('admin', 'staff'), invoiceController.confirmInvoice);
router.post('/:id/cancel', authorize('admin', 'staff'), invoiceController.cancelInvoice);
router.post('/:id/send', authorize('admin', 'staff'), invoiceController.sendInvoice);

export default router;
