'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, ChevronRight, UserCircle2, Lightbulb, Calendar, Beaker } from 'lucide-react'

interface CompletionStepProps {
  userName: string;
  onFinish: () => void;
}

export default function CompletionStep({ userName, onFinish }: CompletionStepProps) {
  const [isAnimating, setIsAnimating] = useState(true)

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-medical-green-100 text-medical-green-600 mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-medical-blue-800 mb-2">
          Congratulations, {userName}!
        </h1>
        <p className="text-medical-blue-600 max-w-md mx-auto">
          Your Bioelectric Regeneration Tracker is now set up and ready to support your healing journey.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className={`border-medical-green-200 ${isAnimating ? 'animate-pulse' : ''}`}>
          <CardContent className="p-5">
            <div className="flex items-start">
              <div className="mr-4 mt-1 text-medical-green-600">
                <UserCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Your Profile</h3>
                <p className="text-sm text-gray-600">
                  Your personal profile and phase timeline have been created. You can always adjust 
                  your phase dates and personal information in the settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-medical-blue-200 ${isAnimating ? 'animate-pulse' : ''}`}>
          <CardContent className="p-5">
            <div className="flex items-start">
              <div className="mr-4 mt-1 text-medical-blue-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Protocol Schedule</h3>
                <p className="text-sm text-gray-600">
                  Your protocol schedule has been configured with the products and biomarkers you selected.
                  Your daily checklist is now ready for use.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-medical-blue-50 p-6 rounded-lg border border-medical-blue-100">
        <h2 className="text-lg font-medium text-medical-blue-800 mb-4 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2" />
          What's Next?
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-medical-green-100 flex items-center justify-center mr-3 mt-1">
              <span className="text-medical-green-600 text-sm font-bold">1</span>
            </div>
            <div>
              <h3 className="font-medium text-medical-blue-700">Explore Your Dashboard</h3>
              <p className="text-sm text-gray-600">
                Take a tour of your personalized dashboard and familiarize yourself with the different widgets 
                and tracking tools.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-medical-green-100 flex items-center justify-center mr-3 mt-1">
              <span className="text-medical-green-600 text-sm font-bold">2</span>
            </div>
            <div>
              <h3 className="font-medium text-medical-blue-700">Start Your Daily Check-ins</h3>
              <p className="text-sm text-gray-600">
                Begin logging your product usage and biomarkers to establish your baseline and track progress.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-medical-green-100 flex items-center justify-center mr-3 mt-1">
              <span className="text-medical-green-600 text-sm font-bold">3</span>
            </div>
            <div>
              <h3 className="font-medium text-medical-blue-700">Customize Your Widgets</h3>
              <p className="text-sm text-gray-600">
                Further personalize your dashboard by arranging widgets in a way that works best for your needs.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-medical-green-100 flex items-center justify-center mr-3 mt-1">
              <span className="text-medical-green-600 text-sm font-bold">4</span>
            </div>
            <div>
              <h3 className="font-medium text-medical-blue-700">Set Reminders</h3>
              <p className="text-sm text-gray-600">
                Configure notifications to help you stay on track with your protocol and never miss a treatment.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <Button 
          onClick={onFinish}
          size="lg"
          className="bg-medical-green-600 hover:bg-medical-green-700"
        >
          Go to Dashboard
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="text-center text-sm text-gray-500 mt-4">
        <p>
          Need help? Visit our <a href="#" className="text-medical-blue-600 hover:underline">Support Center</a> or 
          contact our <a href="#" className="text-medical-blue-600 hover:underline">Customer Support Team</a>.
        </p>
      </div>
    </div>
  )
}
