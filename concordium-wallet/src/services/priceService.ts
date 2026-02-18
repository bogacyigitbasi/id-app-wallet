const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

let cachedPrice: number | null = null;
let lastFetchTime = 0;

/**
 * Fetch CCD price in USD from CoinGecko's free API.
 * CoinMarketCap requires API key + server proxy for CORS,
 * so CoinGecko is used as the browser-friendly alternative.
 * Results are cached for 5 minutes.
 */
export async function getCCDPriceUSD(): Promise<number | null> {
  const now = Date.now();
  if (cachedPrice !== null && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedPrice;
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=concordium&vs_currencies=usd'
    );
    if (!response.ok) return cachedPrice;
    const data = await response.json();
    cachedPrice = data?.concordium?.usd ?? null;
    lastFetchTime = now;
    return cachedPrice;
  } catch {
    return cachedPrice;
  }
}
