// test-db-connection.ts
import { getDbConnection } from "./app/lib/db.ts";

async function testConnection() {
  try {
    const conn = await getDbConnection();
    await conn.connect();
    console.log("Database connection successful!");
    await conn.close();
  } catch (err) {
    console.error("Database connection failed:", err);
  }
}

testConnection();