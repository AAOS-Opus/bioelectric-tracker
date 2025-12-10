"use client";

'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AdherencePatterns from './AdherencePatterns'
import ModalityCorrelations from './ModalityCorrelations'
import PhaseComparison from './PhaseComparison'
import OptimalTiming from './OptimalTiming'
import ToxinElimination from './ToxinElimination'
import ActionableInsights from './ActionableInsights'
import ReportGenerator from './ReportGenerator'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// Type definitions for our data structures
type Product = {
  id: string
  name: string
  category: string
  dosage: string
  frequency: string
}

type ProductAdherenceRecord = {
  date: string
  productId: string
  productName: string
  category: string
  taken: boolean
  dosage: string
  notes: string
}

type ModalitySession = {
  id: string
  type: string
  date: string
  duration: number
  completed: boolean
  notes: string
}

type BiomarkerReading = {
  date: string
  biomarker: string
  value: number
  normalRange: {
    min: number
    max: number
  }
  unit: string
  phaseNumber: number
}

type Phase = {
  phaseNumber: number
  name: string
  startDate: string
  endDate: string
  completed: boolean
}

type ToxinReading = {
  toxin: string
  category: string
  date: string
  value: number
  unit: string
  threshold: number
}

type Insight = {
  id: string
  title: string
  description: string
  category: string
  priority: string
  trend: string
  actionItems: string[]
  relatedMetrics: string[]
  dateGenerated: string
  requiresAttention: boolean
}

type Report = {
  id: string
  title: string
  description: string
  lastGenerated: string
  templateType: string
  sections: string[]
  dateRange: {
    start: Date
    end: Date
  }
}

type InsightData = {
  productAdherence: ProductAdherenceRecord[]
  modalitySessions: ModalitySession[]
  biomarkers: BiomarkerReading[]
  phaseData: Phase[]
  toxinLevels: ToxinReading[]
  actionableInsights: Insight[]
  savedReports: Report[]
}

