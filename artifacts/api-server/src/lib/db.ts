/**
 * Database stub — all data operations go through Supabase.
 * This file exists only to satisfy imports in routes that previously
 * used a direct pg Pool. DATABASE_URL is not required.
 */

export const directDbAvailable = (): boolean => false;

export async function query<T = Record<string, unknown>>(
  _sql: string,
  _params: unknown[] = [],
): Promise<T[]> {
  throw new Error("Direct DB not available — use Supabase client instead");
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
