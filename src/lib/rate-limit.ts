interface RateLimitAttempt {
  count: number
  resetTime: number
}

const attempts = new Map<string, RateLimitAttempt>()

export function rateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `${identifier}:${Math.floor(now / windowMs)}`
  
  let attempt = attempts.get(key)
  
  if (!attempt) {
    attempt = {
      count: 0,
      resetTime: now + windowMs
    }
    attempts.set(key, attempt)
  }
  
  // Clean up old attempts
  for (const [k, v] of attempts.entries()) {
    if (v.resetTime < now) {
      attempts.delete(k)
    }
  }
  
  attempt.count++
  
  const success = attempt.count <= limit
  const remaining = Math.max(0, limit - attempt.count)
  
  return {
    success,
    remaining,
    resetTime: attempt.resetTime
  }
}

export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers)
  
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    headers.get('x-client-ip') ||
    headers.get('cf-connecting-ip') ||
    '127.0.0.1'
  )
}