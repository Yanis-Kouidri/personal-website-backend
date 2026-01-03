import { z } from 'zod'

/**
 * Security Constants
 */
const MIN_PASSWORD_LENGTH = 12 // Increased to 12 for better security in 2024
const MAX_USERNAME_LENGTH = 30

/**
 * Regex for password complexity:
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 */
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

/**
 * Login Schema
 * Simple validation, as complexity is checked during signup.
 */
export const loginSchema = z.object({
  username: z.string().trim().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
})

/**
 * Signup Schema
 * Robust validation to ensure high-quality account security.
 */
export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(MAX_USERNAME_LENGTH, { message: 'Username is too long' })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username can only contain letters, numbers and underscores',
    }),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, {
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    })
    .regex(passwordRegex, {
      message:
        'Password must include uppercase, lowercase, number and special character',
    }),
  signupKey: z.string().min(1, { message: 'Signup key is required' }),
})
