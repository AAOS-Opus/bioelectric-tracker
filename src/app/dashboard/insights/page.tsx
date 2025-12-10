import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import InsightsDashboard from '@/components/insights/InsightsDashboard'

export default async function InsightsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-6">Bioelectric Insights</h1>
      <p className="text-gray-600 mb-8">
        Personalized data analysis and recommendations based on your bioelectric regeneration journey.
      </p>
      
      <InsightsDashboard userEmail={session.user.email || ''} />
    </div>
  )
}
