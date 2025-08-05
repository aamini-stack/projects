import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { RateLimiter } from './rate-limiter'

const TEST_IP = '192.168.1.1'

let limiter: RateLimiter

beforeEach(() => {
	limiter = new RateLimiter()
	vi.useFakeTimers()
	vi.setSystemTime(0)
})

afterEach(() => {
	vi.useRealTimers()
})

test('Block after limit is reached', () => {
	expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 2 })
	expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 1 })
	expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 0 })
	expect(limiter.consume(TEST_IP)).toEqual({ success: false, retryAfter: 15 })
	vi.advanceTimersByTime(15 * 60 * 1000 + 1) // Fast forward 15 minutes and 1 second
	expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 0 })
})

test('Refill tokens after cooldown', () => {
	expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 2 })
	vi.advanceTimersByTime(15 * 60 * 1000 + 1) // Fast forward 15 minutes and 1 second
	expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 2 })
})

test("Don't fill tokens before window passes", () => {
	expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 2 })
	vi.advanceTimersByTime(14 * 60 * 1000) // Fast forward 14 minutes (less than window)
	expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 1 })
})

test('Multiple windows passing', () => {
	expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 2 })
	vi.advanceTimersByTime(45 * 60 * 1000) // Fast forward 45 minutes (3 windows)
	expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 2 })
})

test('Block after global limit of 100 is reached', () => {
	for (let i = 0; i < 100; i++) {
		expect(limiter.consume(`192.168.1.${i.toString()}`)).toEqual({
			success: true,
			remaining: 2,
		})
	}
	expect(limiter.consume(TEST_IP)).toEqual({
		success: false,
		message: 'Server cannot handle requests',
	})

	vi.advanceTimersByTime(65 * 60 * 1000) // Fast forward 65 minutes (1.0833 windows)
	expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 2 })
})

test('Handling multiple IPs independently', () => {
	const ip1 = '192.168.1.1'
	const ip2 = '192.168.1.2'

	expect(limiter.consume(ip1)).toEqual({ success: true, remaining: 2 })
	expect(limiter.consume(ip2)).toEqual({ success: true, remaining: 2 })

	expect(limiter.consume(ip1)).toEqual({ success: true, remaining: 1 })
	expect(limiter.consume(ip2)).toEqual({ success: true, remaining: 1 })
})
