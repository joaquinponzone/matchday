import type { SessionOptions } from "iron-session"

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "diadepartido-session",
  cookieOptions: { secure: process.env.NODE_ENV === "production" },
}

export type SessionData = {
  userId: number
}
