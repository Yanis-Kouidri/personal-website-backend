import 'dotenv/config'
import bcrypt from 'bcrypt'
import User from '../models/user.js'

export const login = (req, res) => {
  return res.status(200).json({ message: 'Login Test OK' })
}

export const signup = (req, res) => {
  const signupKey = process.env.SIGN_UP_KEY

  const errorMessage = 'Unautorized sign-up'
  if (req.body.signupKey != signupKey) {
    return res.status(401).json({ message: errorMessage })
  }
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      const user = new User({
        username: req.body.username,
        password: hash,
      })
      user
        .save()
        .then(() => res.status(200).json({ message: 'Utilisateur créé' }))
        .catch((e) => res.status(401).json({ message: errorMessage + e })) // Remove e, only for debugging
    })
    .catch((error) => res.status(500).json({ message: error }))
}
