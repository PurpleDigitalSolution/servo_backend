import { prisma } from "../config/database.js";
import { PrismaTx } from "../types/general.js";

/**
 * Converts a string key into two 32-bit signed integers for Postgres advisory locks.
 */
function hashKeyTo32BitPair(key: string): [number, number] {
  let h1 = 0x811c9dc5; // FNV-1a 32-bit offset basis
  let h2 = 0x050c5d1f;

  for (let i = 0; i < key.length; i++) {
    const charCode = key.charCodeAt(i);
    h1 ^= charCode;
    h1 = Math.imul(h1, 0x01000193); // Multiply using 32-bit integer math

    h2 ^= charCode;
    h2 = Math.imul(h2, 0x0254c37d);
  }

  // Force signed 32-bit integer conversion (-2,147,483,648 to 2,147,483,647)
  return [h1 | 0, h2 | 0];
}

/**
 * Tries to acquire a transaction-scoped Postgres advisory lock.
 */
export async function withAdvisoryLock<T>(
  lockKeyName: string,
  fn: (tx: PrismaTx) => Promise<T>,
): Promise<{ executed: boolean; result?: T }> {
  const [key1, key2] = hashKeyTo32BitPair(lockKeyName);

  return await prisma.$transaction(async (tx: PrismaTx) => {
    // Pass two signed 32-bit integers to pg_try_advisory_xact_lock(key1, key2)
    const [{ acquired }] = await tx.$queryRawUnsafe<
      Array<{ acquired: boolean }>
    >(
      `SELECT pg_try_advisory_xact_lock($1::integer, $2::integer) AS acquired`,
      key1,
      key2,
    );

    if (!acquired) {
      return { executed: false };
    }

    const result = await fn(tx);
    return { executed: true, result };
  });
}
