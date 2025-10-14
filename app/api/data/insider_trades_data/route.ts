import { NextRequest } from 'next/server';
import { spawn } from 'child_process';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // Accept tickers as comma-separated string: ?tickers=AAPL,MSFT,GOOG
  let tickersParam = searchParams.get('tickers') || searchParams.get('ticker');
  let maxTradesParam = searchParams.get('maxTrades') || '10';
  if (!tickersParam || typeof tickersParam !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid tickers parameter' }), { status: 400 });
  }
  // Split tickers by comma and trim whitespace
  const tickers = tickersParam.split(',').map(t => t.trim()).filter(Boolean);
  const maxTrades = String(parseInt(maxTradesParam, 10));

  return new Promise((resolve) => {
    const py = spawn('python3', ['data/fetch_insider_trades_data.py', ...tickers, maxTrades]);
    let data = '';
    py.stdout.on('data', (chunk) => { data += chunk; });
    py.stderr.on('data', (err) => { console.error('Python error:', err.toString()); });
    py.on('close', () => {
      try {
        const json = JSON.parse(data);
        resolve(new Response(JSON.stringify(json), { status: 200 }));
      } catch (e) {
        resolve(new Response(JSON.stringify({ error: 'Failed to parse Python output', details: String(e) }), { status: 500 }));
      }
    });
  });
}
