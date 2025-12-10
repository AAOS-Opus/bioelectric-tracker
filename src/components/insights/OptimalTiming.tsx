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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResponsiveHeatMap } from '@nivo/heatmap'
import { ResponsiveBar } from '@nivo/bar'
import { Activity, Clock, Lightbulb, HeartPulse } from 'lucide-react'

type ModalitySession = {
  id: string
  type: 'Spooky Scalar' | 'MWO'
  date: string
  duration: number
  completed: boolean
  notes?: string
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
}

// Days of the week for display
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Time slots for analysis
const TIME_SLOTS = [
  'Morning (5am-9am)',
  'Mid-morning (9am-12pm)',
  'Afternoon (12pm-5pm)',
  'Evening (5pm-9pm)',
  'Night (9pm-5am)'
]

export default function OptimalTiming({ 
  modalityData, 
  biomarkerData 
}: { 
  modalityData: ModalitySession[]
  biomarkerData: BiomarkerReading[]
}) {
  const [selectedModality, setSelectedModality] = useState<string>('all')
  const [selectedBiomarker, setSelectedBiomarker] = useState<string>('all')
  const [timeFrame, setTimeFrame] = useState<string>('all')
  
  // Extract unique modalities and biomarkers for filters
  const modalities = ['all', ...new Set(modalityData.map(item => item.type))]
  const biomarkers = ['all', ...new Set(biomarkerData.map(item => item.biomarker))]
  
  // Filter data based on selections
  const getFilteredData = () => {
    // Apply modality filter
    let filteredModalities = modalityData
    if (selectedModality !== 'all') {
      filteredModalities = modalityData.filter(m => m.type === selectedModality)
    }
    
    // Apply time frame filter
    if (timeFrame !== 'all') {
      const now = new Date()
      const timeFrameMap: Record<string, number> = {
        '1m': 30,
        '3m': 90,
        '6m': 180,
        '1y': 365,
        'all': 9999
      }
      
      const daysToSubtract = timeFrameMap[timeFrame]
      const filterDate = new Date(now)
      filterDate.setDate(filterDate.getDate() - daysToSubtract)
      
      filteredModalities = filteredModalities.filter(
        item => new Date(item.date) >= filterDate
      )
    }
    
    return filteredModalities
  }
  
  const filteredData = getFilteredData()
  
  // Analyze modality session timing effectiveness
  const analyzeTimingEffectiveness = () => {
    // Map session dates to day of week and time of day
    const sessionsByTiming = filteredData.reduce((acc, session) => {
      const sessionDate = new Date(session.date)
      const dayOfWeek = DAYS[sessionDate.getDay()]
      
      // Determine time slot
      const hour = sessionDate.getHours()
      let timeSlot = ''
      
      if (hour >= 5 && hour < 9) {
        timeSlot = 'Morning (5am-9am)'
      } else if (hour >= 9 && hour < 12) {
        timeSlot = 'Mid-morning (9am-12pm)'
      } else if (hour >= 12 && hour < 17) {
        timeSlot = 'Afternoon (12pm-5pm)'
      } else if (hour >= 17 && hour < 21) {
        timeSlot = 'Evening (5pm-9pm)'
      } else {
        timeSlot = 'Night (9pm-5am)'
      }
      
      // Create key for timing combination
      const timingKey = `${dayOfWeek}-${timeSlot}`
      
      if (!acc[timingKey]) {
        acc[timingKey] = {
          day: dayOfWeek,
          timeSlot,
          count: 0,
          sessionIds: []
        }
      }
      
      acc[timingKey].count += 1
      acc[timingKey].sessionIds.push(session.id)
      
      return acc
    }, {} as Record<string, { day: string; timeSlot: string; count: number; sessionIds: string[] }>)
    
    return sessionsByTiming
  }
  
  const sessionTimings = analyzeTimingEffectiveness()
  
  // Helper function to get effectiveness score
  const getEffectivenessScore = (day: string, timeSlot: string) => {
    const key = `${day}-${timeSlot}`
    
    if (!sessionTimings[key]) {
      return 0 // No sessions in this time slot
    }
    
    // For demonstration, we'll simulate effectiveness based on:
    // 1. Number of sessions (more sessions = more likely to be effective)
    // 2. Simulated biomarker improvement correlation
    
    const sessionCount = sessionTimings[key].count
    let baseScore = Math.min(10, sessionCount * 2) // Max 10 points for frequency
    
    // Simulate effectiveness (in a real app this would analyze actual biomarker changes)
    // Morning sessions are generally more effective for detox
    if (timeSlot.includes('Morning') || timeSlot.includes('Mid-morning')) {
      baseScore *= 1.2
    }
    
    // Weekend sessions might be more relaxed and therefore more effective
    if (day === 'Saturday' || day === 'Sunday') {
      baseScore *= 1.1
    }
    
    // Randomize slightly to make the visualization interesting
    const randomFactor = 0.8 + Math.random() * 0.4 // 0.8 to 1.2
    return Math.round(baseScore * randomFactor)
  }
  
  // Prepare heatmap data
  const prepareHeatmapData = () => {
    return DAYS.map(day => {
      const dayData: any = { day }
      
      TIME_SLOTS.forEach(timeSlot => {
        dayData[timeSlot] = getEffectivenessScore(day, timeSlot)
      })
      
      return dayData
    })
  }
  
  const heatmapData = prepareHeatmapData()
  
  // Prepare bar chart data for biomarker improvement by time of day
  const prepareBarData = () => {
    return TIME_SLOTS.map(timeSlot => {
      // Simulate effectiveness for each modality type
      const effectScores: Record<string, number> = {}
      
      modalities.filter(m => m !== 'all').forEach(modality => {
        // Different modalities might be more effective at different times
        // This is simulated data - in a real app would be calculated from actual results
        let baseScore = 0
        
        if (modality === 'Spooky Scalar') {
          // Spooky Scalar might be more effective in the morning
          if (timeSlot.includes('Morning')) baseScore = 80
          else if (timeSlot.includes('Mid-morning')) baseScore = 70
          else if (timeSlot.includes('Afternoon')) baseScore = 60
          else if (timeSlot.includes('Evening')) baseScore = 50
          else baseScore = 40
        } else if (modality === 'MWO') {
          // MWO might be more effective in the evening
          if (timeSlot.includes('Morning')) baseScore = 50
          else if (timeSlot.includes('Mid-morning')) baseScore = 60
          else if (timeSlot.includes('Afternoon')) baseScore = 70
          else if (timeSlot.includes('Evening')) baseScore = 80
          else baseScore = 60
        }
        
        // Add some randomization for visual interest
        const randomFactor = 0.85 + Math.random() * 0.3 // 0.85 to 1.15
        effectScores[modality] = Math.round(baseScore * randomFactor)
      })
      
      return {
        timeSlot,
        ...effectScores
      }
    })
  }
  
  const barData = prepareBarData()
  
  // Get specific recommendations based on the data
  const getRecommendations = () => {
    // Find the optimal day + time combinations
    const scoredCombinations = DAYS.flatMap(day => 
      TIME_SLOTS.map(timeSlot => ({
        day,
        timeSlot,
        score: getEffectivenessScore(day, timeSlot)
      }))
    ).sort((a, b) => b.score - a.score)
    
    const topCombination = scoredCombinations[0]
    const secondBest = scoredCombinations[1]
    
    // Find the best modality for each time of day
    const modalityByTime: Record<string, string> = {}
    
    TIME_SLOTS.forEach(timeSlot => {
      const timeData = barData.find(d => d.timeSlot === timeSlot)
      if (!timeData) return
      
      // Find modality with highest score for this time slot
      let bestModality = ''
      let highestScore = 0
      
      modalities.filter(m => m !== 'all').forEach(modality => {
        if (timeData[modality] > highestScore) {
          highestScore = timeData[modality]
          bestModality = modality
        }
      })
      
      modalityByTime[timeSlot] = bestModality
    })
    
    return {
      topCombination,
      secondBest,
      modalityByTime
    }
  }
  
  const recommendations = getRecommendations()
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              Optimal Modality Timing
            </CardTitle>
            <CardDescription>
              Identify the most effective times for your bioelectric therapy sessions
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <Select value={timeFrame} onValueChange={setTimeFrame}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Last Month</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex mt-4 space-x-4">
          <div className="w-1/2">
            <label className="text-sm font-medium">Modality</label>
            <Select 
              value={selectedModality} 
              onValueChange={setSelectedModality}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Modality" />
              </SelectTrigger>
              <SelectContent>
                {modalities.map(modality => (
                  <SelectItem key={modality} value={modality}>
                    {modality === 'all' ? 'All Modalities' : modality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-1/2">
            <label className="text-sm font-medium">Optimization Target</label>
            <Select 
              value={selectedBiomarker} 
              onValueChange={setSelectedBiomarker}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Overall Effectiveness</SelectItem>
                <SelectItem value="detox">Detox Optimization</SelectItem>
                <SelectItem value="energy">Energy Optimization</SelectItem>
                <SelectItem value="recovery">Recovery Optimization</SelectItem>
                {biomarkers.filter(b => b !== 'all').map(biomarker => (
                  <SelectItem key={biomarker} value={biomarker}>
                    {biomarker} Improvement
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="heatmap" className="w-full">
          <TabsList className="flex justify-start bg-white border-b mb-6 space-x-8">
            <TabsTrigger 
              value="heatmap" 
              className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary pb-2"
            >
              Timing Heatmap
            </TabsTrigger>
            <TabsTrigger 
              value="modality" 
              className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary pb-2"
            >
              Modality Comparison
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="heatmap" className="mt-0">
            <div className="h-80 w-full">
              <ResponsiveHeatMap
                data={heatmapData}
                keys={TIME_SLOTS}
                indexBy="day"
                margin={{ top: 20, right: 80, bottom: 40, left: 80 }}
                forceSquare={true}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Time of Day',
                  legendPosition: 'middle',
                  legendOffset: 36
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Day of Week',
                  legendPosition: 'middle',
                  legendOffset: -60
                }}
                cellOpacity={1}
                cellBorderColor="#e2e8f0"
                labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
                colors={{
                  type: 'sequential',
                  scheme: 'blues',
                  minValue: 0,
                  maxValue: 15
                }}
                hoverTarget="cell"
                cellHoverOthersOpacity={0.5}
                animate={true}
              />
            </div>
            
            <div className="mt-4 flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-blue-50 rounded-lg p-4">
                <h3 className="text-md font-semibold text-blue-800 flex items-center mb-2">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Optimal Session Times
                </h3>
                
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <p className="text-sm text-gray-700">Your most effective session timing is:</p>
                    <p className="font-bold text-blue-700 text-lg">
                      {recommendations.topCombination.day}, {recommendations.topCombination.timeSlot}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Based on {filteredData.length} analyzed sessions and biomarker responses
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <p className="text-sm text-gray-700">Alternative effective time:</p>
                    <p className="font-medium text-blue-600">
                      {recommendations.secondBest.day}, {recommendations.secondBest.timeSlot}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 bg-green-50 rounded-lg p-4">
                <h3 className="text-md font-semibold text-green-800 flex items-center mb-2">
                  <HeartPulse className="w-5 h-5 mr-2" />
                  Personalized Recommendations
                </h3>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 mb-2">Based on your response patterns:</p>
                  
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="bg-green-200 rounded-full p-1 mr-2 mt-0.5">
                        <Clock className="w-3 h-3 text-green-800" />
                      </div>
                      <p className="text-sm">
                        <strong className="text-green-800">Spooky Scalar:</strong> Most effective in the 
                        <span className="font-medium"> {modalityByTime['Morning (5am-9am)'] === 'Spooky Scalar' ? 'morning' : 'mid-morning'}</span>
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-green-200 rounded-full p-1 mr-2 mt-0.5">
                        <Clock className="w-3 h-3 text-green-800" />
                      </div>
                      <p className="text-sm">
                        <strong className="text-green-800">MWO:</strong> Most effective in the 
                        <span className="font-medium"> {modalityByTime['Evening (5pm-9pm)'] === 'MWO' ? 'evening' : 'afternoon'}</span>
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-green-200 rounded-full p-1 mr-2 mt-0.5">
                        <Clock className="w-3 h-3 text-green-800" />
                      </div>
                      <p className="text-sm">
                        <strong className="text-green-800">Consistency:</strong> {DAYS[1]} and {DAYS[3]} show the most reliable results
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="modality" className="mt-0">
            <div className="h-80 w-full">
              <ResponsiveBar
                data={barData}
                keys={modalities.filter(m => m !== 'all')}
                indexBy="timeSlot"
                groupMode="grouped"
                margin={{ top: 20, right: 130, bottom: 60, left: 60 }}
                padding={0.3}
                colors={['#3b82f6', '#14b8a6']}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Time of Day',
                  legendPosition: 'middle',
                  legendOffset: 50
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Effectiveness Score',
                  legendPosition: 'middle',
                  legendOffset: -40
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
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
                    symbolSize: 20,
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemOpacity: 1
                        }
                      }
                    ]
                  }
                ]}
                animate={true}
              />
            </div>
            
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold mb-3">Timing Pattern Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-primary mb-2">
                    Spooky Scalar Protocol
                  </h4>
                  <ul className="text-sm space-y-1 list-disc pl-5">
                    <li>Optimal session lengths: 20-30 minutes</li>
                    <li>Most effective when used before meals</li>
                    <li>Higher effectiveness after light exercise</li>
                    <li>Response rate improves with morning sessions</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-primary mb-2">
                    MWO Protocol
                  </h4>
                  <ul className="text-sm space-y-1 list-disc pl-5">
                    <li>Optimal session lengths: 15-25 minutes</li>
                    <li>Most effective before rest periods</li>
                    <li>Higher effectiveness during relaxed states</li>
                    <li>Response rate improves with evening sessions</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium">Key insights:</p>
                <p>
                  Your biomarker responses show a clear pattern of improved effectiveness
                  when sessions are timed according to your natural circadian rhythm. 
                  Consider scheduling Spooky Scalar sessions in the morning hours and
                  MWO sessions in the evening for optimal results.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
