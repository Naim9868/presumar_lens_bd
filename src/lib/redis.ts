import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Upstash Redis client
const redisClient = Redis.fromEnv();

// Rate limiter configuration
export const rateLimiter = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

// Generic cache get
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redisClient.get<T>(key);
    return data || null;
  } catch (error) {
    console.error('Upstash cache get error:', error);
    return null;
  }
}

// Generic cache set with TTL
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Upstash cache set error:', error);
  }
}

// Generic cache delete
export async function cacheDel(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Upstash cache delete error:', error);
  }
}

// Delete multiple keys by pattern
export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    console.error('Upstash cache pattern delete error:', error);
  }
}

// Delete multiple specific keys
export async function cacheDelMultiple(keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    console.error('Upstash cache multiple delete error:', error);
  }
}

// Idempotency key management
export async function setIdempotencyKey(
  key: string,
  ttlSeconds: number = 300
): Promise<boolean> {
  try {
    const result = await redisClient.setnx(key, '1');
    if (result === 1) {
      await redisClient.expire(key, ttlSeconds);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Upstash idempotency key error:', error);
    return false;
  }
}

// Checkout session management
export async function setCheckoutSession(
  userId: string,
  data: any,
  ttlSeconds: number = 1800
): Promise<void> {
  await cacheSet(`checkout:${userId}`, data, ttlSeconds);
}

export async function getCheckoutSession(userId: string): Promise<any | null> {
  return await cacheGet(`checkout:${userId}`);
}

export async function clearCheckoutSession(userId: string): Promise<void> {
  await cacheDel(`checkout:${userId}`);
}

// Order cache management
export async function cacheOrder(orderId: string, orderData: any, ttlSeconds: number = 1800): Promise<void> {
  await cacheSet(`order:${orderId}`, orderData, ttlSeconds);
}

export async function getCachedOrder(orderId: string): Promise<any | null> {
  return await cacheGet(`order:${orderId}`);
}

export async function invalidateOrderCache(orderId: string): Promise<void> {
  await cacheDel(`order:${orderId}`);
}

// Batch cache operations for order lists
export async function cacheOrderList(
  cacheKey: string,
  data: any,
  ttlSeconds: number = 600
): Promise<void> {
  await cacheSet(`order-list:${cacheKey}`, data, ttlSeconds);
}

export async function getCachedOrderList(cacheKey: string): Promise<any | null> {
  return await cacheGet(`order-list:${cacheKey}`);
}

export async function invalidateOrderListCache(pattern: string = '*'): Promise<void> {
  await cacheDelPattern(`order-list:${pattern}`);
}

// Distributed lock for stock management
export async function acquireStockLock(
  variantId: string,
  ttlSeconds: number = 10
): Promise<boolean> {
  const lockKey = `stock-lock:${variantId}`;
  return await setIdempotencyKey(lockKey, ttlSeconds);
}

export async function releaseStockLock(variantId: string): Promise<void> {
  await cacheDel(`stock-lock:${variantId}`);
}

// Queue operations for async processing
export async function addToQueue(queueName: string, data: any): Promise<void> {
  await redisClient.lpush(queueName, JSON.stringify(data));
}

export async function processQueue(queueName: string, handler: (data: any) => Promise<void>): Promise<void> {
  try {
    const data = await redisClient.rpop(queueName);
    if (data) {
      await handler(JSON.parse(data));
    }
  } catch (error) {
    console.error(`Queue processing error for ${queueName}:`, error);
  }
}

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('Upstash Redis health check failed:', error);
    return false;
  }
}

// Export raw client for advanced operations
export { redisClient };