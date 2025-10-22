require('dotenv').config();

function toCurrency(n) {
  try { return Math.round(Number(n || 0) * 100) / 100; } catch { return 0; }
}

function getBillingConfig() {
  const platformPct = parseFloat(process.env.PLATFORM_FEE_PERCENT ?? '8');
  const stripePct = parseFloat(process.env.STRIPE_FEE_PERCENT ?? process.env.STRIPE_PROC_FEE_PERCENT ?? '2.9');
  const stripeFixed = parseFloat(process.env.STRIPE_FEE_FIXED ?? process.env.STRIPE_PROC_FEE_FIXED ?? '0.30');
  const taxPct = parseFloat(process.env.TAX_PERCENT ?? '0');
  const currency = String((process.env.STRIPE_CURRENCY || process.env.CURRENCY || 'cad')).toLowerCase();
  return {
    platformPct: Number.isFinite(platformPct) ? platformPct : 0,
    stripePct: Number.isFinite(stripePct) ? stripePct : 0,
    stripeFixed: Number.isFinite(stripeFixed) ? stripeFixed : 0.3,
    taxPct: Number.isFinite(taxPct) ? taxPct : 0,
    currency
  };
}

function computeFees({ subtotal, vendorChargeCount = 1 }) {
  const cfg = getBillingConfig();
  const sub = toCurrency(subtotal);
  const platformFee = toCurrency(sub * (cfg.platformPct / 100));
  const stripeFee = toCurrency((sub * (cfg.stripePct / 100)) + (cfg.stripeFixed * (vendorChargeCount || 1)));
  const taxAmount = toCurrency((sub + platformFee) * (cfg.taxPct / 100));
  const grandTotal = toCurrency(sub + platformFee + stripeFee + taxAmount);
  return {
    platformFee,
    platformFeePercent: cfg.platformPct,
    stripeFee,
    stripePercent: cfg.stripePct,
    stripeFixed: cfg.stripeFixed,
    taxAmount,
    taxPercent: cfg.taxPct,
    grandTotal,
    currency: cfg.currency.toUpperCase()
  };
}

module.exports = { getBillingConfig, computeFees, toCurrency };
