import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Production-ready rate limiter using Upstash Redis
 * Works with serverless deployments (Vercel, AWS Lambda, etc.)
 *
 * Setup:
 * 1. Create a free account at https://upstash.com
 * 2. Create a Redis database
 * 3. Add these environment variables:
 *    - UPSTASH_REDIS_REST_URL
 *    - UPSTASH_REDIS_REST_TOKEN
 */

// Initialize Redis client (only if credentials are available)
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

/**
 * Payment endpoint rate limiter
 * Limits: 10 requests per minute per IP
 */
export const paymentRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
      prefix: '@upstash/ratelimit/payment',
    })
  : null;

/**
 * Strict rate limiter for sensitive endpoints
 * Limits: 5 requests per minute per IP
 */
export const strictRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      analytics: true,
      prefix: '@upstash/ratelimit/strict',
    })
  : null;

/**
 * General API rate limiter
 * Limits: 30 requests per minute per IP
 */
export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '60 s'),
      analytics: true,
      prefix: '@upstash/ratelimit/api',
    })
  : null;

/**
 * Helper to get client identifier from request
 * Uses IP address or fallback to a default identifier
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to connection remote address
  return 'unknown';
}

/**
 * Check rate limit for a request
 * Returns { success: boolean, headers: Record<string, string> }
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // If rate limiter is not configured, allow the request
  if (!limiter) {
    console.warn('Rate limiter not configured. Please set up Upstash Redis.');
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }

  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  return {
    success,
    limit,
    remaining,
    reset,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
}
