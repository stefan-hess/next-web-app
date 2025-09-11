// lib/db.ts
import sql from "mssql";

// Build the DB config at runtime so builds don't fail if env vars aren't set during build phase
function getRuntimeConfig(): sql.config {
  const {
    DB_USER,
    DB_PASSWORD,
    DB_SERVER,
    DB_NAME,
    DB_TRUST_CERT = "true",
  } = process.env;

  if (!DB_USER || !DB_PASSWORD || !DB_SERVER || !DB_NAME) {
    const missing = [
      !DB_USER ? "DB_USER" : null,
      !DB_PASSWORD ? "DB_PASSWORD" : null,
      !DB_SERVER ? "DB_SERVER" : null,
      !DB_NAME ? "DB_NAME" : null,
    ].filter(Boolean) as string[];
    // Log presence map without leaking secrets
    console.error("Database config missing required env vars:", {
      missing,
      present: {
        DB_USER: !!DB_USER,
        DB_PASSWORD: !!DB_PASSWORD,
        DB_SERVER: !!DB_SERVER,
        DB_NAME: !!DB_NAME,
      },
    });
    throw new Error(`Missing required DB env vars: ${missing.join(", ")}`);
  }

  return {
    user: DB_USER,
    password: DB_PASSWORD,
    server: DB_SERVER,
    database: DB_NAME,
    options: {
      encrypt: true,
      trustServerCertificate: DB_TRUST_CERT.toLowerCase() === "true",
    },
  } as sql.config;
}

let pool: sql.ConnectionPool | null = null;

export async function getDbConnection() {
  if (pool) {
    return pool;
  }
  try {
    const config = getRuntimeConfig();
    pool = await sql.connect(config);
    return pool;
  } catch (err) {
    if (err instanceof Error) {
      // Include common mssql properties if present
      const anyErr = err as unknown as { code?: unknown; number?: unknown };
      console.error(
        "Database connection failed:",
        {
          message: err.message,
          code: anyErr.code,
          number: anyErr.number,
          stack: err.stack,
        }
      );
    } else {
      console.error("Database connection failed:", err);
    }
    throw err;
  }
}
