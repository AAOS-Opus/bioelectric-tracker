import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to dashboard or login page
  redirect('/auth/login')
  
  // This won't render as we're redirecting
  return null
}
