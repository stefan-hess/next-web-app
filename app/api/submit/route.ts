// pages/api/submit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getDbConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { first_name, last_name, email, tickers, feedback } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const conn = await getDbConnection();
  const transaction = conn.transaction();

  try {
    await transaction.begin();
    const request = transaction.request();

    // Check if client exists
    const existingClient = await request
      .input("email", email)
      .query("SELECT email FROM news_subscribed_clients WHERE email = @email");

    if (existingClient.recordset.length > 0) {
      await request
        .input("first_name", first_name)
        .input("last_name", last_name)
        .input("email", email)
        .query(`
          UPDATE news_subscribed_clients
          SET first_name = @first_name, last_name = @last_name, subscription_cancelled = 0
          WHERE email = @email
        `);
    } else {
      await request
        .input("first_name", first_name)
        .input("last_name", last_name)
        .input("email", email)
        .query(`
          INSERT INTO news_subscribed_clients (first_name, last_name, email, subscription_cancelled)
          VALUES (@first_name, @last_name, @email, 0)
        `);
    }

    // Reset tickers
    await request.input("email", email).query("DELETE FROM ticker_selection_clients WHERE email = @email");

    // Insert tickers
    if (tickers) {
      const tickerList = tickers.split(",");
      for (const ticker of tickerList) {
        await request.input("email", email).input("ticker", ticker).query(`
          INSERT INTO ticker_selection_clients (email, ticker)
          VALUES (@email, @ticker)
        `);
      }
    }

    // Insert feedback
    if (feedback && feedback.trim()) {
      await request.input("email", email).input("feedback", feedback).query(`
        INSERT INTO feedback (email, feedback)
        VALUES (@email, @feedback)
      `);
    }

    await transaction.commit();
    return res.status(200).json({ message: "Form submitted successfully!" });
  } catch (err) {
    await transaction.rollback();
    console.error("Error processing form:", err);
    return res.status(500).json({ error: "An error occurred while processing your form." });
  }
}
