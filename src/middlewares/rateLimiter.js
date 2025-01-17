import rateLimit from 'express-rate-limit'

function rateLimiter(max, minutes) {
  return rateLimit({
    windowMs: minutes * 60 * 1000, // Period of X minutes
    max: max, // max try
    message: 'Too many failures',
    standardHeaders: true,
    legacyHeaders: false,
  })
}

export const loginLimiter = rateLimiter(5, 10)
export const tokenVerifLimiter = rateLimiter(30, 1)
