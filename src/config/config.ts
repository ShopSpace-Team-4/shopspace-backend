import { config } from "dotenv";
import { resolve } from "node:path";

config({
  path: resolve(`./.env.${process.env.NODE_ENV ?? "development"}`)
})

const required = (key: string) => {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const NODE_ENV = process.env.NODE_ENV ?? "development"
export const PORT = parseInt(process.env.PORT ?? "3000")
export const CLIENT_URL = process.env.CLIENT_URL ?? "*"

export const MONGO_URI = process.env.MONGO_URI as string

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string
export const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m"
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d"

export const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "10")

export const OTP_LENGTH = parseInt(process.env.OTP_LENGTH ?? "6")
export const OTP_EXPIRES_IN_MINUTES = parseInt(process.env.OTP_EXPIRES_IN_MINUTES ?? "10")

export const EMAIL_HOST = process.env.EMAIL_HOST ?? "smtp.gmail.com"
export const EMAIL_PORT = parseInt(process.env.EMAIL_PORT ?? "465")
export const EMAIL_SECURE = process.env.EMAIL_SECURE === "true"
export const EMAIL_USER = process.env.EMAIL_USER as string
export const EMAIL_PASS = process.env.EMAIL_PASS as string
export const EMAIL_FROM = process.env.EMAIL_FROM ?? "ShopSpace <no-reply@shopspace.com>"

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string

export const RATE_LIMIT_WINDOW_MINUTES = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES ?? "15")
export const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "10")
export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "10")
export const ENC_IV_LENGTH = parseInt(process.env.ENC_IV_LENGTH ?? '16')
export const ENC_KEY = process.env.ENC_KEY as string

export const REDIS_URI = process.env.REDIS_URI ?? "redis://localhost:6379"

export const cloudinary = {
  cloudName: required('CLOUDINARY_CLOUD_NAME'),
  apiKey: required('CLOUDINARY_API_KEY'),
  apiSecret: required('CLOUDINARY_API_SECRET'),
}

export const USER_ACCESS_TOKEN_SIGNATURE = process.env.JWT_ACCESS_SECRET as string
export const USER_REFRESH_TOKEN_SIGNATURE = process.env.JWT_REFRESH_SECRET as string
export const SYSTEM_ACCESS_TOKEN_SIGNATURE = process.env.SYSTEM_ACCESS_TOKEN_SIGNATURE ?? (process.env.JWT_ACCESS_SECRET as string)
export const SYSTEM_REFRESH_TOKEN_SIGNATURE = process.env.SYSTEM_REFRESH_TOKEN_SIGNATURE ?? (process.env.JWT_REFRESH_SECRET as string)
export const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m"
export const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d"
