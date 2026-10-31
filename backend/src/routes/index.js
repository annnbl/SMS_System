import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import planRoutes from './plan.routes.js';
import taxRoutes from './tax.routes.js';
import discountRoutes from './discount.routes.js';
import quotationTemplateRoutes from './quotationTemplate.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import invoiceRoutes from './invoice.routes.js';
import paymentRoutes from './payment.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/plans', planRoutes);
router.use('/taxes', taxRoutes);
router.use('/discounts', discountRoutes);
router.use('/quotation-templates', quotationTemplateRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);

export default router;
