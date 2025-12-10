'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

export default function WelcomeStep() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-medical-blue-800 mb-2">
          Welcome to Your Bioelectric Regeneration Journey
        </h1>
        <p className="text-medical-blue-600">
          Let's set up your personalized healing protocol in just a few steps.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold text-medical-blue-700 mb-4">
            What is the Bioelectric Regeneration Tracker?
          </h2>
          <p className="text-gray-700 mb-4">
            This platform helps you track and optimize your healing journey through the revolutionary 4-phase
            Bioelectric Regeneration protocol developed by leading health researchers.
          </p>

          <div className="space-y-4 mt-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-medical-green-100 flex items-center justify-center mr-3 mt-1">
                <span className="text-medical-green-600 text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="font-medium text-medical-blue-700">Track Daily Protocols</h3>
                <p className="text-sm text-gray-600">
                  Record your supplements, modalities, and biomarkers in one place for consistent progress.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-medical-green-100 flex items-center justify-center mr-3 mt-1">
                <span className="text-medical-green-600 text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="font-medium text-medical-blue-700">Visualize Your Progress</h3>
                <p className="text-sm text-gray-600">
                  See health trends and improvements over time with intuitive charts and metrics.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-medical-green-100 flex items-center justify-center mr-3 mt-1">
                <span className="text-medical-green-600 text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="font-medium text-medical-blue-700">Receive Timely Reminders</h3>
                <p className="text-sm text-gray-600">
                  Never miss a treatment with customizable notifications for each phase.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-medical-green-100 flex items-center justify-center mr-3 mt-1">
                <span className="text-medical-green-600 text-sm font-bold">4</span>
              </div>
              <div>
                <h3 className="font-medium text-medical-blue-700">Discover Insights</h3>
                <p className="text-sm text-gray-600">
                  Uncover patterns between treatments and health outcomes to optimize your protocol.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <Card className="w-full max-w-md bg-gradient-to-br from-medical-blue-50 to-medical-green-50 shadow-md overflow-hidden">
            <CardContent className="p-6">
              <div className="mb-4 relative h-48 rounded-lg overflow-hidden">
                <Image
                  src="/images/bioelectric-healing.jpg"
                  alt="Bioelectric Healing Concept"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
              </div>
              <h3 className="text-lg font-semibold text-medical-blue-700 mb-2">
                Your 4-Phase Protocol
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-medical-green-500 mr-2"></div>
                  <span>Phase 1: Terrain Clearing</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-medical-blue-500 mr-2"></div>
                  <span>Phase 2: Mitochondrial Rebuild</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-medical-orange-500 mr-2"></div>
                  <span>Phase 3: Heavy Metal Liberation</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-medical-purple-500 mr-2"></div>
                  <span>Phase 4: Biofield Expansion</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <p className="text-sm text-gray-500 mt-4 max-w-md text-center">
            This wizard will guide you through setting up your personalized protocol
            in just a few minutes. You can always modify these settings later.
          </p>
        </div>
      </div>
    </div>
  )
}
