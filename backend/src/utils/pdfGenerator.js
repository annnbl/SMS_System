import PDFDocument from 'pdfkit';

/**
 * Generates a PDF buffer for an invoice
 * @param {Object} invoice Populated invoice document
 * @returns {Promise<Buffer>}
 */
export const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fillColor('#1e3a8a').fontSize(22).font('Helvetica-Bold').text('BRIGHTLOOP SOFTWARE', 50, 50);
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('Cloud & Enterprise Software Subscriptions', 50, 75);
      doc.text('billing@brightloop.io | www.brightloop.io', 50, 88);

      // Invoice info block right aligned
      doc.fillColor('#0f172a').fontSize(18).font('Helvetica-Bold').text('INVOICE', 350, 50, { align: 'right' });
      doc.fontSize(10).font('Helvetica').fillColor('#334155');
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, 350, 75, { align: 'right' });
      doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 350, 90, { align: 'right' });
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 350, 105, { align: 'right' });
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 350, 120, { align: 'right' });

      doc.moveTo(50, 140).lineTo(545, 140).strokeColor('#cbd5e1').stroke();

      // Bill To & Subscription details
      const customer = invoice.customer || {};
      doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 155);
      doc.fontSize(10).font('Helvetica').fillColor('#475569');
      doc.text(customer.name || 'Customer Name', 50, 172);
      if (customer.company) doc.text(customer.company, 50, 186);
      doc.text(customer.email || '', 50, customer.company ? 200 : 186);
      if (customer.phone) doc.text(customer.phone, 50, customer.company ? 214 : 200);

      doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('Subscription Details:', 320, 155);
      doc.fontSize(10).font('Helvetica').fillColor('#475569');
      const sub = invoice.subscription || {};
      doc.text(`Sub Number: ${sub.subscriptionNumber || 'N/A'}`, 320, 172);
      doc.text(`Period: ${new Date(invoice.billingPeriodStart).toLocaleDateString()} to ${new Date(invoice.billingPeriodEnd).toLocaleDateString()}`, 320, 186);

      // Line items table
      let y = 245;
      doc.rect(50, y, 495, 24).fill('#f1f5f9');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
      doc.text('DESCRIPTION', 60, y + 7);
      doc.text('QTY', 300, y + 7, { width: 40, align: 'center' });
      doc.text('UNIT PRICE', 350, y + 7, { width: 70, align: 'right' });
      doc.text('TAX', 425, y + 7, { width: 45, align: 'right' });
      doc.text('TOTAL', 475, y + 7, { width: 60, align: 'right' });

      y += 26;
      doc.font('Helvetica').fontSize(9).fillColor('#334155');

      (invoice.lines || []).forEach((line) => {
        doc.text(line.description || 'Product Item', 60, y, { width: 230 });
        doc.text(line.quantity.toString(), 300, y, { width: 40, align: 'center' });
        doc.text(`$${line.unitPrice.toFixed(2)}`, 350, y, { width: 70, align: 'right' });
        doc.text(`$${(line.taxAmount || 0).toFixed(2)}`, 425, y, { width: 45, align: 'right' });
        doc.text(`$${line.total.toFixed(2)}`, 475, y, { width: 60, align: 'right' });
        y += 24;
      });

      doc.moveTo(50, y + 5).lineTo(545, y + 5).strokeColor('#e2e8f0').stroke();
      y += 15;

      // Totals
      doc.font('Helvetica').fontSize(10).fillColor('#475569');
      doc.text('Subtotal:', 350, y, { width: 90, align: 'right' });
      doc.text(`$${invoice.subtotal.toFixed(2)}`, 450, y, { width: 85, align: 'right' });
      y += 18;

      if (invoice.discountAmount > 0) {
        doc.text('Discount:', 350, y, { width: 90, align: 'right' });
        doc.text(`-$${invoice.discountAmount.toFixed(2)}`, 450, y, { width: 85, align: 'right' });
        y += 18;
      }

      doc.text('Taxes:', 350, y, { width: 90, align: 'right' });
      doc.text(`$${invoice.taxTotal.toFixed(2)}`, 450, y, { width: 85, align: 'right' });
      y += 22;

      doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a');
      doc.text('Total Amount:', 350, y, { width: 90, align: 'right' });
      doc.text(`$${invoice.totalAmount.toFixed(2)}`, 450, y, { width: 85, align: 'right' });
      y += 20;

      doc.font('Helvetica').fontSize(10).fillColor('#475569');
      doc.text('Amount Paid:', 350, y, { width: 90, align: 'right' });
      doc.text(`$${invoice.amountPaid.toFixed(2)}`, 450, y, { width: 85, align: 'right' });
      y += 18;

      doc.font('Helvetica-Bold').fontSize(11).fillColor('#b91c1c');
      doc.text('Amount Due:', 350, y, { width: 90, align: 'right' });
      doc.text(`$${invoice.amountDue.toFixed(2)}`, 450, y, { width: 85, align: 'right' });

      // Footer
      doc.font('Helvetica').fontSize(9).fillColor('#94a3b8');
      doc.text(
        'Thank you for your business! For inquiries, contact support@brightloop.io.',
        50,
        750,
        { align: 'center', width: 495 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
