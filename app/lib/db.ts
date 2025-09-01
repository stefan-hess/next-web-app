// lib/db.ts
import sql from "mssql"

const config: sql.config = {
  user: "shess",
  password: "zUgpux-gifxa0-kikrun",
  server: "shess2.database.windows.net",
  database: "NewsDB",
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
}

let pool: sql.ConnectionPool | null = null

export async function getDbConnection() {
  if (pool) {
    return pool
  }
  try {
    pool = await sql.connect(config)
    return pool
  } catch (err) {
    console.error("Database connection failed:", err)
    throw err
  }
}
