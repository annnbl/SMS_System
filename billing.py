"""Brightloop v2: subscriptions, pricing, invoicing, renewals, stats."""
import datetime as dt, calendar

D = dt.date


def add_months(d, n):
    m = d.month - 1 + n
    y, m = d.year + m // 12, m % 12 + 1
    return D(y, m, min(d.day, calendar.monthrange(y, m)[1]))


def advance(d, period):
    if period == "daily": return d + dt.timedelta(days=1)
    if period == "weekly": return d + dt.timedelta(days=7)
    return add_months(d, 1 if period == "monthly" else 12)


def register(app, db, rows, auth, err):
    from flask import request, jsonify, g

    # ---------- pricing: variant -> best discount -> tax ----------
    def quote(plan_id, variant_id, qty, on):
        plan = db().execute("SELECT * FROM plans WHERE id=?", (plan_id,)).fetchone()
        if not plan: return None, "Plan not found"
        qty = int(qty or 1)
        if qty < plan["min_quantity"]: return None, f"Minimum quantity for this plan is {plan['min_quantity']}"
        extra = 0
        if variant_id:
            v = db().execute("SELECT extra_price FROM variants WHERE id=? AND product_id=?",
                             (variant_id, plan["product_id"])).fetchone()
            if not v: return None, "Variant does not belong to this plan's product"
            extra = v["extra_price"]
        unit = plan["price"] + extra
        sub = round(unit * qty, 2)
        best, best_amt = None, 0
        for d in rows("SELECT * FROM discounts WHERE (start_date IS NULL OR start_date<=?) "
                      "AND (end_date IS NULL OR end_date>=?) AND (max_uses IS NULL OR times_used<max_uses) "
                      "AND min_amount<=? AND min_quantity<=? AND (product_id IS NULL OR product_id=?)",
                      (on, on, sub, qty, plan["product_id"])):
            amt = d["value"] if d["kind"] == "fixed" else sub * d["value"] / 100
            amt = min(round(amt, 2), sub)
            if amt > best_amt: best, best_amt = d, amt
        rate = db().execute("SELECT COALESCE(SUM(rate_percent),0) FROM taxes").fetchone()[0]
        tax = round((sub - best_amt) * rate / 100, 2)
        return dict(quantity=qty, unit_price=unit, subtotal=sub, discount=best_amt,
                    discount_name=best["name"] if best else None, discount_id=best["id"] if best else None,
                    tax_rate=rate, tax=tax, total=round(sub - best_amt + tax, 2)), None

    def mark_overdue():
        db().execute("UPDATE invoices SET status='overdue' WHERE status='sent' AND due_date<?",
                     (D.today().isoformat(),))

    def make_invoice(s):
        today = D.today()
        plan = db().execute("SELECT * FROM plans WHERE id=?", (s["plan_id"],)).fetchone()
        q, e = quote(s["plan_id"], s["variant_id"], s["quantity"], today.isoformat())
        if e: return None
        cur = db().execute(
            "INSERT INTO invoices(subscription_id,customer_id,issue_date,due_date,subtotal,discount,tax,total,status)"
            " VALUES(?,?,?,?,?,?,?,?,'sent')",
            (s["id"], s["customer_id"], today.isoformat(), (today + dt.timedelta(days=14)).isoformat(),
             q["subtotal"], q["discount"], q["tax"], q["total"]))
        number = f"INV-{cur.lastrowid:06d}"
        db().execute("UPDATE invoices SET number=? WHERE id=?", (number, cur.lastrowid))
        if q["discount_id"]:
            db().execute("UPDATE discounts SET times_used=times_used+1 WHERE id=?", (q["discount_id"],))
        nxt = advance(D.fromisoformat(s["next_billing_date"]), plan["billing_period"]).isoformat()
        status = "active"
        if (not plan["auto_renew"] or (plan["end_date"] and nxt > plan["end_date"])
                or (s["end_date"] and nxt > s["end_date"])):
            status = "expired"
        db().execute("UPDATE subscriptions SET next_billing_date=?, status=? WHERE id=?", (nxt, status, s["id"]))
        return number

    def paging():
        lim = min(int(request.args.get("limit", 20)), 100)
        return lim, (max(int(request.args.get("page", 1)), 1) - 1) * lim

    # ---------- catalog / quote / lookups ----------
    @app.get("/api/catalog")
    @auth()
    def catalog():
        ps = rows("SELECT pl.*, p.name AS product_name FROM plans pl JOIN products p ON p.id=pl.product_id "
                  "WHERE (pl.end_date IS NULL OR pl.end_date>=?)", (D.today().isoformat(),))
        for p in ps: p["variants"] = rows("SELECT * FROM variants WHERE product_id=?", (p["product_id"],))
        return jsonify(ps)

    @app.post("/api/quote")
    @auth()
    def quote_ep():
        d = request.json or {}
        q, e = quote(d.get("plan_id"), d.get("variant_id"), d.get("quantity", 1), D.today().isoformat())
        return (err(e), ) if e else jsonify(q)

    @app.get("/api/customers")
    @auth("admin", "staff")
    def customers():
        return jsonify(rows("SELECT id,email,name FROM users WHERE role='customer' ORDER BY email"))

    @app.get("/api/taxes")
    @auth("admin", "staff")
    def taxes():
        return jsonify(rows("SELECT * FROM taxes"))

    # ---------- subscriptions ----------
    @app.post("/api/subscriptions")
    @auth()
    def create_sub():
        d = request.json or {}
        cid = g.user["id"] if g.user["role"] == "customer" else d.get("customer_id")
        if not cid: return err("customer_id required")
        q, e = quote(d.get("plan_id"), d.get("variant_id"), d.get("quantity", 1), D.today().isoformat())
        if e: return err(e)
        today = D.today().isoformat()
        cur = db().execute("INSERT INTO subscriptions(customer_id,plan_id,variant_id,quantity,status,start_date,next_billing_date)"
                           " VALUES(?,?,?,?, 'active',?,?)",
                           (cid, d["plan_id"], d.get("variant_id") or None, q["quantity"], today, today))
        s = dict(db().execute("SELECT * FROM subscriptions WHERE id=?", (cur.lastrowid,)).fetchone())
        number = make_invoice(s)
        db().commit()
        return jsonify(id=cur.lastrowid, first_invoice=number), 201

    @app.get("/api/subscriptions")
    @auth()
    def list_subs():
        lim, off = paging()
        w, a = [], []
        if g.user["role"] == "customer": w.append("s.customer_id=?"); a.append(g.user["id"])
        if request.args.get("status"): w.append("s.status=?"); a.append(request.args["status"])
        W = ("WHERE " + " AND ".join(w)) if w else ""
        total = db().execute(f"SELECT COUNT(*) FROM subscriptions s {W}", a).fetchone()[0]
        items = rows(f"SELECT s.*, u.email AS customer_email, p.name AS plan_name, p.billing_period "
                     f"FROM subscriptions s JOIN users u ON u.id=s.customer_id JOIN plans p ON p.id=s.plan_id "
                     f"{W} ORDER BY s.id DESC LIMIT ? OFFSET ?", a + [lim, off])
        return jsonify(items=items, total=total)

    @app.post("/api/subscriptions/<int:sid>/<action>")
    @auth()
    def sub_action(sid, action):
        s = db().execute("SELECT s.*, p.pausable FROM subscriptions s JOIN plans p ON p.id=s.plan_id "
                         "WHERE s.id=?", (sid,)).fetchone()
        if not s or (g.user["role"] == "customer" and s["customer_id"] != g.user["id"]):
            return err("Not found", 404)
        new = {"pause": "paused", "resume": "active", "cancel": "cancelled"}.get(action)
        if not new: return err("Unknown action")
        if s["status"] in ("cancelled", "expired"): return err("Subscription is already closed")
        if action == "pause" and not s["pausable"]: return err("This plan cannot be paused")
        db().execute("UPDATE subscriptions SET status=? WHERE id=?", (new, sid))
        db().commit()
        return jsonify(status=new)

    # ---------- invoices ----------
    @app.get("/api/invoices")
    @auth()
    def list_invoices():
        mark_overdue(); db().commit()
        lim, off = paging()
        w, a = [], []
        if g.user["role"] == "customer": w.append("i.customer_id=?"); a.append(g.user["id"])
        if request.args.get("status"): w.append("i.status=?"); a.append(request.args["status"])
        W = ("WHERE " + " AND ".join(w)) if w else ""
        total = db().execute(f"SELECT COUNT(*) FROM invoices i {W}", a).fetchone()[0]
        items = rows(f"SELECT i.*, u.email AS customer_email FROM invoices i JOIN users u ON u.id=i.customer_id "
                     f"{W} ORDER BY i.id DESC LIMIT ? OFFSET ?", a + [lim, off])
        return jsonify(items=items, total=total)

    # ---------- renewals ----------
    @app.post("/api/billing/run")
    @auth("admin", "staff")
    def run_billing():
        n = 0
        for s in rows("SELECT * FROM subscriptions WHERE status='active' AND next_billing_date<=?",
                      (D.today().isoformat(),)):
            if make_invoice(s): n += 1
        mark_overdue(); db().commit()
        return jsonify(invoices_created=n)

    # ---------- dashboard numbers ----------
    @app.get("/api/stats")
    @auth("admin", "staff")
    def stats():
        mark_overdue(); db().commit()
        one = lambda sql: db().execute(sql).fetchone()[0]
        return jsonify(
            active=one("SELECT COUNT(*) FROM subscriptions WHERE status='active'"),
            billed=one("SELECT COALESCE(SUM(total),0) FROM invoices WHERE status!='void'"),
            outstanding=one("SELECT COALESCE(SUM(total),0) FROM invoices WHERE status IN ('sent','overdue')"),
            overdue=one("SELECT COUNT(*) FROM invoices WHERE status='overdue'"),
            mrr=round(one("SELECT COALESCE(SUM((p.price+COALESCE(v.extra_price,0))*s.quantity*CASE p.billing_period "
                          "WHEN 'daily' THEN 30 WHEN 'weekly' THEN 4.345 WHEN 'monthly' THEN 1 ELSE 1/12.0 END),0) "
                          "FROM subscriptions s JOIN plans p ON p.id=s.plan_id LEFT JOIN variants v ON v.id=s.variant_id "
                          "WHERE s.status='active'"), 2))
