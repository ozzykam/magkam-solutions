import { createHash } from 'node:crypto';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getClientIdentifier, paymentRateLimiter } from '@/lib/utils/rate-limit';

const LIMIT = 10;
const WINDOW_MS = 60_000;
const REDIS_TIMEOUT_MS = 1_500;

// Shared across server instances; never fall back to allowing unlimited payments.
export async function consumeFirestoreInvoiceLimit(identifier: string, now = Date.now()) {
  const key = createHash('sha256').update(identifier).digest('hex');
  const firestore = getAdminFirestore();
  const ref = firestore.collection('invoiceCheckoutRateLimits').doc(key);
  return firestore.runTransaction(async transaction => {
    const data = (await transaction.get(ref)).data();
    const requests: number[] = Array.isArray(data?.requests)
      ? data.requests.filter((time: unknown): time is number => typeof time === 'number' && Number.isFinite(time) && time > now - WINDOW_MS).sort((a: number, b: number) => a - b)
      : [];
    if (requests.length >= LIMIT) {
      return { success: false, limit: LIMIT, remaining: 0, reset: requests[0] + WINDOW_MS };
    }
    requests.push(now);
    requests.sort((a, b) => a - b);
    transaction.set(ref, {
      requests,
      // Optional Firestore TTL cleanup; correctness does not depend on deletion.
      expiresAt: new Date(Math.max(now, requests[requests.length - 1]) + WINDOW_MS),
    });
    return { success: true, limit: LIMIT, remaining: LIMIT - requests.length, reset: requests[0] + WINDOW_MS };
  });
}

export async function checkInvoicePaymentRateLimit(request: Request) {
  const identifier = getClientIdentifier(request);
  if (paymentRateLimiter) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        paymentRateLimiter.limit(identifier),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Redis rate-limit timeout')), REDIS_TIMEOUT_MS);
        }),
      ]);
      // Upstash can return an allowed result on timeout; use the shared fallback instead.
      if (result.reason === 'timeout') throw new Error('Redis rate-limit timeout');
      return result;
    } catch {
      console.warn('[Invoice checkout] Redis rate limiter unavailable; using Firestore rate limiting.');
    } finally {
      clearTimeout(timer);
    }
  }
  // If Firestore also fails, let checkout return an error rather than bypass the limit.
  return consumeFirestoreInvoiceLimit(identifier);
}
