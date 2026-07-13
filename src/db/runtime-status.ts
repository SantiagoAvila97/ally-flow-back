/** Estado real de bootstrap (para /api/health). */
let databaseStatus: 'memory' | 'postgres' | 'error' = 'memory';
let databaseError: string | null = null;

export function setDatabaseStatus(
  status: 'memory' | 'postgres' | 'error',
  error?: string | null,
): void {
  databaseStatus = status;
  databaseError = error ?? null;
}

export function getDatabaseStatus(): {
  database: 'memory' | 'postgres' | 'error';
  databaseError: string | null;
} {
  return { database: databaseStatus, databaseError };
}
