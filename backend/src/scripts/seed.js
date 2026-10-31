import mongoose from 'mongoose';
import { connectDB, closeDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Plan } from '../models/Plan.js';
import { Tax } from '../models/Tax.js';
import { Discount } from '../models/Discount.js';
import { QuotationTemplate } from '../models/QuotationTemplate.js';
import { Subscription } from '../models/Subscription.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';

export const seedDatabase = async () => {
  try {
    console.log('--- Starting Brightloop Database Seeding ---');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Plan.deleteMany({}),
      Tax.deleteMany({}),
      Discount.deleteMany({}),
      QuotationTemplate.deleteMany({}),
      Subscription.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
    ]);

    // 1. Create Users
    console.log('[Seed] Creating Users (Admin, Staff, Customers)...');
    const admin = await User.create({
      name: 'Brightloop Admin',
      email: 'admin@brightloop.io',
      password: 'AdminPassword123!',
      role: 'admin',
      company: 'Brightloop Software Inc.',
      phone: '+1 (555) 019-2831',
      address: {
        street: '100 Innovation Way',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'United States',
      },
    });

    const staff = await User.create({
      name: 'Sarah Connor',
      email: 'staff@brightloop.io',
      password: 'StaffPassword123!',
      role: 'staff',
      company: 'Brightloop Operations',
      phone: '+1 (555) 014-9912',
    });

    const customer1 = await User.create({
      name: 'Alice Johnson',
      email: 'alice@acmecorp.com',
      password: 'CustomerPass123!',
      role: 'customer',
      company: 'Acme Corporation',
      phone: '+1 (555) 432-8811',
      address: {
        street: '450 Industrial Blvd',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'United States',
      },
    });

    const customer2 = await User.create({
      name: 'Robert Davis',
      email: 'bob@globex.com',
      password: 'CustomerPass123!',
      role: 'customer',
      company: 'Globex Software Ltd.',
      phone: '+1 (555) 761-4509',
      address: {
        street: '12 Tech Park Avenue',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'United States',
      },
    });

    // 2. Create Taxes
    console.log('[Seed] Creating Tax Rules...');
    const salesTax = await Tax.create({
      name: 'Sales Tax (10%)',
      rate: 10,
      type: 'percentage',
      isDefault: true,
      isActive: true,
    });

    const vatTax = await Tax.create({
      name: 'EU VAT (20%)',
      rate: 20,
      type: 'percentage',
      isDefault: false,
      isActive: true,
    });

    // 3. Create Products & Variants
    console.log('[Seed] Creating Products and Variants...');
    const erpProduct = await Product.create({
      name: 'BrightCloud ERP Suite',
      type: 'software',
      salesPrice: 1200,
      costPrice: 350,
      notes: 'Full multi-tenant cloud enterprise resource planning suite.',
      variants: [
        {
          name: 'Brand: Odoo Integration Edition',
          attribute: 'Brand',
          value: 'Odoo',
          extraPrice: 560,
        },
        {
          name: 'Brand: SAP S/4HANA Connector',
          attribute: 'Brand',
          value: 'SAP',
          extraPrice: 1400,
        },
      ],
      isActive: true,
    });

    const securityProduct = await Product.create({
      name: 'BrightShield Cloud Security Pro',
      type: 'software',
      salesPrice: 450,
      costPrice: 90,
      notes: 'Zero-trust real-time threat detection and automated compliance scanning.',
      variants: [
        {
          name: 'Tier: Standard Cloud',
          attribute: 'Tier',
          value: 'Standard',
          extraPrice: 0,
        },
        {
          name: 'Tier: Enterprise Zero-Trust High Availability',
          attribute: 'Tier',
          value: 'Enterprise',
          extraPrice: 250,
        },
      ],
      isActive: true,
    });

    const supportProduct = await Product.create({
      name: '24/7 Dedicated Priority SLA Support',
      type: 'service',
      salesPrice: 300,
      costPrice: 120,
      notes: 'Guaranteed 15-minute response time and dedicated account engineer.',
      variants: [],
      isActive: true,
    });

    // 4. Create Plans
    console.log('[Seed] Creating Subscription Plans...');
    const starterPlan = await Plan.create({
      name: 'Monthly Pro Starter',
      code: 'PRO-MONTHLY',
      description: 'Ideal for fast-growing businesses needing monthly agility.',
      price: 299,
      billingPeriod: 'monthly',
      minQuantity: 1,
      availableFrom: new Date('2024-01-01'),
      autoCloseOnEnd: true,
      allowEarlyClose: true,
      allowPause: true,
      allowRenew: true,
      isActive: true,
    });

    const enterprisePlan = await Plan.create({
      name: 'Annual Enterprise Power',
      code: 'ENT-YEARLY',
      description: 'Full-featured enterprise plan with yearly billing and guaranteed SLA.',
      price: 2800,
      billingPeriod: 'yearly',
      minQuantity: 1,
      availableFrom: new Date('2024-01-01'),
      autoCloseOnEnd: false,
      allowEarlyClose: false,
      allowPause: true,
      allowRenew: true,
      isActive: true,
    });

    const weeklySprintPlan = await Plan.create({
      name: 'Sprint Pass (Weekly)',
      code: 'SPRINT-WEEKLY',
      description: 'Temporary sandbox pass for rapid prototyping and sprint testing.',
      price: 89,
      billingPeriod: 'weekly',
      minQuantity: 1,
      availableFrom: new Date('2024-01-01'),
      autoCloseOnEnd: true,
      allowEarlyClose: true,
      allowPause: false,
      allowRenew: true,
      isActive: true,
    });

    // 5. Create Discounts
    console.log('[Seed] Creating Discounts...');
    const launchDiscount = await Discount.create({
      code: 'LAUNCH20',
      description: '20% off all software and subscriptions for early adopters',
      type: 'percentage',
      value: 20,
      appliesTo: 'all',
      minPurchaseAmount: 100,
      minQuantity: 1,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2027-12-31'),
      usageLimit: 100,
      usageCount: 3,
      isActive: true,
    });

    const enterpriseDiscount = await Discount.create({
      code: 'ENTERPRISE150',
      description: '$150 flat discount on ERP suites',
      type: 'fixed',
      value: 150,
      appliesTo: 'specific_products',
      applicableProducts: [erpProduct._id],
      minPurchaseAmount: 500,
      minQuantity: 1,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2027-12-31'),
      usageLimit: 50,
      usageCount: 1,
      isActive: true,
    });

    // 6. Create Quotation Template
    console.log('[Seed] Creating Quotation Template...');
    const enterpriseTemplate = await QuotationTemplate.create({
      name: 'Complete Cloud Transformation Package',
      plan: enterprisePlan._id,
      validityDays: 30,
      terms: 'Net 30 payment terms. Includes dedicated migration assistance.',
      lines: [
        {
          product: erpProduct._id,
          variantName: 'Brand: Odoo Integration Edition',
          variantExtraPrice: 560,
          quantity: 1,
          unitPrice: 1200 + 560,
          description: 'BrightCloud ERP Suite - Odoo Edition',
        },
        {
          product: supportProduct._id,
          variantName: '',
          variantExtraPrice: 0,
          quantity: 1,
          unitPrice: 300,
          description: '24/7 Priority Support SLA',
        },
      ],
      isActive: true,
    });

    // 7. Create Subscriptions
    console.log('[Seed] Creating Subscriptions & History...');
    const subStartDate = new Date();
    subStartDate.setMonth(subStartDate.getMonth() - 2);

    const subExpiryDate = new Date(subStartDate);
    subExpiryDate.setFullYear(subExpiryDate.getFullYear() + 1);

    const nextBilling = new Date();
    nextBilling.setDate(nextBilling.getDate() + 15);

    const erpLineUnit = 1200 + 560; // 1760
    const erpLineTax = (erpLineUnit * 10) / 100; // 176
    const supportLineTax = (300 * 10) / 100; // 30
    const subtotal = erpLineUnit + 300; // 2060
    const taxTotal = erpLineTax + supportLineTax; // 206
    const discountAmt = (subtotal * 20) / 100; // 412
    const totalAmount = subtotal - discountAmt + taxTotal; // 1854

    const activeSubAcme = await Subscription.create({
      subscriptionNumber: 'SUB-2026-0001-8841',
      customer: customer1._id,
      plan: enterprisePlan._id,
      startDate: subStartDate,
      expiryDate: subExpiryDate,
      nextInvoiceDate: nextBilling,
      paymentTerms: 'net15',
      status: 'Active',
      statusHistory: [
        {
          fromStatus: 'None',
          toStatus: 'Draft',
          changedBy: admin._id,
          reason: 'Initial consultation and quotation',
          timestamp: subStartDate,
        },
        {
          fromStatus: 'Draft',
          toStatus: 'Quotation',
          changedBy: staff._id,
          reason: 'Sent formal quote to Acme Corp procurement',
          timestamp: new Date(subStartDate.getTime() + 86400000),
        },
        {
          fromStatus: 'Quotation',
          toStatus: 'Confirmed',
          changedBy: staff._id,
          reason: 'Customer accepted agreement terms',
          timestamp: new Date(subStartDate.getTime() + 172800000),
        },
        {
          fromStatus: 'Confirmed',
          toStatus: 'Active',
          changedBy: admin._id,
          reason: 'First invoice processed; subscription activated',
          timestamp: new Date(subStartDate.getTime() + 259200000),
        },
      ],
      lines: [
        {
          product: erpProduct._id,
          variantName: 'Brand: Odoo Integration Edition',
          variantExtraPrice: 560,
          quantity: 1,
          unitPrice: erpLineUnit,
          taxes: [{ tax: salesTax._id, name: 'Sales Tax (10%)', rate: 10, amount: erpLineTax }],
          subtotal: erpLineUnit,
          taxAmount: erpLineTax,
          amount: erpLineUnit + erpLineTax,
        },
        {
          product: supportProduct._id,
          variantName: '',
          variantExtraPrice: 0,
          quantity: 1,
          unitPrice: 300,
          taxes: [{ tax: salesTax._id, name: 'Sales Tax (10%)', rate: 10, amount: supportLineTax }],
          subtotal: 300,
          taxAmount: supportLineTax,
          amount: 300 + supportLineTax,
        },
      ],
      subtotal,
      discount: launchDiscount._id,
      discountAmount: discountAmt,
      taxTotal,
      totalAmount,
      quotationTemplate: enterpriseTemplate._id,
      notes: 'Strategic account Acme Corporation - Enterprise Cloud agreement',
    });

    const quotationSubGlobex = await Subscription.create({
      subscriptionNumber: 'SUB-2026-0002-4192',
      customer: customer2._id,
      plan: starterPlan._id,
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 86400000),
      nextInvoiceDate: new Date(Date.now() + 30 * 86400000),
      paymentTerms: 'net30',
      status: 'Quotation',
      statusHistory: [
        {
          fromStatus: 'None',
          toStatus: 'Draft',
          changedBy: staff._id,
          reason: 'Draft proposal prepared for Globex',
          timestamp: new Date(),
        },
        {
          fromStatus: 'Draft',
          toStatus: 'Quotation',
          changedBy: staff._id,
          reason: 'Quotation pending approval by Robert Davis',
          timestamp: new Date(),
        },
      ],
      lines: [
        {
          product: securityProduct._id,
          variantName: 'Tier: Enterprise Zero-Trust High Availability',
          variantExtraPrice: 250,
          quantity: 1,
          unitPrice: 700,
          taxes: [{ tax: salesTax._id, name: 'Sales Tax (10%)', rate: 10, amount: 70 }],
          subtotal: 700,
          taxAmount: 70,
          amount: 770,
        },
      ],
      subtotal: 700,
      discountAmount: 0,
      taxTotal: 70,
      totalAmount: 770,
      notes: 'Globex Software proof of concept subscription',
    });

    // 8. Create Invoices
    console.log('[Seed] Creating Invoices (Paid, Confirmed, Overdue)...');
    // Past Paid Invoice
    const pastPeriodStart = new Date(subStartDate);
    const pastPeriodEnd = new Date(pastPeriodStart);
    pastPeriodEnd.setMonth(pastPeriodEnd.getMonth() + 1);

    const paidInvoice = await Invoice.create({
      invoiceNumber: 'INV-2026-0001-3012',
      subscription: activeSubAcme._id,
      customer: customer1._id,
      billingPeriodStart: pastPeriodStart,
      billingPeriodEnd: pastPeriodEnd,
      issueDate: pastPeriodStart,
      dueDate: new Date(pastPeriodStart.getTime() + 15 * 86400000),
      status: 'Paid',
      lines: [
        {
          product: erpProduct._id,
          description: 'BrightCloud ERP Suite - Brand: Odoo Integration Edition',
          quantity: 1,
          unitPrice: erpLineUnit,
          subtotal: erpLineUnit,
          taxes: [{ name: 'Sales Tax (10%)', rate: 10, amount: erpLineTax }],
          taxAmount: erpLineTax,
          total: erpLineUnit + erpLineTax,
        },
      ],
      subtotal: erpLineUnit,
      discountAmount: 200,
      taxTotal: erpLineTax,
      totalAmount: erpLineUnit - 200 + erpLineTax,
      amountPaid: erpLineUnit - 200 + erpLineTax,
      amountDue: 0,
      paidAt: new Date(pastPeriodStart.getTime() + 10 * 86400000),
      notes: 'Initial activation billing cycle.',
    });

    // Record Payment for paid invoice
    await Payment.create({
      paymentNumber: 'PAY-2026-0001-9021',
      invoice: paidInvoice._id,
      customer: customer1._id,
      amount: paidInvoice.totalAmount,
      method: 'bank_transfer',
      referenceNumber: 'WIRE-ACME-884912',
      notes: 'Full payment cleared via Silicon Valley Bank Wire.',
      recordedBy: staff._id,
      paymentDate: paidInvoice.paidAt,
    });

    // Overdue Invoice for demonstration and alerts
    const overdueIssueDate = new Date();
    overdueIssueDate.setDate(overdueIssueDate.getDate() - 35);
    const overdueDueDate = new Date();
    overdueDueDate.setDate(overdueDueDate.getDate() - 15);

    const overdueInvoice = await Invoice.create({
      invoiceNumber: 'INV-2026-0002-7719',
      subscription: activeSubAcme._id,
      customer: customer1._id,
      billingPeriodStart: overdueIssueDate,
      billingPeriodEnd: new Date(overdueIssueDate.getTime() + 30 * 86400000),
      issueDate: overdueIssueDate,
      dueDate: overdueDueDate,
      status: 'Overdue',
      lines: [
        {
          product: securityProduct._id,
          description: 'BrightShield Cloud Security Pro (Additional Nodes)',
          quantity: 2,
          unitPrice: 450,
          subtotal: 900,
          taxes: [{ name: 'Sales Tax (10%)', rate: 10, amount: 90 }],
          taxAmount: 90,
          total: 990,
        },
      ],
      subtotal: 900,
      discountAmount: 0,
      taxTotal: 90,
      totalAmount: 990,
      amountPaid: 300,
      amountDue: 690, // partial payment outstanding
      notes: 'Follow up sent to finance@acmecorp.com regarding remaining $690 balance.',
    });

    await Payment.create({
      paymentNumber: 'PAY-2026-0002-1144',
      invoice: overdueInvoice._id,
      customer: customer1._id,
      amount: 300,
      method: 'credit_card',
      referenceNumber: 'AUTH_CC_44921',
      notes: 'Partial payment made by Alice Johnson.',
      recordedBy: admin._id,
      paymentDate: overdueDueDate,
    });

    console.log('--- Database Seeding Complete! ---');
    console.log('Sample Accounts Created:');
    console.log('  [Admin]:    admin@brightloop.io / AdminPassword123!');
    console.log('  [Staff]:    staff@brightloop.io / StaffPassword123!');
    console.log('  [Customer]: alice@acmecorp.com  / CustomerPass123!');
    console.log('  [Customer]: bob@globex.com      / CustomerPass123!');
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
    throw err;
  }
};

// Allow direct CLI execution: node src/scripts/seed.js
if (process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      console.log('Seed execution finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed execution failed:', err);
      process.exit(1);
    });
}
