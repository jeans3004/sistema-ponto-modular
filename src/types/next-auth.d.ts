import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      uid: string
      isDatabaseAdmin: boolean
    } & DefaultSession["user"]
    accessToken?: string
  }

  interface User extends DefaultUser {
    isDatabaseAdmin: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    uid: string
    isDatabaseAdmin: boolean
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
  }
}
