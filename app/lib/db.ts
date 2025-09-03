// lib/db.ts
import sql from "mssql";

// Ensure these environment variables exist
const {
  DB_USER,
  DB_PASSWORD,
  DB_SERVER,
  DB_NAME,
  DB_TRUST_CERT = "true", // default to true if not set
} = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_SERVER || !DB_NAME) {
  throw new Error(
    "Database environment variables are not set. Please define DB_USER, DB_PASSWORD, DB_SERVER, and DB_NAME."
  );
}

const config: sql.config = {
  user: DB_USER,
  password: DB_PASSWORD,
  server: DB_SERVER,
  database: DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: DB_TRUST_CERT.toLowerCase() === "true",
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getDbConnection() {
  if (pool) {
    return pool;
  }
  try {
    pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
}
