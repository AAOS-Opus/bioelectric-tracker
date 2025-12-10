'use client'

import { ProfileSettings } from '@/components/user/ProfileSettings'
import { useUser } from '@/hooks/useUser'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProfilePage() {
  const { user, loading } = useUser()
  const router = useRouter()
  
  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">You need to be logged in</h1>
        <p className="text-gray-500 mb-6">Please log in to access your profile settings</p>
        <Button onClick={() => router.push('/login')}>Go to Login</Button>
      </div>
    )
  }
  
  return <ProfileSettings />
}
