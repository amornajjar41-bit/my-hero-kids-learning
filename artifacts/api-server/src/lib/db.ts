/**
 * Direct PostgreSQL connection — bypasses Supabase PostgREST entirely.
 * Used as the primary data layer when DATABASE_URL is set.
 *
 * Supabase PostgREST has an internal "schema cache" that must be manually
 * reloaded after table creation; the direct pg connection has no such cache
 * and works immediately after tables are created.
 */
import { Pool, type QueryResultRow } from "pg";

const DATABASE_URL = process.env["DATABASE_URL"];

let _pool: Pool | null = null;

function getPool(): Pool | null {
  if (!DATABASE_URL) return null;
  if (!_pool) {
    _pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    _pool.on("error", (err) => {
      console.warn("[db] pool error:", err.message);
    });
  }
  return _pool;
}

export const directDbAvailable = (): boolean => !!DATABASE_URL;

/** Run a parameterised SQL query.  Returns rows or throws. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL not set — direct DB unavailable");
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

/** Run a query and return the first row, or null. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
