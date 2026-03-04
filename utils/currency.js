let _cachedRate = null;
let _cacheTime = 0;
let _rateIsStale = false;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const CURRENCIES = ["EGP", "USD"];
export const CURRENCY_SYMBOLS = { EGP: "EGP", USD: "$" };

export async function fetchUsdToEgpRate() {
  if (_cachedRate && Date.now() - _cacheTime < CACHE_TTL) {
    return _cachedRate;
  }
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await response.json();
    const rate = data.rates?.EGP;
    if (!rate) throw new Error("Could not fetch exchange rate");
    _cachedRate = rate;
    _cacheTime = Date.now();
    _rateIsStale = false;
    return rate;
  } catch (e) {
    if (_cachedRate) {
      // Network failed but we have a previous rate — use it silently
      _rateIsStale = true;
      return _cachedRate;
    }
    // No fallback available — caller must handle
    throw e;
  }
}

export function isExchangeRateStale() {
  return _rateIsStale;
}


export function convertToEgp(amount, currency, rate) {
  if (currency === "EGP") return amount;
  if (currency === "USD" && rate) return amount * rate;
  return amount;
}

export function convertCurrency(amount, fromCurrency, toCurrency, rate) {
  if (fromCurrency === toCurrency) return amount;
  if (fromCurrency === "USD" && toCurrency === "EGP") return amount * rate;
  if (fromCurrency === "EGP" && toCurrency === "USD") return amount / rate;
  return amount;
}
