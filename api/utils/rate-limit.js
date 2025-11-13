// Rate Limiting Utility for API Endpoints
// Protects against brute force attacks and API abuse

/**
 * Simple in-memory rate limiter
 * For production with multiple instances, consider using:
 * - Upstash Redis
 * - Vercel KV
 * - Redis Cloud
 */

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanup();
  }

  /**
   * Check if request should be allowed
   * @param {string} key - Unique identifier (IP, user ID, etc.)
   * @param {Object} options - Rate limit configuration
   * @returns {Object} - { allowed: boolean, remaining: number, reset: number }
   */
  check(key, options = {}) {
    const {
      maxRequests = 100, // Maximum requests allowed
      windowMs = 60000,  // Time window in milliseconds (default: 1 minute)
    } = options;

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this key
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requests = this.requests.get(key);

    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    this.requests.set(key, recentRequests);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const resetTime = oldestRequest + windowMs;

      return {
        allowed: false,
        remaining: 0,
        reset: Math.ceil((resetTime - now) / 1000), // seconds until reset
        retryAfter: Math.ceil((resetTime - now) / 1000)
      };
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return {
      allowed: true,
      remaining: maxRequests - recentRequests.length,
      reset: Math.ceil(windowMs / 1000)
    };
  }

  /**
   * Clean up old entries periodically to prevent memory leaks
   */
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);

      for (const [key, requests] of this.requests.entries()) {
        const recentRequests = requests.filter(timestamp => timestamp > oneHourAgo);

        if (recentRequests.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, recentRequests);
        }
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Reset rate limit for a specific key
   * @param {string} key
   */
  reset(key) {
    this.requests.delete(key);
  }

  /**
   * Get current stats for a key
   * @param {string} key
   * @param {Object} options
   * @returns {Object}
   */
  getStats(key, options = {}) {
    const { maxRequests = 100, windowMs = 60000 } = options;

    if (!this.requests.has(key)) {
      return {
        requests: 0,
        remaining: maxRequests,
        limited: false
      };
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    const requests = this.requests.get(key).filter(t => t > windowStart);

    return {
      requests: requests.length,
      remaining: Math.max(0, maxRequests - requests.length),
      limited: requests.length >= maxRequests
    };
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Express/Vercel middleware for rate limiting
 * @param {Object} options - Configuration options
 * @returns {Function} Middleware function
 */
function createRateLimitMiddleware(options = {}) {
  const {
    maxRequests = 100,
    windowMs = 60000,
    keyGenerator = (req) => {
      // Default: Use IP address as key
      return req.headers['x-forwarded-for'] ||
             req.headers['x-real-ip'] ||
             req.connection?.remoteAddress ||
             'unknown';
    },
    skip = (req) => false, // Skip rate limiting for certain requests
    handler = (req, res) => {
      // Default handler when rate limit exceeded
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: res.retryAfter
      });
    }
  } = options;

  return (req, res, next) => {
    // Skip if specified
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const result = rateLimiter.check(key, { maxRequests, windowMs });

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', result.reset.toString());

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter.toString());
      res.retryAfter = result.retryAfter;
      return handler(req, res);
    }

    next();
  };
}

/**
 * Predefined rate limit configurations
 */
const rateLimitPresets = {
  // Strict limit for authentication endpoints
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // Standard limit for general API endpoints
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },

  // Lenient limit for read-only endpoints
  readonly: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
  },

  // Very strict for write operations
  write: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },

  // File uploads
  upload: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  }
};

/**
 * Helper function to apply rate limiting to Vercel serverless function
 * @param {Function} handler - Original API handler
 * @param {Object} options - Rate limit options
 * @returns {Function} Wrapped handler with rate limiting
 */
function withRateLimit(handler, options = {}) {
  const middleware = createRateLimitMiddleware(options);

  return async (req, res) => {
    return new Promise((resolve, reject) => {
      middleware(req, res, async (error) => {
        if (error) {
          return reject(error);
        }

        try {
          await handler(req, res);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  };
}

module.exports = {
  rateLimiter,
  createRateLimitMiddleware,
  withRateLimit,
  rateLimitPresets
};
