// Netlify serverless function — fetches live stock price from Yahoo Finance
// URL: https://myartha.in/.netlify/functions/stock-price?symbol=TCS
exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
  };

  const symbol = (event.queryStringParameters?.symbol || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!symbol) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No symbol' }) };

  for (const suffix of ['.NS', '.BO']) {
    try {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}${suffix}?interval=1d&range=1d`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://finance.yahoo.com/',
        },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price && price > 0) {
        return {
          statusCode: 200, headers,
          body: JSON.stringify({ price: Number(price), exchange: suffix === '.NS' ? 'NSE' : 'BSE', symbol: symbol + suffix }),
        };
      }
    } catch (e) { continue; }
  }

  return { statusCode: 404, headers, body: JSON.stringify({ error: 'Price not found for ' + symbol }) };
};
