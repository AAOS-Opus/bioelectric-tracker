import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      currentPhaseNumber: number
      programStartDate: Date
      createdAt: Date
    } & DefaultSession["user"]
    sessionCreated: number
    lastRefresh: number
  }

  interface User {
    id: string
    currentPhaseNumber: number
    programStartDate: Date
    createdAt: Date
  }
}
