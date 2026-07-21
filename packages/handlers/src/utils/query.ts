const TRANSACTION_QUERIES = ["BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT"];

/**
 * Detect transaction-control statements (BEGIN/COMMIT/ROLLBACK/SAVEPOINT) so
 * they can be filtered out of the query watcher consistently across drivers.
 */
export function isTransactionQuery(sql: string): boolean {
  const trimmed = sql.trim().toUpperCase();
  return TRANSACTION_QUERIES.some(
    (q) => trimmed === q || trimmed.startsWith(`${q} `),
  );
}
