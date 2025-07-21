import { z } from 'zod'

const MINIMAL_PASSWORD_LENGTH = 8

export const loginSchema = z.object({
  username: z.string().nonempty(),
  password: z.string().nonempty(),
})

export const signupSchema = z.object({
  username: z.string().nonempty(),
  password: z.string().min(MINIMAL_PASSWORD_LENGTH),
  signupKey: z.string().nonempty(),
})
