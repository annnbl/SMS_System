import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

let transporter = null;

export const initMailer = async () => {
  if (ENV.SMTP_USER && ENV.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_PORT === 465,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
    });
  } else {
    // Generate test SMTP service account from ethereal.email if no credentials
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Mailer] Initialized Ethereal test mailer with account: ${testAccount.user}`);
    } catch (err) {
      console.warn('[Mailer] Could not create Ethereal account, using console logging mailer fallback:', err.message);
      transporter = {
        sendMail: async (opts) => {
          console.log(`\n================ MAIL SENT ================`);
          console.log(`To: ${opts.to}`);
          console.log(`Subject: ${opts.subject}`);
          console.log(`Text: ${opts.text || ''}`);
          console.log(`HTML: ${opts.html || ''}`);
          console.log(`===========================================\n`);
          return { messageId: 'simulated-' + Date.now() };
        },
      };
    }
  }
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
  if (!transporter) await initMailer();

  const mailOptions = {
    from: ENV.SMTP_FROM,
    to: email,
    subject: 'Brightloop Software - Password Reset Request',
    text: `You have requested a password reset. Click the following link to reset your password (valid for 1 hour):\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a;">Brightloop Software</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your Subscription Management account.</p>
        <p style="margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </p>
        <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour and can only be used once.</p>
        <p style="color: #64748b; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} Brightloop Software Inc. All rights reserved.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  if (nodemailer.getTestMessageUrl && info && info.messageId && !info.messageId.startsWith('simulated')) {
    console.log('[Mailer] Password Reset Preview URL:', nodemailer.getTestMessageUrl(info));
  }
  return info;
};

export const sendInvoiceEmail = async (email, invoice, pdfBuffer = null) => {
  if (!transporter) await initMailer();

  const mailOptions = {
    from: ENV.SMTP_FROM,
    to: email,
    subject: `Brightloop Software - Invoice #${invoice.invoiceNumber}`,
    text: `Dear Customer,\n\nPlease find attached your invoice #${invoice.invoiceNumber} for the amount of $${invoice.totalAmount.toFixed(2)}.\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}.\n\nThank you for choosing Brightloop Software!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a;">Brightloop Software</h2>
        <h3>Invoice #${invoice.invoiceNumber}</h3>
        <p>Dear Customer,</p>
        <p>Your subscription invoice is now ready.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f8fafc;">
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Total Amount:</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">$${invoice.totalAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Amount Due:</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">$${invoice.amountDue.toFixed(2)}</td>
          </tr>
          <tr style="background: #f8fafc;">
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Due Date:</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Status:</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${invoice.status}</td>
          </tr>
        </table>
        <p>Please log in to your Customer Portal to review your subscription and submit payment.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} Brightloop Software Inc.</p>
      </div>
    `,
    attachments: pdfBuffer
      ? [
          {
            filename: `Invoice-${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : [],
  };

  const info = await transporter.sendMail(mailOptions);
  if (nodemailer.getTestMessageUrl && info && info.messageId && !info.messageId.startsWith('simulated')) {
    console.log('[Mailer] Invoice Preview URL:', nodemailer.getTestMessageUrl(info));
  }
  return info;
};
