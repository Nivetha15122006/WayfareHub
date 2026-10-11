// Fallback exchange rates relative to EUR (standard Frankfurter base)
const FALLBACK_RATES_TO_EUR = {
  EUR: 1.0,
  USD: 1.08,
  INR: 90.5,
  GBP: 0.84,
  JPY: 165.0,
  AUD: 1.66,
  CAD: 1.51,
  SGD: 1.45,
  CHF: 0.95,
  NZD: 1.82,
  THB: 39.2,
  AED: 3.97,
};

/**
 * Fetch exchange rate from Frankfurter API with fallback
 * @param {string} from - Source currency (e.g. 'USD')
 * @param {string} to - Target currency (e.g. 'INR')
 * @returns {Promise<number>} Exchange rate
 */
const getExchangeRate = async (from, to) => {
  const f = from.toUpperCase();
  const t = to.toUpperCase();

  if (f === t) {
    return 1.0;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://api.frankfurter.app/latest?from=${f}&to=${t}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.rates[t] != null) {
        return Number(data.rates[t]);
      }
    }
  } catch (err) {
    console.warn(`[FX Warning] Frankfurter API fetch failed for ${f}->${t}: ${err.message}. Using fallback rates.`);
  }

  // Calculate using fallback rates
  const fromRateInEur = FALLBACK_RATES_TO_EUR[f] || 1.0;
  const toRateInEur = FALLBACK_RATES_TO_EUR[t] || 1.0;
  // from -> EUR -> to
  // If 1 EUR = fromRateInEur 'from', then 1 'from' = 1 / fromRateInEur EUR
  // And 1 EUR = toRateInEur 'to'
  // So 1 'from' = (1 / fromRateInEur) * toRateInEur
  const estimatedRate = (1 / fromRateInEur) * toRateInEur;
  return Math.round(estimatedRate * 10000) / 10000;
};

// @desc    Get live exchange rate between two currencies
// @route   GET /api/v1/fx/rate?from=USD&to=INR
// @access  Public / Private
const getRate = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both "from" and "to" currency parameters',
      });
    }

    const rate = await getExchangeRate(from, to);

    res.status(200).json({
      success: true,
      data: {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExchangeRate,
  getRate,
};
