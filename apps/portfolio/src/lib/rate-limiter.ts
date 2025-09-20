type Result =
	| { success: true; remaining: number }
	| { success: false; retryAfter: number }
	| { success: false; message: string }

interface Bucket {
	tokens: number
	lastRefill: number
}

export class RateLimiter {
	private bucket = new TokenBucket()
	private slidingWindow = new SlidingWindow()

	public consume(ip: string): Result {
		if (this.slidingWindow.hasReachedLimit()) {
			// Global rate limit check
			return { success: false, message: 'Server cannot handle requests' }
		} else {
			// Per IP rate limit check
			this.slidingWindow.allowRequest()
			return this.bucket.consume(ip)
		}
	}
}

/**
 * Used to limit the number of requests per IP address. (3 requests per 15
 * minutes)
 */
class TokenBucket {
	private buckets = new Map<string, Bucket>()

	private static readonly BUCKET_SIZE: number = 3
	private static readonly REFILL_RATE: number = 15 * 60 * 1000 // (15 minutes in ms)

	consume(ip: string): Result {
		const now = Date.now()

		// Refill tokens based on elapsed time
		if (this.buckets.has(ip)) {
			// biome-ignore lint/style/noNonNullAssertion: Impossible to be null
			const bucket = this.buckets.get(ip)!
			const elapsed = now - bucket.lastRefill
			const refillAmount = Math.floor(elapsed / TokenBucket.REFILL_RATE)
			this.buckets.set(ip, {
				tokens: Math.min(TokenBucket.BUCKET_SIZE, bucket.tokens + refillAmount),
				lastRefill: now,
			})
		}

		const { tokens, lastRefill } = this.buckets.get(ip) ?? {
			tokens: TokenBucket.BUCKET_SIZE,
			lastRefill: now,
		}
		if (tokens > 0) {
			this.buckets.set(ip, { tokens: tokens - 1, lastRefill })
			return { success: true, remaining: tokens - 1 }
		} else {
			const retryAfter = Math.floor(
				(lastRefill + TokenBucket.REFILL_RATE - now) / (1000 * 60),
			)
			return { success: false, retryAfter }
		}
	}
}

/** Used to limit the global number of requests per hour. (100 requests / hour) */
class SlidingWindow {
	private readonly WINDOW_SIZE_MS = 60 * 60 * 1000 // 1 hour in milliseconds
	private readonly MAX_REQUESTS = 100

	private currentWindow = 0
	private currRequestCount = 0
	private prevRequestCount = 0

	allowRequest(): boolean {
		if (!this.hasReachedLimit()) {
			this.currRequestCount++
			return true
		} else {
			return false
		}
	}

	hasReachedLimit(): boolean {
		const now = Date.now()
		const windowStart = now - (now % this.WINDOW_SIZE_MS)

		if (windowStart > this.currentWindow) {
			// Reset the window if we are in a new time window
			this.currentWindow = windowStart
			this.currRequestCount = 0
			this.prevRequestCount = this.currRequestCount
		}

		const lastWindowPercent = this.prevRequestCount / this.MAX_REQUESTS
		const x = this.currRequestCount / this.MAX_REQUESTS
		const weight = (1 - x) * lastWindowPercent + this.currRequestCount
		return weight + 1 > this.MAX_REQUESTS
	}
}
