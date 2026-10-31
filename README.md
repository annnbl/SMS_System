# Brightloop Subscription Management

## v1: Foundation (this version)
Run: `pip install flask` then `python app.py` (API on http://localhost:5000).
Seeded admin: `admin@brightloop.com` / `Admin@12345` (change it).

| Endpoint | Who | What |
|---|---|---|
| POST /api/register | public | customer sign-up (unique email, password >8 chars, upper, lower, special) |
| POST /api/login | public | returns bearer token + role |
| POST /api/forgot, /api/reset | public | reset link (printed to console until v4 adds SMTP) |
| POST /api/staff | admin | only the admin can add staff |
| GET/POST /api/products | admin (write), staff (read) | product + variants (e.g. Brand=Odoo, +560) |
| GET/POST /api/plans | admin (write) | daily / weekly / monthly / yearly |
| POST /api/taxes | admin | tax rates |
| GET/POST /api/discounts | admin (write) | fixed/percent, min amount/qty, dates, usage limit, product-specific or whole subscription |

Send `Authorization: Bearer <token>` on protected calls.

Schema for subscriptions, invoices, payments and performance indexes is already in place.

## Roadmap
- **v2** Subscriptions, price calculation (variant + discount + tax), invoice generation, renewal job
- **v3** Payments recorded against invoices, paid/outstanding/overdue status, customer portal endpoints
- **v4** Finance dashboard (active subs, MRR, revenue, owed, overdue, filters), web UI, email sending
