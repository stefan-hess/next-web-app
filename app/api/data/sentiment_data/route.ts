// Types for Alpha Vantage News Sentiment response
interface AlphaVantageTopic {
	relevance_score: string;
}

interface AlphaVantageTickerSentiment {
	relevance_score: string;
}

interface AlphaVantageFeedItem {
	topics?: AlphaVantageTopic[];
	ticker_sentiment?: AlphaVantageTickerSentiment[];
	[key: string]: unknown;
}

interface AlphaVantageSentimentResponse {
	feed: AlphaVantageFeedItem[];
	[key: string]: unknown;
}
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest): Promise<Response> {
	const { searchParams } = new URL(req.url);
	const ticker = searchParams.get('ticker');
	if (!ticker || typeof ticker !== 'string') {
		return new Response(JSON.stringify({ error: 'Missing or invalid ticker parameter' }), { status: 400 });
	}

	const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'ALPHA_VANTAGE_API_KEY is not set in environment variables.' }), { status: 500 });
	}

	try {
		const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&apikey=${apiKey}&limit=500`;
		const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' });
		if (!res.ok) {
			return new Response(JSON.stringify({ error: 'Failed to fetch sentiment data', status: res.status }), { status: 500 });
		}
		const data: unknown = await res.json();
		// Type guard for expected response structure
			if (
				typeof data === 'object' &&
				data !== null &&
				'feed' in data &&
				Array.isArray((data as AlphaVantageSentimentResponse).feed)
			) {
				(data as AlphaVantageSentimentResponse).feed = (data as AlphaVantageSentimentResponse).feed.filter((item: AlphaVantageFeedItem) => {
					// Check topics
					const topicRelevant = Array.isArray(item.topics) && item.topics.some((topic: AlphaVantageTopic) => {
						const score = parseFloat(topic.relevance_score);
						return !isNaN(score) && score > 0.2;
					});
					// Check ticker_sentiment
					const tickerRelevant = Array.isArray(item.ticker_sentiment) && item.ticker_sentiment.some((ts: AlphaVantageTickerSentiment) => {
						const score = parseFloat(ts.relevance_score);
						return !isNaN(score) && score > 0.2;
					});
					return topicRelevant || tickerRelevant;
				});
			}
			return new Response(JSON.stringify({ [ticker]: data }), { status: 200 });
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Failed to fetch sentiment data', details: String(e) }), { status: 500 });
	}
}
