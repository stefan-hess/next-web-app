import { NextRequest } from 'next/server';
import { spawn } from 'child_process';

export async function GET(req: NextRequest): Promise<Response> {
	const { searchParams } = new URL(req.url);
	let ticker = searchParams.get('ticker');
	if (!ticker || typeof ticker !== 'string') {
		return new Response(JSON.stringify({ error: 'Missing or invalid ticker parameter' }), { status: 400 });
	}

	return await new Promise<Response>((resolve) => {
		const py = spawn('python3', ['data/fetch_dividend_data.py', ticker]);
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
