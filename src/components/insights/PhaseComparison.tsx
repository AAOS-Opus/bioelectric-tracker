"use client";

'use client'

import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ResponsiveRadar } from '@nivo/radar'
import { ResponsiveLine } from '@nivo/line'
import { ResponsiveBar } from '@nivo/bar'
import { 
  BarChart,
  LineChart,
  Activity,
  PieChart,
  TrendingUp,
  TrendingDown,
  Minus,
  CircleAlert
} from 'lucide-react'

type PhaseData = {
  phaseNumber: number
  name: string
  startDate: string
  endDate: string
  completed: boolean
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

const BIOMARKER_CATEGORIES = {
  'Liver': ['ALT', 'AST', 'GGT', 'Bilirubin', 'Albumin'],
  'Colon': ['CRP', 'Calprotectin', 'Zonulin', 'Candida', 'SCFA'],
  'General': ['Vitamin D', 'Iron', 'B12', 'Magnesium', 'Ferritin']
}

export default function PhaseComparison({ 
  phaseData, 
  biomarkerData 
}: { 
  phaseData: PhaseData[]
  biomarkerData: BiomarkerReading[]
}) {
  const [selectedPhase1, setSelectedPhase1] = useState<number>(1)
  const [selectedPhase2, setSelectedPhase2] = useState<number>(2)
  const [selectedCategory, setSelectedCategory] = useState<string>('Liver')
  const [chartType, setChartType] = useState<'radar' | 'line' | 'bar'>('radar')
  
  // Get phases for selector
  const phases = phaseData.map(phase => ({
    value: phase.phaseNumber,
    label: `Phase ${phase.phaseNumber}: ${phase.name}`
  }))
  
  // Filter biomarker data for selected category
  const getCategoryBiomarkers = (category: string) => {
    return BIOMARKER_CATEGORIES[category as keyof typeof BIOMARKER_CATEGORIES] || []
  }
  
  const selectedBiomarkers = getCategoryBiomarkers(selectedCategory)
  
  // Filter and process data for the selected phases
  const processPhaseData = (phaseNumber: number) => {
    const phaseBiomarkers = biomarkerData.filter(
      reading => reading.phaseNumber === phaseNumber && 
      selectedBiomarkers.includes(reading.biomarker)
    )
    
    // Group by biomarker and calculate average for each
    const biomarkerAverages = selectedBiomarkers.reduce((acc, biomarker) => {
      const readings = phaseBiomarkers.filter(r => r.biomarker === biomarker)
      const sum = readings.reduce((sum, r) => sum + r.value, 0)
      const avg = readings.length > 0 ? sum / readings.length : 0
      
      // Normalize to a 0-100 scale based on normal range
      const normalizedValue = readings.length > 0 
        ? normalizeValue(avg, readings[0].normalRange.min, readings[0].normalRange.max)
        : 0
      
      acc[biomarker] = {
        raw: avg,
        normalized: normalizedValue,
        unit: readings.length > 0 ? readings[0].unit : '',
        normalRange: readings.length > 0 ? readings[0].normalRange : { min: 0, max: 0 }
      }
      
      return acc
    }, {} as Record<string, { raw: number; normalized: number; unit: string; normalRange: { min: number; max: number } }>)
    
    return biomarkerAverages
  }
  
  // Helper to normalize values to a 0-100 scale
  const normalizeValue = (value: number, min: number, max: number) => {
    if (min === max) return 50 // Handle edge case
    
    // Determine if higher or lower is better (assumption: closer to middle of range is better)
    const middle = (min + max) / 2
    
    if (value < min) {
      // Below range
      return Math.max(0, 40 - (min - value) / min * 40)
    } else if (value > max) {
      // Above range
      return Math.max(0, 40 - (value - max) / max * 40)
    } else {
      // Within range - closer to middle is better
      const distanceFromMiddle = Math.abs(value - middle)
      const maxDistance = (max - min) / 2
      return 60 + ((maxDistance - distanceFromMiddle) / maxDistance) * 40
    }
  }
  
  const phase1Data = processPhaseData(selectedPhase1)
  const phase2Data = processPhaseData(selectedPhase2)
  
  // Prepare data for the radar chart
  const prepareRadarData = () => {
    return selectedBiomarkers.map(biomarker => ({
      biomarker,
      [`Phase ${selectedPhase1}`]: phase1Data[biomarker]?.normalized || 0,
      [`Phase ${selectedPhase2}`]: phase2Data[biomarker]?.normalized || 0
    }))
  }
  
  // Prepare data for the line chart
  const prepareLineData = () => {
    return [
      {
        id: `Phase ${selectedPhase1}`,
        data: selectedBiomarkers.map(biomarker => ({
          x: biomarker,
          y: phase1Data[biomarker]?.raw || 0
        }))
      },
      {
        id: `Phase ${selectedPhase2}`,
        data: selectedBiomarkers.map(biomarker => ({
          x: biomarker,
          y: phase2Data[biomarker]?.raw || 0
        }))
      }
    ]
  }
  
  // Prepare data for the bar chart
  const prepareBarData = () => {
    return selectedBiomarkers.map(biomarker => ({
      biomarker,
      [`Phase ${selectedPhase1}`]: phase1Data[biomarker]?.raw || 0,
      [`Phase ${selectedPhase2}`]: phase2Data[biomarker]?.raw || 0
    }))
  }
  
  const radarData = prepareRadarData()
  const lineData = prepareLineData()
  const barData = prepareBarData()
  
  // Calculate improvement percentages for key insights
  const calculateImprovements = () => {
    return selectedBiomarkers.map(biomarker => {
      const phase1Value = phase1Data[biomarker]?.raw || 0
      const phase2Value = phase2Data[biomarker]?.raw || 0
      
      if (phase1Value === 0) return { biomarker, percentage: 0, improved: false }
      
      // Determine if higher is better based on biomarker type
      // This is a simplified approach; in reality would need medical knowledge
      const higherIsBetter = ['Vitamin D', 'Iron', 'B12', 'Magnesium', 'Albumin', 'SCFA'].includes(biomarker)
      
      const percentChange = ((phase2Value - phase1Value) / phase1Value) * 100
      const improved = higherIsBetter ? percentChange > 0 : percentChange < 0
      
      return {
        biomarker,
        percentage: Math.abs(percentChange),
        improved
      }
    }).sort((a, b) => b.percentage - a.percentage)
  }
  
  const improvements = calculateImprovements()
  
  // Function to get trend icon
  const getTrendIcon = (improved: boolean, percentage: number) => {
    if (percentage < 5) return <Minus className="w-4 h-4 text-gray-500" />
    return improved 
      ? <TrendingUp className="w-4 h-4 text-green-500" /> 
      : <TrendingDown className="w-4 h-4 text-red-500" />
  }
  
  const handlePhaseSelect = (v: string) => {
    setSelectedPhase1(parseInt(v))
  }

  const handleCategorySelect = (v: string) => {
    setSelectedCategory(v as keyof typeof BIOMARKER_CATEGORIES)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Activity className="w-5 h-5 mr-2 text-primary" />
              Phase-by-Phase Health Metrics
            </CardTitle>
            <CardDescription>
              Compare key biomarkers between different treatment phases
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setChartType('radar')}
              className={`p-2 rounded-md ${chartType === 'radar' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
              title="Show radar chart"
              aria-label="Show radar chart view"
            >
              <LineChart className="w-5 h-5" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded-md ${chartType === 'line' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
              title="Show line chart"
              aria-label="Show line chart view"
            >
              <LineChart className="w-5 h-5" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded-md ${chartType === 'bar' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
              title="Show bar chart"
              aria-label="Show bar chart view"
            >
              <BarChart className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex mt-4 space-x-4">
          <div className="w-1/3">
            <label className="text-sm font-medium">Phase 1</label>
            <Select 
              value={selectedPhase1.toString()} 
              onValueChange={handlePhaseSelect}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Phase" />
              </SelectTrigger>
              <SelectContent>
                {phases.map(phase => (
                  <SelectItem key={`p1-${phase.value}`} value={phase.value.toString()}>
                    {phase.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-1/3">
            <label className="text-sm font-medium">Phase 2</label>
            <Select 
              value={selectedPhase2.toString()} 
              onValueChange={handlePhaseSelect}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Phase" />
              </SelectTrigger>
              <SelectContent>
                {phases.map(phase => (
                  <SelectItem key={`p2-${phase.value}`} value={phase.value.toString()}>
                    {phase.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-1/3">
            <label className="text-sm font-medium">Biomarker Category</label>
            <Select 
              value={selectedCategory} 
              onValueChange={handleCategorySelect}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(BIOMARKER_CATEGORIES).map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2 justify-center">
          {selectedBiomarkers.map((biomarker) => {
            const phase1Value = phase1Data[biomarker]?.raw || 0
            const phase2Value = phase2Data[biomarker]?.raw || 0
            const unit = phase1Data[biomarker]?.unit || ''
            const improved = phase1Value < phase2Value
            const change = ((phase2Value - phase1Value) / phase1Value) * 100
            
            return (
              <Badge
                key={biomarker}
                variant="outline"
                className={`text-xs flex items-center ${Math.abs(change) > 10 ? 
                  (improved ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : 
                  'border-gray-300 bg-gray-50'}`}
              >
                {biomarker}
                {phase1Value > 0 && phase2Value > 0 && (
                  <span className="ml-1 flex items-center">
                    {getTrendIcon(improved, Math.abs(change))}
                    <span className={`text-xs ml-1 ${improved ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(change).toFixed(1)}%
                    </span>
                  </span>
                )}
              </Badge>
            )
          })}
        </div>
        
        <div className="h-80 w-full">
          {chartType === 'radar' && (
            <ResponsiveRadar
              data={radarData}
              keys={[`Phase ${selectedPhase1}`, `Phase ${selectedPhase2}`]}
              indexBy="biomarker"
              maxValue={100}
              curve="linearClosed"
              borderWidth={2}
              borderColor={{ from: 'color' }}
              gridLabelOffset={36}
              dotSize={10}
              dotColor={{ theme: 'background' }}
              dotBorderWidth={2}
              dotBorderColor={{ from: 'color' }}
              enableDotLabel={true}
              dotLabel="value"
              dotLabelYOffset={-12}
              colors={['#60a5fa', '#f97316']}
              fillOpacity={0.25}
              blendMode="multiply"
              animate={true}
              motionConfig="gentle"
              legends={[
                {
                  anchor: 'top-left',
                  direction: 'column',
                  translateX: -50,
                  translateY: -40,
                  itemWidth: 80,
                  itemHeight: 20,
                  itemTextColor: '#999',
                  symbolSize: 12,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemTextColor: '#000'
                      }
                    }
                  ]
                }
              ]}
            />
          )}
          
          {chartType === 'line' && (
            <ResponsiveLine
              data={lineData}
              margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{ 
                type: 'linear', 
                min: 'auto', 
                max: 'auto', 
                stacked: false, 
                reverse: false 
              }}
              yFormat=" >-.2f"
              curve="monotoneX"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Biomarker',
                legendOffset: 40,
                legendPosition: 'middle'
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Value',
                legendOffset: -40,
                legendPosition: 'middle'
              }}
              pointSize={10}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              useMesh={true}
              legends={[
                {
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 100,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemDirection: 'left-to-right',
                  itemWidth: 80,
                  itemHeight: 20,
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: 'circle',
                  symbolBorderColor: 'rgba(0, 0, 0, .5)',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemBackground: 'rgba(0, 0, 0, .03)',
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
            />
          )}
          
          {chartType === 'bar' && (
            <ResponsiveBar
              data={barData}
              keys={[`Phase ${selectedPhase1}`, `Phase ${selectedPhase2}`]}
              indexBy="biomarker"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              groupMode="grouped"
              valueScale={{ type: 'linear' }}
              colors={{ scheme: 'nivo' }}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Biomarker',
                legendPosition: 'middle',
                legendOffset: 40
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Value',
                legendPosition: 'middle',
                legendOffset: -40
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 20
                }
              ]}
              animate={true}
            />
          )}
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-md font-semibold mb-3 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Most Improved Biomarkers
            </h3>
            
            <div className="space-y-2">
              {improvements
                .filter(item => item.improved && item.percentage > 0)
                .slice(0, 3)
                .map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center px-2 py-1 rounded-md bg-gray-50">
                    <span className="font-medium">{item.biomarker}</span>
                    <span className="text-green-600 font-semibold">+{item.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              
              {improvements.filter(item => item.improved && item.percentage > 0).length === 0 && (
                <p className="text-gray-500 text-sm italic">No significant improvements found</p>
              )}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-md font-semibold mb-3 flex items-center">
              <CircleAlert className="w-5 h-5 mr-2 text-amber-600" />
              Areas Needing Attention
            </h3>
            
            <div className="space-y-2">
              {improvements
                .filter(item => !item.improved && item.percentage > 0)
                .slice(0, 3)
                .map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center px-2 py-1 rounded-md bg-gray-50">
                    <span className="font-medium">{item.biomarker}</span>
                    <span className="text-red-600 font-semibold">{item.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              
              {improvements.filter(item => !item.improved && item.percentage > 0).length === 0 && (
                <p className="text-gray-500 text-sm italic">No areas of concern found</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600 border-t border-gray-200 pt-4">
          <p className="font-medium mb-1">Phase Comparison Insights:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              {improvements.some(i => i.improved && i.percentage > 10)
                ? `Significant improvements in ${improvements.filter(i => i.improved && i.percentage > 10).map(i => i.biomarker).join(', ')} between phases`
                : 'No significant biomarker improvements detected between these phases'}
            </li>
            <li>
              Each phase of the bioelectric protocol targets different aspects of regeneration, with changes typically appearing in Phase 2 and substantial improvements by Phase 4
            </li>
            <li>
              Consider extending phases with minimal improvement to allow more healing time
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
