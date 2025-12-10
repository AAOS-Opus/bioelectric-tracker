'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Calendar, 
  Beaker, 
  Activity, 
  LayoutDashboard, 
  HelpCircle,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import WelcomeStep from './wizard-steps/WelcomeStep'
import PhaseSetupStep from './wizard-steps/PhaseSetupStep'
import ProductSelectionStep from './wizard-steps/ProductSelectionStep'
import BiomarkerSetupStep from './wizard-steps/BiomarkerSetupStep'
import DashboardIntroStep from './wizard-steps/DashboardIntroStep'
import TipsStep from './wizard-steps/TipsStep'

// Types for wizard state
interface WizardState {
  programStartDate: Date;
  phases: {
    id: string;
    name: string;
    durationDays: number;
    startDate?: Date;
    endDate?: Date;
    color: string;
  }[];
  selectedProducts: string[];
  selectedBiomarkers: string[];
  dashboardPreferences: {
    layout: string;
    widgets: string[];
  };
}

const initialState: WizardState = {
  programStartDate: new Date(),
  phases: [
    { id: 'phase1', name: 'Terrain Clearing', durationDays: 30, color: '#4ade80' },
    { id: 'phase2', name: 'Mitochondrial Rebuild', durationDays: 45, color: '#60a5fa' },
    { id: 'phase3', name: 'Heavy Metal Liberation', durationDays: 30, color: '#f97316' },
    { id: 'phase4', name: 'Biofield Expansion', durationDays: 30, color: '#8b5cf6' }
  ],
  selectedProducts: [],
  selectedBiomarkers: ['energyLevel', 'sleepQuality', 'detoxSymptoms'],
  dashboardPreferences: {
    layout: 'default',
    widgets: ['phaseProgress', 'productChecklist', 'modalitySchedule', 'biomarkerChart', 'dailyAffirmation']
  }
}

export default function SetupWizard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardData, setWizardData] = useState<WizardState>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Check if user has already completed setup
  useEffect(() => {
    const checkSetupStatus = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user/setup-status')
          const data = await response.json()
          
          if (data.isComplete) {
            router.push('/dashboard')
          }
        } catch (error) {
          console.error('Failed to check setup status:', error)
        }
      }
    }
    
    checkSetupStatus()
  }, [session, router])

  const steps = [
    { title: 'Welcome', icon: <Award className="h-5 w-5" /> },
    { title: 'Program Phases', icon: <Calendar className="h-5 w-5" /> },
    { title: 'Products', icon: <Beaker className="h-5 w-5" /> },
    { title: 'Biomarkers', icon: <Activity className="h-5 w-5" /> },
    { title: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { title: 'Tips & Next Steps', icon: <HelpCircle className="h-5 w-5" /> }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleUpdateData = <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setWizardData(prev => ({ ...prev, [key]: value }))
  }

  const handleComplete = async () => {
    if (!session?.user?.id) return
    
    setIsSubmitting(true)
    
    try {
      // Calculate phase dates based on program start date
      const phasesWithDates = calculatePhaseDates(wizardData.phases, wizardData.programStartDate)
      
      // Submit setup data
      const response = await fetch('/api/user/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          programStartDate: wizardData.programStartDate,
          phases: phasesWithDates,
          selectedProducts: wizardData.selectedProducts,
          selectedBiomarkers: wizardData.selectedBiomarkers,
          dashboardPreferences: wizardData.dashboardPreferences
        })
      })
      
      if (!response.ok) throw new Error('Failed to save setup data')
      
      setIsComplete(true)
      toast({
        title: 'Setup Complete!',
        description: 'Your Bioelectric Regeneration program is ready to go.',
        variant: 'default'
      })
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Setup completion failed:', error)
      toast({
        title: 'Setup Failed',
        description: 'There was a problem completing your setup. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to calculate phase dates based on program start date
  const calculatePhaseDates = (phases: WizardState['phases'], startDate: Date) => {
    let currentDate = new Date(startDate)
    
    return phases.map(phase => {
      const phaseStartDate = new Date(currentDate)
      const phaseEndDate = new Date(currentDate)
      phaseEndDate.setDate(phaseEndDate.getDate() + phase.durationDays - 1)
      
      // Update current date for next phase
      currentDate = new Date(phaseEndDate)
      currentDate.setDate(currentDate.getDate() + 1)
      
      return {
        ...phase,
        startDate: phaseStartDate,
        endDate: phaseEndDate
      }
    })
  }

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />
      case 1:
        return (
          <PhaseSetupStep 
            phases={wizardData.phases} 
            programStartDate={wizardData.programStartDate}
            onUpdatePhases={(phases: WizardState['phases']) => handleUpdateData('phases', phases)}
            onUpdateStartDate={(date: Date) => handleUpdateData('programStartDate', date)}
          />
        )
      case 2:
        return (
          <ProductSelectionStep 
            selectedProducts={wizardData.selectedProducts}
            onUpdateProducts={(products: string[]) => handleUpdateData('selectedProducts', products)}
          />
        )
      case 3:
        return (
          <BiomarkerSetupStep 
            selectedBiomarkers={wizardData.selectedBiomarkers}
            onUpdateBiomarkers={(biomarkers: string[]) => handleUpdateData('selectedBiomarkers', biomarkers)}
          />
        )
      case 4:
        return (
          <DashboardIntroStep 
            preferences={wizardData.dashboardPreferences}
            onUpdatePreferences={(prefs: WizardState['dashboardPreferences']) => handleUpdateData('dashboardPreferences', prefs)}
          />
        )
      case 5:
        return <TipsStep />
      default:
        return null
    }
  }

  if (isComplete) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-medical-blue-50 to-medical-green-50">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-medical-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-medical-green-600" />
            </div>
            <CardTitle className="text-2xl">Setup Complete!</CardTitle>
            <CardDescription>
              Your Bioelectric Regeneration program is ready to go. Redirecting to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue-50 to-medical-green-50 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <CardTitle className="text-2xl font-bold text-medical-blue-800">
              Bioelectric Regeneration Setup
            </CardTitle>
            <div className="text-sm text-medical-blue-600">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mb-6">
            {steps.map((step, index) => (
              <div 
                key={step.title} 
                className="flex flex-col items-center"
                onClick={() => index < currentStep && setCurrentStep(index)}
              >
                <div 
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full ${
                    index < currentStep 
                      ? 'bg-medical-green-100 text-medical-green-600 cursor-pointer' 
                      : index === currentStep 
                        ? 'bg-medical-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                  
                  {index < steps.length - 1 && (
                    <div 
                      className={`absolute top-1/2 w-full h-0.5 -right-full ${
                        index < currentStep ? 'bg-medical-green-200' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
                <span 
                  className={`mt-2 text-xs font-medium ${
                    index === currentStep 
                      ? 'text-medical-blue-600' 
                      : index < currentStep 
                        ? 'text-medical-green-600' 
                        : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          {renderStepContent()}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete} 
              disabled={isSubmitting}
              className="bg-medical-green-600 hover:bg-medical-green-700"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Complete Setup <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
