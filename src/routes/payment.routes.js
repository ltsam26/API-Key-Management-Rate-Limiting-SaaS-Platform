const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth.middleware");
const {
  getPlans,
  getBillingOverview,
  getUsageAnalytics,
  getBillingApiKeys,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getInvoices,
  mockUpgrade,
} = require("../controllers/payment.controller");

// ── Public ─────────────────────────────────────────────────────
router.get("/plans",                    getPlans);

// ── Authenticated ──────────────────────────────────────────────
router.get("/overview",                 auth, getBillingOverview);
router.get("/usage-analytics",          auth, getUsageAnalytics);
router.get("/api-keys",                 auth, getBillingApiKeys);
router.get("/invoices",                 auth, getInvoices);

// ── Razorpay payment flow ─────────────────────────────────────
router.post("/razorpay/create-order",   auth, createRazorpayOrder);
router.post("/razorpay/verify",         auth, verifyRazorpayPayment);

// ── Legacy / FREE plan switch ─────────────────────────────────
router.post("/upgrade",                 auth, mockUpgrade);

module.exports = router;
