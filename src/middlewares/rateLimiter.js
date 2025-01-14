import rateLimit from 'express-rate-limit'

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Period of 15 minutes
    max: 5, // max try
    message: 'Too many failures',
    standardHeaders: true,
    legacyHeaders: false,
})

export default loginLimiter