export default function InsightsDashboard({ userEmail }: { userEmail: string }) {
  const [insightData, setInsightData] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('adherence')

  useEffect(() => {
    const fetchInsightData = async () => {
      try {
        setLoading(true)
        // Simulate API fetch delays
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Mock data - in a real implementation, these would come from API endpoints
        const productAdherenceData = generateMockProductAdherenceData()
        const modalitySessionsData = generateMockModalitySessionsData()
        const biomarkersData = generateMockBiomarkerData()
        const phaseData = generateMockPhaseData()
        const toxinLevelsData = generateMockToxinData()
        const actionableInsightsData = generateMockInsightsData()
        const savedReportsData = generateMockReportTemplates()
        
        setInsightData({
          productAdherence: productAdherenceData,
          modalitySessions: modalitySessionsData,
          biomarkers: biomarkersData,
          phaseData: phaseData,
          toxinLevels: toxinLevelsData,
          actionableInsights: actionableInsightsData,
          savedReports: savedReportsData
        })
      } catch (error) {
        console.error('Error fetching insight data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInsightData()
  }, [userEmail])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading insights...</span>
      </div>
    )
  }

  if (!insightData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">No Data Available</h2>
          <p className="mt-2 text-gray-600">Unable to load insights data. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Health Insights Dashboard</h1>
        <p className="text-gray-600">Track your progress and discover actionable insights</p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="adherence">Adherence</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="toxins">Toxins</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <TabsContent value="adherence">
            <AdherencePatterns data={insightData.productAdherence} />
          </TabsContent>

          <TabsContent value="correlations">
            <ModalityCorrelations 
              sessions={insightData.modalitySessions}
              biomarkers={insightData.biomarkers}
            />
          </TabsContent>

          <TabsContent value="phases">
            <PhaseComparison 
              phaseData={insightData.phaseData}
              biomarkers={insightData.biomarkers}
            />
          </TabsContent>

          <TabsContent value="timing">
            <OptimalTiming 
              sessions={insightData.modalitySessions}
              adherence={insightData.productAdherence}
            />
          </TabsContent>

          <TabsContent value="toxins">
            <ToxinElimination data={insightData.toxinLevels} />
          </TabsContent>

          <TabsContent value="insights">
            <ActionableInsights insights={insightData.actionableInsights} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportGenerator 
              reports={insightData.savedReports}
              insightData={insightData}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

// Mock data generators
const generateMockProductAdherenceData = (): ProductAdherenceRecord[] => {
  const products: Product[] = [
    { id: '1', name: 'Chlorella', category: 'Detox', dosage: '2 tablets', frequency: 'twice daily' },
    { id: '2', name: 'Milk Thistle', category: 'Liver Support', dosage: '1 capsule', frequency: 'once daily' },
    { id: '3', name: 'NAC', category: 'Antioxidant', dosage: '1 capsule', frequency: 'twice daily' },
    { id: '4', name: 'TUDCA', category: 'Bile Support', dosage: '1 capsule', frequency: 'once daily' },
    { id: '5', name: 'Activated Charcoal', category: 'Binder', dosage: '2 capsules', frequency: 'as needed' }
  ]
  
  // Generate 90 days of adherence data
  const adherenceData: ProductAdherenceRecord[] = []
  const now = new Date()
  
  for (let i = 0; i < 90; i++) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    
    products.forEach(product => {
      // Randomize adherence with a bias toward higher adherence (70-80%)
      const taken = Math.random() > 0.25
      
      adherenceData.push({
        date: date.toISOString().split('T')[0],
        productId: product.id,
        productName: product.name,
        category: product.category,
        taken: taken,
        dosage: taken ? product.dosage : '0',
        notes: taken ? '' : Math.random() > 0.7 ? 'Skipped - Travelling' : ''
      })
    })
  }
  
  return adherenceData
}

const generateMockModalitySessionsData = (): ModalitySession[] => {
  const modalityTypes = ['Spooky Scalar', 'MWO']
  const durations = [15, 20, 25, 30, 40]
  const sessions: ModalitySession[] = []
  const now = new Date()
  
  // Generate 40 sessions over last 90 days
  for (let i = 0; i < 40; i++) {
    const date = new Date(now)
    date.setDate(now.getDate() - Math.floor(Math.random() * 90))
    
    // Set random time of day
    date.setHours(9 + Math.floor(Math.random() * 12))
    date.setMinutes(Math.floor(Math.random() * 60))
    
    sessions.push({
      id: `session-${i}`,
      type: modalityTypes[Math.floor(Math.random() * modalityTypes.length)],
      date: date.toISOString(),
      duration: durations[Math.floor(Math.random() * durations.length)],
      completed: Math.random() > 0.1, // 90% completion rate
      notes: Math.random() > 0.7 ? 'Felt more energized after session' : ''
    })
  }
  
  return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

const generateMockBiomarkerData = (): BiomarkerReading[] => {
  const biomarkerTypes = [
    { name: 'ALT', category: 'Liver', min: 10, max: 40, unit: 'U/L' },
    { name: 'AST', category: 'Liver', min: 10, max: 40, unit: 'U/L' },
    { name: 'GGT', category: 'Liver', min: 10, max: 60, unit: 'U/L' },
    { name: 'Bilirubin', category: 'Liver', min: 0.1, max: 1.2, unit: 'mg/dL' },
    { name: 'Albumin', category: 'Liver', min: 3.5, max: 5.0, unit: 'g/dL' },
    { name: 'CRP', category: 'Colon', min: 0, max: 3, unit: 'mg/L' },
    { name: 'Calprotectin', category: 'Colon', min: 0, max: 50, unit: 'μg/g' },
    { name: 'Zonulin', category: 'Colon', min: 0, max: 40, unit: 'ng/mL' },
    { name: 'Candida', category: 'Colon', min: 0, max: 100, unit: 'CFU' },
    { name: 'SCFA', category: 'Colon', min: 60, max: 100, unit: 'mmol/kg' },
    { name: 'Vitamin D', category: 'General', min: 30, max: 100, unit: 'ng/mL' },
    { name: 'Iron', category: 'General', min: 60, max: 170, unit: 'μg/dL' },
    { name: 'B12', category: 'General', min: 200, max: 900, unit: 'pg/mL' },
    { name: 'Magnesium', category: 'General', min: 1.5, max: 2.5, unit: 'mg/dL' },
    { name: 'Ferritin', category: 'General', min: 20, max: 200, unit: 'ng/mL' }
  ]
  
  const readings: BiomarkerReading[] = []
  const now = new Date()
  
  // Generate readings for each biomarker at different phases
  for (let phase = 1; phase <= 4; phase++) {
    const phaseDate = new Date(now)
    phaseDate.setMonth(now.getMonth() - (4 - phase) * 2)
    
    biomarkerTypes.forEach(biomarker => {
      // Start with elevated values in phase 1 and improve gradually
      let improvementFactor = phase / 4
      
      // For biomarkers where higher is better
      const higherIsBetter = ['Vitamin D', 'B12', 'Magnesium', 'Albumin', 'SCFA'].includes(biomarker.name)
      
      let value
      if (higherIsBetter) {
        // Start low and improve
        const min = biomarker.min
        const target = biomarker.min + (biomarker.max - biomarker.min) * 0.7
        value = min + (target - min) * improvementFactor
      } else {
        // Start high and decrease (improve)
        const max = biomarker.max * 1.5
        const target = biomarker.min + (biomarker.max - biomarker.min) * 0.3
        value = max - (max - target) * improvementFactor
      }
      
      // Add some randomness
      value = value * (0.9 + Math.random() * 0.2)
      
      readings.push({
        date: phaseDate.toISOString().split('T')[0],
        biomarker: biomarker.name,
        value: Number(value.toFixed(1)),
        normalRange: {
          min: biomarker.min,
          max: biomarker.max
        },
        unit: biomarker.unit,
        phaseNumber: phase
      })
    })
  }
  
  return readings
}

const generateMockPhaseData = (): Phase[] => {
  const phases: Phase[] = [
    { phaseNumber: 1, name: 'Initial Detoxification', startDate: '2023-01-01', endDate: '2023-02-28', completed: true },
    { phaseNumber: 2, name: 'Cellular Regeneration', startDate: '2023-03-01', endDate: '2023-04-30', completed: true },
    { phaseNumber: 3, name: 'Deep Tissue Repair', startDate: '2023-05-01', endDate: '2023-06-30', completed: false },
    { phaseNumber: 4, name: 'Maintenance & Prevention', startDate: '2023-07-01', endDate: '2023-08-31', completed: false }
  ]
  
  return phases
}

const generateMockToxinData = (): ToxinReading[] => {
  const toxinTypes = [
    { name: 'Mercury', category: 'Heavy Metals', threshold: 3, unit: 'μg/L' },
    { name: 'Lead', category: 'Heavy Metals', threshold: 2, unit: 'μg/dL' },
    { name: 'Arsenic', category: 'Heavy Metals', threshold: 10, unit: 'μg/L' },
    { name: 'Cadmium', category: 'Heavy Metals', threshold: 0.5, unit: 'μg/L' },
    { name: 'Aluminum', category: 'Heavy Metals', threshold: 15, unit: 'μg/L' },
    { name: 'Glyphosate', category: 'Environmental', threshold: 1, unit: 'μg/L' },
    { name: 'BPA', category: 'Environmental', threshold: 4, unit: 'μg/L' },
    { name: 'Phthalates', category: 'Environmental', threshold: 30, unit: 'μg/L' },
    { name: 'PFAs', category: 'Environmental', threshold: 5, unit: 'ng/mL' },
    { name: 'Formaldehyde', category: 'Environmental', threshold: 20, unit: 'μg/L' },
    { name: 'LPS', category: 'Microbial', threshold: 300, unit: 'EU/mL' },
    { name: 'Ochratoxin', category: 'Microbial', threshold: 2, unit: 'ng/mL' },
    { name: 'Aflatoxin', category: 'Microbial', threshold: 1, unit: 'ng/mL' },
    { name: 'Zearalenone', category: 'Microbial', threshold: 0.5, unit: 'ng/mL' },
    { name: 'DON', category: 'Microbial', threshold: 1, unit: 'ng/mL' }
  ]
  
  const readings: ToxinReading[] = []
  const now = new Date()
  
  // Generate 4 readings for each toxin (simulating monthly tests)
  toxinTypes.forEach(toxin => {
    for (let i = 0; i < 4; i++) {
      const date = new Date(now)
      date.setMonth(now.getMonth() - i)
      
      // Start with high values and reduce over time
      const maxValue = toxin.threshold * 5
      let value = maxValue * (1 - (i * 0.2))
      
      // Add randomness (but ensure general downward trend)
      const randomFactor = 0.85 + Math.random() * 0.3
      value = value * randomFactor
      
      readings.push({
        toxin: toxin.name,
        category: toxin.category,
        date: date.toISOString().split('T')[0],
        value: Number(value.toFixed(2)),
        unit: toxin.unit,
        threshold: toxin.threshold
      })
    }
  })
  
  return readings
}

const generateMockInsightsData = (): Insight[] => {
  const insights: Insight[] = [
    {
      id: 'insight-1',
      title: 'Liver Enzyme Improvements',
      description: 'Your GGT levels have decreased by 32% since starting Phase 2, indicating improved liver function.',
      category: 'Biomarkers',
      priority: 'Medium',
      trend: 'Improving',
      actionItems: [
        'Continue current liver support protocol',
        'Consider increasing Milk Thistle dosage to 2 capsules daily',
        'Schedule follow-up liver panel in 30 days'
      ],
      relatedMetrics: ['GGT', 'ALT', 'Liver Function'],
      dateGenerated: new Date().toISOString(),
      requiresAttention: false
    },
    {
      id: 'insight-2',
      title: 'Modality Session Consistency',
      description: 'Your Spooky Scalar session adherence has dropped to 65% in the past 14 days, potentially impacting detox progress.',
      category: 'Adherence',
      priority: 'High',
      trend: 'Declining',
      actionItems: [
        'Schedule sessions at consistent times',
        'Consider shorter but more frequent sessions if time is limited',
        'Enable session reminders in your calendar'
      ],
      relatedMetrics: ['Protocol Adherence', 'Session Frequency'],
      dateGenerated: new Date().toISOString(),
      requiresAttention: true
    },
    {
      id: 'insight-3',
      title: 'Toxin Elimination Plateau',
      description: 'Mercury elimination has plateaued in the past 30 days despite consistent protocol adherence.',
      category: 'Detox',
      priority: 'High',
      trend: 'Stable',
      actionItems: [
        'Add glutathione support to your supplement regimen',
        'Increase water intake to 3L daily',
        'Consider increasing binder frequency between meals'
      ],
      relatedMetrics: ['Mercury', 'Heavy Metals', 'Detox Pathways'],
      dateGenerated: new Date().toISOString(),
      requiresAttention: true
    },
    {
      id: 'insight-4',
      title: 'Phase 3 Transition Readiness',
      description: 'Based on your current biomarker improvements, you are on track to begin Phase 3 within 14 days.',
      category: 'Recommendations',
      priority: 'Medium',
      trend: 'Improving',
      actionItems: [
        'Review Phase 3 protocol requirements',
        'Order required Phase 3 supplements',
        'Schedule consultation to review Phase 3 transition plan'
      ],
      relatedMetrics: ['Phase Progress', 'Protocol Readiness'],
      dateGenerated: new Date().toISOString(),
      requiresAttention: false
    },
    {
      id: 'insight-5',
      title: 'MWO Session Timing Effectiveness',
      description: 'Evening MWO sessions (6-8pm) show 28% better improvement in cellular energy markers than morning sessions.',
      category: 'Modalities',
      priority: 'Low',
      trend: 'Improving',
      actionItems: [
        'Schedule MWO sessions in the evening when possible',
        'Maintain current session duration of 25-30 minutes',
        'Consider tracking energy levels before and after sessions'
      ],
      relatedMetrics: ['Session Timing', 'Energy Markers'],
      dateGenerated: new Date().toISOString(),
      requiresAttention: false
    },
    {
      id: 'insight-6',
      title: 'Gut Permeability Improvement',
      description: 'Zonulin levels have decreased by 45% since starting the protocol, indicating significant improvement in gut barrier function.',
      category: 'Biomarkers',
      priority: 'Medium',
      trend: 'Improving',
      actionItems: [
        'Continue current gut support protocol',
        'Maintain current probiotic regimen',
        'Consider adding targeted prebiotics to support gut barrier'
      ],
      relatedMetrics: ['Zonulin', 'Gut Permeability', 'Inflammation'],
      dateGenerated: new Date().toISOString(),
      requiresAttention: false
    },
    {
      id: 'insight-7',
      title: 'Supplement Adherence Gap',
      description: 'Chlorella adherence is at 58%, significantly lower than other supplements in your protocol.',
      category: 'Adherence',
      priority: 'Medium',
      trend: 'Declining',
      actionItems: [
        'Take Chlorella with meals to reduce potential digestive discomfort',
        'Consider switching to tablet form if capsules are difficult to swallow',
        'Set specific times for taking this supplement'
      ],
      relatedMetrics: ['Protocol Adherence', 'Detox Support'],
      dateGenerated: new Date().toISOString(),
      requiresAttention: true
    }
  ]
  
  return insights
}

const generateMockReportTemplates = (): Report[] => {
  const now = new Date()
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setMonth(now.getMonth() - 1)
  
  return [
    {
      id: 'report-1',
      title: 'Quarterly Progress Report',
      description: 'Comprehensive overview of progress for Dr. Johnson',
      lastGenerated: new Date(now.setDate(now.getDate() - 15)).toISOString(),
      templateType: 'Comprehensive',
      sections: ['demographics', 'biomarkers', 'modalitySessions', 'detoxProgress', 'recommendations'],
      dateRange: {
        start: oneMonthAgo,
        end: now
      }
    },
    {
      id: 'report-2',
      title: 'Liver Function Report',
      description: 'Focused report on liver biomarkers and detoxification',
      lastGenerated: new Date(now.setDate(now.getDate() - 30)).toISOString(),
      templateType: 'Biomarker',
      sections: ['demographics', 'biomarkers', 'biomarkerTrends', 'recommendations'],
      dateRange: {
        start: oneMonthAgo,
        end: now
      }
    }
  ]
}
