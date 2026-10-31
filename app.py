"""Brightloop Subscription Management - v1 (Foundation)
Run: pip install -r requirements.txt && python app.py
Admin seed: admin@brightloop.com / Admin@12345
"""
import sqlite3, secrets, re, datetime as dt
from functools import wraps
from flask import Flask, request, jsonify, g, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash

DB = "brightloop.db"
app = Flask(__name__)

SCHEMA = """
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  name TEXT, password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','staff','customer')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS tokens(
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, kind TEXT NOT NULL,
  expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS products(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, type TEXT,
  sales_price REAL NOT NULL, cost_price REAL DEFAULT 0, notes TEXT);
CREATE TABLE IF NOT EXISTS variants(
  id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id),
  attribute TEXT NOT NULL, value TEXT NOT NULL, extra_price REAL DEFAULT 0);
CREATE TABLE IF NOT EXISTS plans(
  id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id),
  name TEXT NOT NULL, price REAL NOT NULL,
  billing_period TEXT NOT NULL CHECK(billing_period IN ('daily','weekly','monthly','yearly')),
  min_quantity INTEGER DEFAULT 1, auto_renew INTEGER DEFAULT 1,
  pausable INTEGER DEFAULT 1, start_date TEXT, end_date TEXT);
CREATE TABLE IF NOT EXISTS taxes(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, rate_percent REAL NOT NULL);
CREATE TABLE IF NOT EXISTS discounts(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('fixed','percent')), value REAL NOT NULL,
  min_amount REAL DEFAULT 0, min_quantity INTEGER DEFAULT 0,
  start_date TEXT, end_date TEXT, max_uses INTEGER, times_used INTEGER DEFAULT 0,
  product_id INTEGER REFERENCES products(id));  -- NULL = whole subscription
-- Tables below are used from v2 onward
CREATE TABLE IF NOT EXISTS subscriptions(
  id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES users(id),
  plan_id INTEGER NOT NULL REFERENCES plans(id), variant_id INTEGER,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK(status IN ('draft','active','paused','cancelled','expired')),
  start_date TEXT NOT NULL, next_billing_date TEXT, end_date TEXT);
CREATE TABLE IF NOT EXISTS invoices(
  id INTEGER PRIMARY KEY, number TEXT UNIQUE, subscription_id INTEGER REFERENCES subscriptions(id),
  customer_id INTEGER NOT NULL REFERENCES users(id),
  issue_date TEXT, due_date TEXT, subtotal REAL, discount REAL DEFAULT 0,
  tax REAL DEFAULT 0, total REAL,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','sent','paid','overdue','void')));
CREATE TABLE IF NOT EXISTS payments(
  id INTEGER PRIMARY KEY, invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  method TEXT NOT NULL, amount REAL NOT NULL, paid_on TEXT NOT NULL, note TEXT);
CREATE INDEX IF NOT EXISTS ix_sub_status ON subscriptions(status, next_billing_date);
CREATE INDEX IF NOT EXISTS ix_sub_cust ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS ix_inv_status ON invoices(status, due_date);
CREATE INDEX IF NOT EXISTS ix_inv_cust ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS ix_pay_inv ON payments(invoice_id);
"""

# ---------- helpers ----------
def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db

@app.teardown_appcontext
def close_db(_):
    d = g.pop("db", None)
    if d: d.close()

def rows(sql, args=()):
    return [dict(r) for r in db().execute(sql, args).fetchall()]

def now(): return dt.datetime.utcnow()

def err(msg, code=400): return jsonify(error=msg), code

def valid_password(p):
    if len(p) <= 8: return "Password must be more than 8 characters"
    if not re.search(r"[A-Z]", p): return "Password needs an uppercase letter"
    if not re.search(r"[a-z]", p): return "Password needs a lowercase letter"
    if not re.search(r"[^A-Za-z0-9]", p): return "Password needs a special character"

def new_token(user_id, kind, hours):
    t = secrets.token_urlsafe(32)
    db().execute("INSERT INTO tokens VALUES(?,?,?,?)",
                 (t, user_id, kind, (now() + dt.timedelta(hours=hours)).isoformat()))
    db().commit()
    return t

def auth(*roles):
    def deco(fn):
        @wraps(fn)
        def wrapper(*a, **kw):
            tok = request.headers.get("Authorization", "").replace("Bearer ", "")
            r = db().execute("SELECT u.* FROM tokens t JOIN users u ON u.id=t.user_id "
                             "WHERE t.token=? AND t.kind='session' AND t.expires_at>?",
                             (tok, now().isoformat())).fetchone()
            if not r: return err("Not logged in", 401)
            if roles and r["role"] not in roles: return err("Forbidden", 403)
            g.user = dict(r)
            return fn(*a, **kw)
        return wrapper
    return deco

def create_user(email, password, role, name=""):
    bad = valid_password(password)
    if bad: return None, bad
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email or ""): return None, "Invalid email"
    try:
        cur = db().execute("INSERT INTO users(email,name,password_hash,role) VALUES(?,?,?,?)",
                           (email.strip(), name, generate_password_hash(password), role))
        db().commit()
        return cur.lastrowid, None
    except sqlite3.IntegrityError:
        return None, "Email already registered"

# ---------- auth ----------
@app.post("/api/register")
def register():
    d = request.json or {}
    uid, e = create_user(d.get("email"), d.get("password", ""), "customer", d.get("name", ""))
    return (err(e), ) if e else (jsonify(id=uid, role="customer"), 201)

@app.post("/api/login")
def login():
    d = request.json or {}
    u = db().execute("SELECT * FROM users WHERE email=?", (d.get("email", ""),)).fetchone()
    if not u or not check_password_hash(u["password_hash"], d.get("password", "")):
        return err("Invalid credentials", 401)
    return jsonify(token=new_token(u["id"], "session", 12), role=u["role"])

