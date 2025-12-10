import './globals.css'
import React from 'react'
import { NextAuthProvider } from '../providers/NextAuthProvider'
import ClientProviders from '@/components/ClientProviders'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'Bioelectric Regeneration Tracker',
  description: 'Track your wellness journey through bioelectric regeneration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground" suppressHydrationWarning>
        <NextAuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ClientProviders>
              <Toaster position="top-center" reverseOrder={false} />
              {children}
            </ClientProviders>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}
