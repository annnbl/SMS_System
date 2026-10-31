# Brightloop Software — Subscription Management System (SMS)

A full-stack, enterprise-grade Subscription Management System built for **Brightloop Software**, selling software on monthly and yearly recurring subscriptions.

---

## 🚀 Technology Stack

- **Backend**: Node.js (ES Modules) + Express, MongoDB with Mongoose
- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons
- **Auth**: JWT (Access Token 15m + Refresh Token 7d), bcrypt password hashing, Role-Based Access Control (RBAC)
- **Email**: Nodemailer (Password reset single-use token links, invoice PDF delivery)
- **Scheduling & Crons**: `node-cron` (Automated recurring billing, contract expiry, overdue invoice marking)
- **Documents & Export**: PDFKit (Invoice PDF generation and direct stream download)

---

## 👥 Role-Based Access Control (RBAC)

1. **Admin** (`admin@brightloop.io` / `AdminPassword123!`):
   - Executive Dashboard with real-time financial aggregations (MRR, ARR, Collected Revenue, Receivables, Overdue Invoices).
   - Only role that can create internal staff accounts, promotional discounts, tax rules, products & variants, and subscription plans.
   - Manual scheduled jobs dispatcher (on-demand billing, expiry, overdue runs).
2. **Internal Staff** (`staff@brightloop.io` / `StaffPassword123!`):
   - Operations workspace: customer creation, subscription lifecycle transitions, manual invoice generation, and payment recording.
3. **Customer** (`alice@acmecorp.com` / `CustomerPass123!` or `bob@globex.com` / `CustomerPass123!`):
   - Scoped self-service portal: view **only** their own subscriptions, review invoices, download PDF receipts, and make payments.

---

## 📁 Repository Structure

```
SMS_System/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js                # Environment variable management
│   │   │   └── db.js                 # MongoDB connection with MongoMemoryServer fallback
│   │   ├── models/
│   │   │   ├── User.js               # Users, RBAC, password hashing & reset tokens
│   │   │   ├── Product.js            # Products & attribute variants (e.g. Brand +$560)
│   │   │   ├── Plan.js               # Plans, billing periods, lifecycle policies
│   │   │   ├── QuotationTemplate.js  # Quotation templates with product lines
│   │   │   ├── Tax.js                # Tax percentage & fixed rules
│   │   │   ├── Discount.js           # Coupons, min purchase, atomic counters
│   │   │   ├── Subscription.js       # Contracts, status state machine, audit log
│   │   │   ├── Invoice.js            # Invoices with idempotent composite index
│   │   │   └── Payment.js            # Payment receipts & transactional settlement
│   │   ├── middlewares/
│   │   │   ├── auth.js               # JWT auth & RBAC authorization
│   │   │   ├── validate.js           # Joi request validation
│   │   │   └── errorHandler.js       # Centralized error handler
│   │   ├── utils/
│   │   │   ├── passwordValidator.js  # >8 chars, uppercase, lowercase, special char
│   │   │   ├── mailer.js             # Nodemailer password reset & invoice email
│   │   │   └── pdfGenerator.js       # PDFKit invoice generator
│   │   ├── cron/
│   │   │   ├── billingJob.js         # Daily recurring billing
│   │   │   ├── expiryJob.js          # Auto-close on contract expiry
│   │   │   ├── overdueJob.js         # Nightly overdue invoice flagger
│   │   │   └── index.js              # node-cron scheduler
│   │   ├── controllers/              # Business logic per module
│   │   ├── routes/                   # Express route definitions
│   │   ├── scripts/
│   │   │   └── seed.js               # Comprehensive database seeder
│   │   ├── app.js                    # Express app configuration
│   │   └── server.js                 # HTTP server entrypoint
│   ├── .env.example
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/               # Navbar, Sidebar, Badge, Modal
│   │   ├── context/                  # AuthContext with token refresh
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Sign-in with quick one-click role demo buttons
│   │   │   ├── Register.jsx          # Sign-up with live password criteria validator
│   │   │   ├── ForgotPassword.jsx    # Password reset link request
│   │   │   ├── ResetPassword.jsx     # Password reset token confirmation
│   │   │   ├── Dashboard.jsx         # Executive metrics & MRR analytics
│   │   │   ├── Subscriptions.jsx     # Subscription lifecycle management
│   │   │   ├── Invoices.jsx          # Billing, PDF streaming, email dispatch
│   │   │   ├── Payments.jsx          # Payment receipts & partial payment settlement
│   │   │   ├── Products.jsx          # Software products & attribute variants
│   │   │   ├── Plans.jsx             # Subscription plans & lifecycle policies
│   │   │   ├── Discounts.jsx         # Admin discounts & usage counters
│   │   │   ├── Taxes.jsx             # Admin tax rules
│   │   │   ├── Templates.jsx         # Quotation templates
│   │   │   ├── Users.jsx             # Staff & Customer account directory
│   │   │   └── CustomerPortal.jsx    # Dedicated customer self-service portal
│   │   ├── services/                 # API client with token refresh
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 🛠️ Step-by-Step Run Instructions

### 1. Backend Setup
```bash
cd backend
npm install

# Start development server (auto-seeds sample data on first launch)
npm run dev
# Or start production server:
npm start
```
*Note: If local MongoDB is not running, the backend automatically boots an in-memory database (`MongoMemoryServer`), so it works with zero setup!*

### 2. Frontend Setup
```bash
cd frontend
npm install

# Start Vite dev server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🔑 Pre-Seeded Sample Accounts

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.io` | `AdminPassword123!` | Full system control, staff creation, analytics |
| **Staff** | `staff@brightloop.io` | `StaffPassword123!` | Operations, customers, subscriptions, billing |
| **Customer** | `alice@acmecorp.com` | `CustomerPass123!` | Acme Corporation client portal |
| **Customer** | `bob@globex.com` | `CustomerPass123!` | Globex Software client portal |

*(The login screen also provides convenient one-click quick login buttons for all three roles).*
