import type { NextRequest } from 'next/server';

interface AlphaVantageDividendResponse {
	[key: string]: unknown;
}

interface DividendEntry {
	ex_dividend_date?: string | null;
	amount?: number | string | null;
	declaration_date?: string | null;
	record_date?: string | null;
	payment_date?: string | null;
}

type UnknownObject = Record<string, unknown>;

function pickFirst<T = unknown>(obj: UnknownObject, keys: string[]): T | undefined {
	for (const k of keys) {
		const v = obj[k];
		if (v !== undefined && v !== null) return v as T;
	}
	return undefined;
}

function normalizeDividend(raw: UnknownObject): DividendEntry | null {
		const date = (pickFirst<string>(raw, [
			'ex_dividend_date', 'exDividendDate', 'date', 'exDate', 'dividend_ex_date', 'dividendExDate'
		]) ?? null);
	const amount = (pickFirst<string | number>(raw, [
		'dividend', 'amount', 'dividend_amount', 'value'
	]) ?? null);
		const declaration_date = (pickFirst<string>(raw, [
			'declaration_date', 'declarationDate', 'declared_date', 'declaredDate', 'announcement_date', 'announcementDate'
		]) ?? null);
		const record_date = (pickFirst<string>(raw, [
			'record_date', 'recordDate', 'date_of_record', 'dateOfRecord'
		]) ?? null);
		const payment_date = (pickFirst<string>(raw, [
			'payment_date', 'paymentDate', 'payDate', 'payable_date', 'payableDate', 'payment_on', 'paymentOn'
		]) ?? null);

	if (!date && amount == null) return null;
	return {
		ex_dividend_date: date,
		amount,
		declaration_date,
		record_date,
		payment_date,
	};
}

async function fetchDividendHistory(ticker: string, apiKey: string): Promise<DividendEntry[]> {
	const url = `https://www.alphavantage.co/query?function=DIVIDEND_HISTORY&symbol=${ticker}&apikey=${apiKey}`;
	const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' });
	if (!res.ok) return [];
	const data = await res.json() as AlphaVantageDividendResponse;
	// Prefer arrays under likely keys; else first array value
	let arr: UnknownObject[] = [];
	for (const key in data) {
		const v = (data as UnknownObject)[key];
		if (Array.isArray(v) && /dividend|data|history|records/i.test(key)) {
			arr = v as UnknownObject[];
			break;
		}
	}
	if (arr.length === 0) {
		for (const key in data) {
			const v = (data as UnknownObject)[key];
			if (Array.isArray(v)) { arr = v as UnknownObject[]; break; }
		}
	}
	const normalized = arr
		.map((r) => (r && typeof r === 'object' ? normalizeDividend(r as UnknownObject) : null))
		.filter((x): x is DividendEntry => !!x);
	return normalized;
}

async function fetchMonthlyAdjustedFallback(ticker: string, apiKey: string): Promise<DividendEntry[]> {
	type MonthlyAdjusted = {
		'Monthly Adjusted Time Series'?: Record<string, { '7. dividend amount'?: string | number }>;
	};
	const url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${ticker}&apikey=${apiKey}`;
	const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' });
	if (!res.ok) return [];
	const data = await res.json() as MonthlyAdjusted;
	const series = data['Monthly Adjusted Time Series'] || {};
	const out: DividendEntry[] = [];
	for (const date in series) {
		const entry = series[date];
		const amt = entry?.['7. dividend amount'];
		const n = parseFloat(String(amt));
		if (isFinite(n) && n > 0) {
			out.push({ ex_dividend_date: date, amount: n });
		}
	}
	return out;
}

async function fetchFundamentalDividends(ticker: string, apiKey: string): Promise<DividendEntry[]> {
	const url = `https://www.alphavantage.co/query?function=DIVIDENDS&symbol=${ticker}&apikey=${apiKey}`;
	const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' });
	if (!res.ok) return [];
	const data = await res.json() as AlphaVantageDividendResponse;
	let arr: UnknownObject[] = [];
	// Prefer 'data' key like Fundamentals responses
	if (Array.isArray((data as UnknownObject)['data'])) {
		arr = (data as unknown as { data: UnknownObject[] }).data;
	} else {
		for (const key in data) {
			const v = (data as UnknownObject)[key];
			if (Array.isArray(v)) { arr = v as UnknownObject[]; break; }
		}
	}
	const normalized = arr
		.map((r) => (r && typeof r === 'object' ? normalizeDividend(r as UnknownObject) : null))
		.filter((x): x is DividendEntry => !!x);
	return normalized;
}

function sortByDateDesc(entries: DividendEntry[]): DividendEntry[] {
	return [...entries].sort((a, b) => {
		const ad = a.ex_dividend_date ? new Date(a.ex_dividend_date).getTime() : 0;
		const bd = b.ex_dividend_date ? new Date(b.ex_dividend_date).getTime() : 0;
		return bd - ad;
	});
}

export async function GET(req: NextRequest): Promise<Response> {
	const { searchParams } = new URL(req.url);
	const ticker = searchParams.get('ticker');
	const maxDividends = parseInt(searchParams.get('maxDividends') || '50', 10);
	if (!ticker || typeof ticker !== 'string') {
		return new Response(JSON.stringify({ error: 'Missing or invalid ticker parameter' }), { status: 400 });
	}

	const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'ALPHA_VANTAGE_API_KEY is not set in environment variables.' }), { status: 500 });
	}

	try {
		// First try dedicated dividend history
		let dividends = await fetchDividendHistory(ticker, apiKey);
			// Then try Fundamentals DIVIDENDS endpoint (often includes all date columns)
			if (!dividends.length) {
				dividends = await fetchFundamentalDividends(ticker, apiKey);
			}
			// Fallback to monthly adjusted dividends if previous options returned nothing
		if (!dividends.length) {
			dividends = await fetchMonthlyAdjustedFallback(ticker, apiKey);
		}
		const limited = sortByDateDesc(dividends).slice(0, Math.max(0, maxDividends));
		return new Response(JSON.stringify({ [ticker]: limited }), { status: 200 });
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Failed to fetch dividend data', details: String(e) }), { status: 500 });
	}
}
