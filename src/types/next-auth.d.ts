import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      currentPhaseNumber: number
      programStartDate?: Date
      createdAt?: Date
      onboardingComplete?: boolean
    } & DefaultSession["user"]
    sessionCreated?: number
    lastRefresh?: number
  }

  interface User extends DefaultUser {
    id: string
    currentPhaseNumber: number
    programStartDate?: Date
    createdAt?: Date
    onboardingComplete?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    currentPhaseNumber?: number
    onboardingComplete?: boolean
  }
}