@app.post("/api/forgot")
def forgot():
    email = (request.json or {}).get("email", "")
    u = db().execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
    if u:
        t = new_token(u["id"], "reset", 1)
        # TODO v4: send real email (SMTP). For now the link is printed.
        print(f"[EMAIL to {email}] Reset link: http://localhost:5000/reset?token={t}")
    return jsonify(message="If that email exists, a reset link has been sent")

@app.post("/api/reset")
def reset():
    d = request.json or {}
    bad = valid_password(d.get("password", ""))
    if bad: return err(bad)
    t = db().execute("SELECT * FROM tokens WHERE token=? AND kind='reset' AND expires_at>?",
                     (d.get("token", ""), now().isoformat())).fetchone()
    if not t: return err("Invalid or expired link")
    db().execute("UPDATE users SET password_hash=? WHERE id=?",
                 (generate_password_hash(d["password"]), t["user_id"]))
    db().execute("DELETE FROM tokens WHERE token=?", (t["token"],))
    db().commit()
    return jsonify(message="Password updated")

@app.post("/api/staff")
@auth("admin")
def add_staff():
    d = request.json or {}
    uid, e = create_user(d.get("email"), d.get("password", ""), "staff", d.get("name", ""))
    return (err(e), ) if e else (jsonify(id=uid, role="staff"), 201)

@app.get("/api/me")
@auth()
def me():
    return jsonify({k: g.user[k] for k in ("id", "email", "name", "role")})

# ---------- products & variants ----------
@app.get("/api/products")
@auth("admin", "staff")
def list_products():
    ps = rows("SELECT * FROM products ORDER BY id DESC")
    for p in ps:
        p["variants"] = rows("SELECT * FROM variants WHERE product_id=?", (p["id"],))
    return jsonify(ps)

@app.post("/api/products")
@auth("admin")
def add_product():
    d = request.json or {}
    if not d.get("name") or d.get("sales_price") is None: return err("name and sales_price required")
    cur = db().execute("INSERT INTO products(name,type,sales_price,cost_price,notes) VALUES(?,?,?,?,?)",
                       (d["name"], d.get("type"), d["sales_price"], d.get("cost_price", 0), d.get("notes")))
    for v in d.get("variants", []):  # e.g. {"attribute":"Brand","value":"Odoo","extra_price":560}
        db().execute("INSERT INTO variants(product_id,attribute,value,extra_price) VALUES(?,?,?,?)",
                     (cur.lastrowid, v["attribute"], v["value"], v.get("extra_price", 0)))
    db().commit()
    return jsonify(id=cur.lastrowid), 201

# ---------- plans ----------
@app.get("/api/plans")
@auth("admin", "staff")
def list_plans():
    return jsonify(rows("SELECT * FROM plans ORDER BY id DESC"))

@app.post("/api/plans")
@auth("admin")
def add_plan():
    d = request.json or {}
    if d.get("billing_period") not in ("daily", "weekly", "monthly", "yearly"):
        return err("billing_period must be daily, weekly, monthly or yearly")
    cur = db().execute(
        "INSERT INTO plans(product_id,name,price,billing_period,min_quantity,auto_renew,pausable,start_date,end_date)"
        " VALUES(?,?,?,?,?,?,?,?,?)",
        (d["product_id"], d["name"], d["price"], d["billing_period"], d.get("min_quantity", 1),
         int(d.get("auto_renew", True)), int(d.get("pausable", True)), d.get("start_date"), d.get("end_date")))
    db().commit()
    return jsonify(id=cur.lastrowid), 201

# ---------- taxes & discounts (admin only) ----------
@app.post("/api/taxes")
@auth("admin")
def add_tax():
    d = request.json or {}
    cur = db().execute("INSERT INTO taxes(name,rate_percent) VALUES(?,?)", (d["name"], d["rate_percent"]))
    db().commit()
    return jsonify(id=cur.lastrowid), 201

@app.post("/api/discounts")
@auth("admin")
def add_discount():
    d = request.json or {}
    if d.get("kind") not in ("fixed", "percent"): return err("kind must be fixed or percent")
    if d["kind"] == "percent" and not (0 < d["value"] <= 100): return err("percent must be 1-100")
    cur = db().execute(
        "INSERT INTO discounts(name,kind,value,min_amount,min_quantity,start_date,end_date,max_uses,product_id)"
        " VALUES(?,?,?,?,?,?,?,?,?)",
        (d["name"], d["kind"], d["value"], d.get("min_amount", 0), d.get("min_quantity", 0),
         d.get("start_date"), d.get("end_date"), d.get("max_uses"), d.get("product_id")))
    db().commit()
    return jsonify(id=cur.lastrowid), 201

@app.get("/api/discounts")
@auth("admin", "staff")
def list_discounts():
    return jsonify(rows("SELECT * FROM discounts ORDER BY id DESC"))

# ---------- v2 billing ----------
import billing
billing.register(app, db, rows, auth, err)

# ---------- web UI ----------
@app.get("/")
@app.get("/reset")
def home():
    return send_from_directory(app.root_path, "index.html")

# ---------- boot ----------
def init():
    c = sqlite3.connect(DB)
    c.executescript(SCHEMA)
    if not c.execute("SELECT 1 FROM users WHERE role='admin'").fetchone():
        c.execute("INSERT INTO users(email,name,password_hash,role) VALUES(?,?,?,'admin')",
                  ("admin@brightloop.com", "Admin", generate_password_hash("Admin@12345")))
    c.commit(); c.close()

if __name__ == "__main__":
    init()
    app.run(debug=True)
