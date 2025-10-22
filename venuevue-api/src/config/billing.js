// Centralized billing/fees configuration and helpers for consistent calculations

function toNumber(v, d) {
  const n = Number(v);
  return Number.isFinite(n) ? n : Number(d);
}

const CONFIG = {
  PLATFORM_FEE_PERCENT: toNumber(process.env.PLATFORM_FEE_PERCENT, 8), // % of subtotal
  STRIPE_FEE_PERCENT: toNumber(process.env.STRIPE_PROC_FEE_PERCENT ?? process.env.STRIPE_FEE_PERCENT, 2.9), // % of subtotal
  STRIPE_FEE_FIXED: toNumber(process.env.STRIPE_PROC_FEE_FIXED ?? process.env.STRIPE_FEE_FIXED, 0.30), // fixed per charge
  TAX_PERCENT: toNumber(process.env.TAX_PERCENT, 0), // % on (subtotal + platform)
  CURRENCY: String(process.env.STRIPE_CURRENCY || 'cad').toLowerCase(),
};

function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

function toCents(n) {
  return Math.round(Number(n || 0) * 100);
}

function computeFees({ subtotal, vendorCount = 1, includeTax = true }) {
  const s = Number(subtotal || 0);
  const platformFee = round2(s * (CONFIG.PLATFORM_FEE_PERCENT / 100));
  const stripeFee = round2((s * (CONFIG.STRIPE_FEE_PERCENT / 100)) + (CONFIG.STRIPE_FEE_FIXED * Math.max(1, Number(vendorCount || 1))));
  const taxAmount = includeTax ? round2((s + platformFee) * (CONFIG.TAX_PERCENT / 100)) : 0;
  const grandTotal = round2(s + platformFee + taxAmount + stripeFee);
  return { platformFee, stripeFee, taxAmount, grandTotal };
}

function getBillingConfig() {
  return { ...CONFIG };
}

module.exports = {
  getBillingConfig,
  computeFees,
  round2,
  toCents,
};
