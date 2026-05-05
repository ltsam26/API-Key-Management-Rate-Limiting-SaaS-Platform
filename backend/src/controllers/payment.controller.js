const pool = require("../config/db");
const crypto = require("crypto");
const Razorpay = require("razorpay");

/* ─── Razorpay instance (Optional for testing) ─── */
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('[Billing] Razorpay keys missing. Payment features will be disabled.');
}

/* ─── Plan definitions (single source of truth) ─── */
const PLANS = {
  FREE:       { price: 0,    priceINR: 0,      rateLimit: 10,   dailyQuota: 100,    maxKeys: 2,   features: ['10 req/min rate limit', '100 req/day quota', 'Up to 2 API keys', 'Basic analytics', 'Community support'] },
  BASIC:      { price: 2,    priceINR: 99,     rateLimit: 30,   dailyQuota: 1000,   maxKeys: 5,   features: ['30 req/min rate limit', '1,000 req/day quota', 'Up to 5 API keys', 'Full analytics', 'Email support'] },
  PRO:        { price: 29,   priceINR: 299,    rateLimit: 100,  dailyQuota: 10000,  maxKeys: 20,  features: ['100 req/min rate limit', '10,000 req/day quota', 'Up to 20 API keys', 'Advanced analytics', 'Priority support'] },
  ENTERPRISE: { price: 99,   priceINR: 499,    rateLimit: 1000, dailyQuota: 100000, maxKeys: 100, features: ['1,000 req/min rate limit', '100,000 req/day quota', 'Up to 100 API keys', 'Custom analytics', '24/7 dedicated support'] },
};

/* ─────────────────────────────────────────────────────────────
   GET /api/billing/plans  — public, no auth
───────────────────────────────────────────────────────────── */
const getPlans = async (req, res) => {
  res.status(200).json({ plans: PLANS });
};

