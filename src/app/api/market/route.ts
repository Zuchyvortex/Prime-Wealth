import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Premium starting valuations
    const marketData = {
      btc: { name: "Bitcoin", symbol: "BTC", price: 92450.00, change: 2.45, sparkline: [91200, 91500, 91100, 92000, 92450, 92800] },
      eth: { name: "Ethereum", symbol: "ETH", price: 3480.20, change: -1.15, sparkline: [3550, 3520, 3490, 3460, 3480, 3440] },
      tsla: { name: "Tesla Inc.", symbol: "TSLA", price: 178.45, change: 0.85, sparkline: [175, 176, 177, 178.5, 178.45, 179.20] },
      aapl: { name: "Apple Inc.", symbol: "AAPL", price: 182.30, change: 1.22, sparkline: [180, 181, 180.5, 181.8, 182.30, 183.10] }
    };

    // Try fetching live rates from CoinGecko for crypto assets
    try {
      const coingeckoRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true", {
        next: { revalidate: 30 } // Cache for 30s
      });
      if (coingeckoRes.ok) {
        const data = await coingeckoRes.json();
        if (data.bitcoin) {
          marketData.btc.price = data.bitcoin.usd;
          marketData.btc.change = parseFloat(data.bitcoin.usd_24h_change.toFixed(2));
          marketData.btc.sparkline = Array.from({ length: 6 }, (_, i) => marketData.btc.price * (1 + (Math.random() - 0.5) * 0.015));
        }
        if (data.ethereum) {
          marketData.eth.price = data.ethereum.usd;
          marketData.eth.change = parseFloat(data.ethereum.usd_24h_change.toFixed(2));
          marketData.eth.sparkline = Array.from({ length: 6 }, (_, i) => marketData.eth.price * (1 + (Math.random() - 0.5) * 0.015));
        }
      }
    } catch (e) {
      console.warn("CoinGecko API is rate-limited or offline, using robust defaults.");
    }

    // Add active noise parameters based on seconds to make the ticker look alive and interactive
    const seconds = new Date().getSeconds();
    const noise = Math.sin(seconds / 15) * 0.003; // +/- 0.3%

    marketData.tsla.price = parseFloat((marketData.tsla.price * (1 + noise)).toFixed(2));
    marketData.tsla.change = parseFloat((marketData.tsla.change + noise * 100).toFixed(2));
    marketData.tsla.sparkline = Array.from({ length: 6 }, (_, i) => marketData.tsla.price * (1 + (Math.random() - 0.5) * 0.01));

    marketData.aapl.price = parseFloat((marketData.aapl.price * (1 - noise)).toFixed(2));
    marketData.aapl.change = parseFloat((marketData.aapl.change - noise * 100).toFixed(2));
    marketData.aapl.sparkline = Array.from({ length: 6 }, (_, i) => marketData.aapl.price * (1 + (Math.random() - 0.5) * 0.01));

    return NextResponse.json(marketData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch asset rates" }, { status: 500 });
  }
}
