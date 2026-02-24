import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isValidTicker } from '../../../lib/validateTicker';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface QuarterlyReport {
  fiscalDateEnding?: string;
  [key: string]: unknown;
}

interface AlphaVantageResponse {
  quarterlyReports?: QuarterlyReport[];
  [key: string]: unknown;
}

interface NewReport {
  ticker: string;
  fiscalDateEnding: string;
  isNew: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { email, tickers } = await req.json() as { email: string; tickers: string[] };

    if (!email || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    if (tickers.some(t => !isValidTicker(t))) {
      return NextResponse.json({ error: 'One or more invalid ticker values.' }, { status: 400 });
    }

    const newReports: NewReport[] = [];

    // Fetch quarterly reports for each ticker
    for (const ticker of tickers) {
      try {
        // Fetch from AlphaVantage via your existing API pattern
        const alphaKey = process.env.ALPHA_VANTAGE_API_KEY;
        if (!alphaKey) continue;

        const url = `https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${ticker}&apikey=${alphaKey}`;
        const response = await fetch(url);
        const data = await response.json() as AlphaVantageResponse;

        if (!data.quarterlyReports || data.quarterlyReports.length === 0) continue;

        // Get the latest quarterly report
        const latestReport = data.quarterlyReports[0];
        const latestFiscalDate = latestReport?.fiscalDateEnding;

        if (!latestFiscalDate) continue;

        // Check if this report is already in the notifications table
        const { data: existingNotification } = await supabase
          .from('financial_report_notifications')
          .select('*')
          .eq('email', email)
          .eq('ticker', ticker)
          .eq('fiscal_date_ending', latestFiscalDate)
          .eq('report_type', 'quarterly')
          .single();

        // If notification doesn't exist, it's a new report
        if (!existingNotification) {
          // Insert new notification
          await supabase
            .from('financial_report_notifications')
            .insert({
              email,
              ticker,
              fiscal_date_ending: latestFiscalDate,
              report_type: 'quarterly',
              is_read: false,
            });

          newReports.push({
            ticker,
            fiscalDateEnding: latestFiscalDate,
            isNew: true,
          });
        } else if (!existingNotification.is_read) {
          // If it exists but is unread, still show it
          newReports.push({
            ticker,
            fiscalDateEnding: latestFiscalDate,
            isNew: false,
          });
        }
      } catch (error) {
        console.error(`Error checking reports for ${ticker}:`, error);
        continue;
      }
    }

    return NextResponse.json({ newReports });
  } catch (error) {
    console.error('Error in check-quarterly-reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { email, ticker, fiscalDateEnding } = await req.json() as { 
      email: string; 
      ticker: string; 
      fiscalDateEnding: string;
    };

    if (!email || !ticker || !fiscalDateEnding) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Mark notification as read
    const { error } = await supabase
      .from('financial_report_notifications')
      .update({ is_read: true })
      .eq('email', email)
      .eq('ticker', ticker)
      .eq('fiscal_date_ending', fiscalDateEnding)
      .eq('report_type', 'quarterly');

    if (error) {
      console.error('Error marking notification as read:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in mark-as-read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
