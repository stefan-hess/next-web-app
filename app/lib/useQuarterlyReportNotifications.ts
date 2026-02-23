import { useEffect, useState } from 'react';

interface NewReport {
  ticker: string;
  fiscalDateEnding: string;
  isNew: boolean;
}

interface UseQuarterlyReportNotificationsResult {
  newReports: NewReport[];
  loading: boolean;
  error: string | null;
  markAsRead: (ticker: string, fiscalDateEnding: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useQuarterlyReportNotifications(
  email: string,
  tickers: string[]
): UseQuarterlyReportNotificationsResult {
  const [newReports, setNewReports] = useState<NewReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!email || tickers.length === 0) {
      setNewReports([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/data/check-quarterly-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tickers }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quarterly reports');
      }

      const data = await response.json() as { newReports: NewReport[] };
      setNewReports(data.newReports || []);
    } catch (err) {
      console.error('Error fetching quarterly report notifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNewReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [email, tickers.join(',')]); // Re-fetch when email or tickers change

  const markAsRead = async (ticker: string, fiscalDateEnding: string) => {
    try {
      const response = await fetch('/api/data/check-quarterly-reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ticker, fiscalDateEnding }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      // Remove from local state
      setNewReports((prev) =>
        prev.filter(
          (report) =>
            !(report.ticker === ticker && report.fiscalDateEnding === fiscalDateEnding)
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  return {
    newReports,
    loading,
    error,
    markAsRead,
    refetch: fetchReports,
  };
}