/* ─────────────────────────────────────────────────────────────
   GET /api/billing/overview
───────────────────────────────────────────────────────────── */
const getBillingOverview = async (req, res) => {
  try {
    const userId = req.user.userId;

    const subRes = await pool.query(
      `SELECT plan_type, created_at, expires_at
       FROM subscriptions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    const plan = subRes.rows[0]?.plan_type || 'FREE';
    const planDetails = PLANS[plan] || PLANS.FREE;

    const usageRes = await pool.query(
      `SELECT COUNT(*) AS requests
       FROM api_logs l
       JOIN api_keys a ON l.api_key_id = a.id
       JOIN projects p ON a.project_id = p.id
       WHERE p.user_id = $1 AND l.created_at >= NOW() - INTERVAL '30 days'`,
      [userId]
    );

    const todayRes = await pool.query(
      `SELECT COUNT(*) AS today_requests
       FROM api_logs l
       JOIN api_keys a ON l.api_key_id = a.id
       JOIN projects p ON a.project_id = p.id
       WHERE p.user_id = $1 AND DATE(l.created_at) = CURRENT_DATE`,
      [userId]
    );

    const requests      = parseInt(usageRes.rows[0]?.requests)      || 0;
    const todayRequests = parseInt(todayRes.rows[0]?.today_requests) || 0;
    const dailyQuota    = planDetails.dailyQuota;
    const nextReset     = new Date();
    nextReset.setUTCHours(24, 0, 0, 0);

    res.status(200).json({
      plan,
      planDetails,
      expiresAt:    subRes.rows[0]?.expires_at   || null,
      subscribedAt: subRes.rows[0]?.created_at   || null,
      usage: {
        requests,
        todayRequests,
        dailyQuota,
        remaining:    Math.max(0, dailyQuota - todayRequests),
        nextReset:    nextReset.toISOString(),
        percentUsed:  dailyQuota > 0 ? Math.min(100, Math.round((todayRequests / dailyQuota) * 100)) : 0,
      },
      estimatedCost: ((requests / 1000) * 0.5).toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/billing/usage-analytics
───────────────────────────────────────────────────────────── */
const getUsageAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;

    const subRes = await pool.query(
      `SELECT plan_type FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    const plan = subRes.rows[0]?.plan_type || 'FREE';

    const dailyRes = await pool.query(
      `SELECT DATE(l.created_at) AS date,
              COUNT(*) AS requests,
              COUNT(*) FILTER (WHERE l.status_code >= 400) AS errors,
              COUNT(*) FILTER (WHERE l.status_code = 429) AS rate_limits
       FROM api_logs l
       JOIN api_keys a ON l.api_key_id = a.id
       JOIN projects p ON a.project_id = p.id
       WHERE p.user_id = $1 AND l.created_at >= NOW() - INTERVAL '14 days'
       GROUP BY DATE(l.created_at) ORDER BY date ASC`,
      [userId]
    );

    const tokenRes = await pool.query(
      `SELECT p.name AS project, COUNT(l.id) AS tokens
       FROM projects p
       LEFT JOIN api_keys a ON a.project_id = p.id
       LEFT JOIN api_logs l ON l.api_key_id = a.id
       WHERE p.user_id = $1
       GROUP BY p.id, p.name ORDER BY tokens DESC LIMIT 6`,
      [userId]
    );

    res.status(200).json({ plan, dailyRequests: dailyRes.rows, tokensByProject: tokenRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/billing/api-keys
───────────────────────────────────────────────────────────── */
const getBillingApiKeys = async (req, res) => {
  try {
    const userId = req.user.userId;
    const keysRes = await pool.query(
      `SELECT a.id, a.created_at, a.is_active,
              p.name AS project_name, p.plan,
              MAX(l.created_at) AS last_used,
              COUNT(l.id) AS total_requests
       FROM api_keys a
       JOIN projects p ON a.project_id = p.id
       LEFT JOIN api_logs l ON l.api_key_id = a.id
       WHERE p.user_id = $1
       GROUP BY a.id, p.name, p.plan
       ORDER BY a.created_at DESC`,
      [userId]
    );
    res.status(200).json({ keys: keysRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /api/billing/razorpay/create-order
   Creates a Razorpay order and returns order_id to frontend
───────────────────────────────────────────────────────────── */
const createRazorpayOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId   = req.user.userId;

    if (!PLANS[plan]) {
      return res.status(400).json({ message: `Invalid plan: ${plan}` });
    }

    const planData = PLANS[plan];

    if (planData.priceINR === 0) {
      // FREE plan — no payment needed, activate directly
      await _activatePlan(userId, plan);
      return res.status(200).json({
        free: true,
        message: 'Switched to FREE plan successfully.',
        plan,
        planDetails: planData,
      });
    }

    const amountPaise = planData.priceINR * 100; // Razorpay uses paise (1 INR = 100 paise)

    const order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt:  `receipt_${userId}_${plan}_${Date.now()}`,
      notes: {
        userId,
        plan,
      },
    });

    res.status(200).json({
      orderId:   order.id,
      amount:    order.amount,
      currency:  order.currency,
      plan,
      planData,
      keyId:     process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[Razorpay] create-order error:', err);
    res.status(500).json({ error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /api/billing/razorpay/verify
   Verifies Razorpay payment signature and activates plan
───────────────────────────────────────────────────────────── */
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
    const userId = req.user.userId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return res.status(400).json({ message: 'Missing payment verification fields.' });
    }

    // ── Verify HMAC signature ──────────────────────────────
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed — invalid signature.' });
    }

    // ── Activate plan ──────────────────────────────────────
    await _activatePlan(userId, plan);

    // ── Record invoice ─────────────────────────────────────
    const invoiceId = 'INV-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    try {
      await pool.query(
        `INSERT INTO invoices (user_id, invoice_id, plan, amount, status, razorpay_order_id, razorpay_payment_id, issued_at)
         VALUES ($1, $2, $3, $4, 'paid', $5, $6, NOW())`,
        [userId, invoiceId, plan, PLANS[plan].priceINR / 100, razorpay_order_id, razorpay_payment_id]
      );
    } catch (_) {
      // invoices table may not exist — non-fatal
    }

    res.status(200).json({
      message:          `Payment verified! ${plan} Plan activated. 🎉`,
      plan,
      planDetails:      PLANS[plan],
      invoiceId,
      razorpayOrderId:  razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });
  } catch (err) {
    console.error('[Razorpay] verify error:', err);
    res.status(500).json({ error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/billing/invoices
───────────────────────────────────────────────────────────── */
const getInvoices = async (req, res) => {
  try {
    const userId = req.user.userId;
    let invoices = [];

    try {
      const r = await pool.query(
        `SELECT * FROM invoices WHERE user_id = $1 ORDER BY issued_at DESC LIMIT 12`,
        [userId]
      );
      invoices = r.rows;
    } catch (_) { /* table may not exist */ }

    if (invoices.length === 0) {
      const subHistory = await pool.query(
        `SELECT plan_type, created_at FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 6`,
        [userId]
      );
      invoices = subHistory.rows.map((s, i) => ({
        invoice_id: 'INV-' + (1000 + i),
        plan: s.plan_type,
        amount: PLANS[s.plan_type]?.price || 0,
        status: 'paid',
        issued_at: s.created_at,
      }));
    }

    res.status(200).json({ invoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /api/billing/upgrade  (legacy mock — keep for FREE plan)
───────────────────────────────────────────────────────────── */
const mockUpgrade = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId   = req.user.userId;

    if (!PLANS[plan]) {
      return res.status(400).json({ message: 'Invalid plan.' });
    }

    await _activatePlan(userId, plan);

    res.status(200).json({
      message: `Successfully switched to ${plan} Plan!`,
      plan,
      planDetails: PLANS[plan],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── Internal helper ─── */
async function _activatePlan(userId, plan) {
  const planData = PLANS[plan] || PLANS.FREE;

  await pool.query(
    `INSERT INTO subscriptions (user_id, plan_type, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    [userId, plan]
  );
  
  // Update both plan name and the numeric key limit
  await pool.query(
    `UPDATE projects SET plan = $1, max_api_keys = $2 WHERE user_id = $3`,
    [plan, planData.maxKeys, userId]
  );
}

module.exports = {
  getPlans,
  getBillingOverview,
  getUsageAnalytics,
  getBillingApiKeys,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getInvoices,
  mockUpgrade,
};
