import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  // Accept tickers as comma-separated string: ?tickers=AAPL,MSFT,GOOG
  const tickersParam = searchParams.get('tickers') || searchParams.get('ticker');
  const maxTradesParam = searchParams.get('maxTrades') || '10';
  if (!tickersParam || typeof tickersParam !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid tickers parameter' }), { status: 400 });
  }
  // Split tickers by comma and trim whitespace
  const tickers = tickersParam.split(',').map(t => t.trim()).filter(Boolean);
  const maxTrades = String(parseInt(maxTradesParam, 10));

  const scriptPath = path.resolve(process.cwd(), 'data/fetch_insider_trades_data.py');
  const args = [scriptPath, ...tickers, maxTrades];

  return new Promise<Response>((resolve) => {
    let settled = false;
    const timeoutMs = 60000; // 60s guard
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(new Response(JSON.stringify({ error: 'Upstream timeout running data fetcher' }), { status: 504 }));
    }, timeoutMs);

    const run = (pythonCmd: string) => {
      const py = spawn(pythonCmd, args);
      let data = '';
      py.stdout.on('data', (chunk) => { data += chunk; });
      py.stderr.on('data', (err) => { console.error('[insider_trades_data] stderr:', err.toString()); });
      py.on('error', (err: NodeJS.ErrnoException) => {
        // If python3 is missing, try 'python' once
        if (pythonCmd === 'python3' && err.code === 'ENOENT') {
          run('python');
          return;
        }
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(new Response(JSON.stringify({ error: 'Failed to start Python process', details: err.message }), { status: 500 }));
        }
      });
      py.on('close', () => {
        if (settled) return;
        try {
          const json = JSON.parse(data || 'null');
          settled = true;
          clearTimeout(timer);
          resolve(new Response(JSON.stringify(json), { status: 200 }));
        } catch (e) {
          settled = true;
          clearTimeout(timer);
          resolve(new Response(JSON.stringify({ error: 'Failed to parse Python output', details: String(e) }), { status: 500 }));
        }
      });
    };

    run('python3');
  });
}
