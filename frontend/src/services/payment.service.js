import api from '../api/axios';

export const getBillingOverview     = ()     => api.get('/api/billing/overview');
export const getUsageAnalytics      = ()     => api.get('/api/billing/usage-analytics');
export const getBillingApiKeys      = ()     => api.get('/api/billing/api-keys');
export const getInvoices            = ()     => api.get('/api/billing/invoices');
export const getPlans               = ()     => api.get('/api/billing/plans');

// Legacy / free-plan switch
export const upgradePlan            = (plan) => api.post('/api/billing/upgrade',                { plan });

// Razorpay payment flow
export const createRazorpayOrder    = (plan) => api.post('/api/billing/razorpay/create-order',  { plan });
export const verifyRazorpayPayment  = (data) => api.post('/api/billing/razorpay/verify',        data);
