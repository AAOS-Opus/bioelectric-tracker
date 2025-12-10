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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { ResponsiveScatterPlot } from '@nivo/scatterplot'
import { ResponsiveBar } from '@nivo/bar'
import { ResponsiveHeatMap } from '@nivo/heatmap'
import { ActivitySquare, TrendingUp, Lightbulb } from 'lucide-react'

type ModalitySession = {
  id: string
  type: string
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

export default function ModalityCorrelations({ 
  modalityData, 
  biomarkerData 
}: { 
  modalityData: ModalitySession[]
  biomarkerData: BiomarkerReading[]
}) {
  const [selectedModality, setSelectedModality] = useState<string>('all')
  const [selectedBiomarker, setSelectedBiomarker] = useState<string>('all')
  const [timeFrame, setTimeFrame] = useState<string>('3m')
  const [visualizationType, setVisualizationType] = useState<string>('correlation')
  
  // Extract unique modalities and biomarkers for filters
  const modalities = ['all', ...new Set(modalityData.map(item => item.type))]
  const biomarkers = ['all', ...new Set(biomarkerData.map(item => item.biomarker))]
  
  // Filter data based on selections
  const filteredModalityData = modalityData.filter(item => 
    selectedModality === 'all' || item.type === selectedModality
  )
  
  const filteredBiomarkerData = biomarkerData.filter(item => 
    selectedBiomarker === 'all' || item.biomarker === selectedBiomarker
  )
  
  // Time frame filter function
  const getTimeFilteredData = (data: any[], dateField: string) => {
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
    
    return data.filter(item => new Date(item[dateField]) >= filterDate)
  }
  
  const timeFilteredModalities = getTimeFilteredData(filteredModalityData, 'date')
  const timeFilteredBiomarkers = getTimeFilteredData(filteredBiomarkerData, 'date')
  
  // Calculate correlations between modality usage and biomarker changes
  const calculateCorrelations = () => {
    if (selectedModality === 'all' || selectedBiomarker === 'all') {
      // For all modalities or biomarkers, calculate overall effect size
      return modalities
        .filter(m => m !== 'all')
        .map(modality => {
          const modalitySessions = timeFilteredModalities.filter(
            m => m.type === modality
          )
          
          // Get biomarker readings after modality sessions
          const biomarkerChanges = biomarkers
            .filter(b => b !== 'all')
            .map(biomarker => {
              const relevantBiomarkers = timeFilteredBiomarkers.filter(
                b => b.biomarker === biomarker
              )
              
              // Calculate average effect on biomarker
              const effectSize = modalitySessions.length > 0 && relevantBiomarkers.length > 0
                ? calculateEffectSize(modalitySessions, relevantBiomarkers)
                : 0
                
              return {
                biomarker,
                effect: effectSize
              }
            })
          
          return {
            modality,
            correlations: biomarkerChanges
          }
        })
    } else {
      // For specific modality and biomarker, calculate detailed correlation
      const modalitySessions = timeFilteredModalities
      const biomarkerReadings = timeFilteredBiomarkers
      
      return createDetailedCorrelation(modalitySessions, biomarkerReadings)
    }
  }
  
  // Helper function to calculate effect size
  const calculateEffectSize = (
    sessions: ModalitySession[], 
    readings: BiomarkerReading[]
  ) => {
    // This is a simplified effect size calculation
    // In a real implementation, this would be more sophisticated
    
    // Calculate average biomarker value before sessions
    const sessionDates = sessions.map(s => new Date(s.date).getTime())
    const earliestSession = Math.min(...sessionDates)
    
    const beforeReadings = readings.filter(
      r => new Date(r.date).getTime() < earliestSession
    )
    
    const afterReadings = readings.filter(
      r => new Date(r.date).getTime() >= earliestSession
    )
    
    if (beforeReadings.length === 0 || afterReadings.length === 0) {
      return 0
    }
    
    const beforeAvg = beforeReadings.reduce((sum, r) => sum + r.value, 0) / beforeReadings.length
    const afterAvg = afterReadings.reduce((sum, r) => sum + r.value, 0) / afterReadings.length
    
    // Calculate normalized effect (percentage change)
    const normalizedEffect = beforeAvg !== 0 
      ? ((afterAvg - beforeAvg) / beforeAvg) * 100 
      : 0
    
    return normalizedEffect
  }
  
  // Create detailed correlation data for scatter plot
  const createDetailedCorrelation = (
    sessions: ModalitySession[], 
    readings: BiomarkerReading[]
  ) => {
    const sessionsByDate = sessions.reduce((acc, session) => {
      const date = new Date(session.date).toISOString().split('T')[0]
      
      if (!acc[date]) {
        acc[date] = []
      }
      
      acc[date].push(session)
      return acc
    }, {} as Record<string, ModalitySession[]>)
    
    // Create scatter plot data
    return readings.map(reading => {
      const readingDate = new Date(reading.date).toISOString().split('T')[0]
      const previousDay = new Date(reading.date)
      previousDay.setDate(previousDay.getDate() - 1)
      const prevDayStr = previousDay.toISOString().split('T')[0]
      
      // Check if modality session occurred in the previous day
      const hadSession = sessionsByDate[prevDayStr] ? true : false
      const sessionDuration = hadSession 
        ? sessionsByDate[prevDayStr].reduce((sum, s) => sum + s.duration, 0) 
        : 0
      
      return {
        x: sessionDuration,
        y: reading.value,
        date: readingDate,
        color: hadSession ? '#3b82f6' : '#94a3b8'
      }
    })
  }
  
  const correlationData = calculateCorrelations()
  
  // Prepare heatmap data for visualization
  const prepareHeatmapData = () => {
    if (Array.isArray(correlationData) && correlationData.length > 0 && 'modality' in correlationData[0]) {
      return correlationData.map(item => {
        const data: any = { modality: item.modality }
        
        item.correlations.forEach(corr => {
          data[corr.biomarker] = corr.effect
        })
        
        return data
      })
    }
    
    return []
  }
  
  const heatmapData = prepareHeatmapData()
  
  // Prepare bar chart data
  const prepareBarData = () => {
    if (selectedModality !== 'all' && selectedBiomarker !== 'all') {
      return []
    }
    
    if (selectedModality !== 'all') {
      return biomarkers
        .filter(b => b !== 'all')
        .map(biomarker => {
          const effect = timeFilteredModalities.length > 0 && timeFilteredBiomarkers.length > 0
            ? calculateEffectSize(
                timeFilteredModalities,
                timeFilteredBiomarkers.filter(b => b.biomarker === biomarker)
              )
            : 0
            
          return {
            biomarker,
            effect: parseFloat(effect.toFixed(2)),
            color: effect > 0 ? '#4ade80' : '#f87171'
          }
        })
    }
    
    if (selectedBiomarker !== 'all') {
      return modalities
        .filter(m => m !== 'all')
        .map(modality => {
          const effect = timeFilteredModalities.filter(m => m.type === modality).length > 0
            ? calculateEffectSize(
                timeFilteredModalities.filter(m => m.type === modality),
                timeFilteredBiomarkers
              )
            : 0
            
          return {
            modality,
            effect: parseFloat(effect.toFixed(2)),
            color: effect > 0 ? '#4ade80' : '#f87171'
          }
        })
    }
    
    return []
  }
  
  const barData = prepareBarData()
  
  // Identify strongest correlations for insights
  const getTopCorrelations = () => {
    if (!Array.isArray(correlationData) || correlationData.length === 0) {
      return []
    }
    
    const allCorrelations = correlationData.flatMap(item => 
      item.correlations.map(corr => ({
        modality: item.modality,
        biomarker: corr.biomarker,
        effect: corr.effect
      }))
    )
    
    return allCorrelations
      .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))
      .slice(0, 3)
  }
  
  const topCorrelations = getTopCorrelations()
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <ActivitySquare className="w-5 h-5 mr-2 text-primary" />
              Modality & Biomarker Correlations
            </CardTitle>
            <CardDescription>
              Analyze how modality sessions impact your biomarkers
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
            <label className="text-sm font-medium">Biomarker</label>
            <Select 
              value={selectedBiomarker} 
              onValueChange={setSelectedBiomarker}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Biomarker" />
              </SelectTrigger>
              <SelectContent>
                {biomarkers.map(biomarker => (
                  <SelectItem key={biomarker} value={biomarker}>
                    {biomarker === 'all' ? 'All Biomarkers' : biomarker}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={visualizationType} onValueChange={setVisualizationType} className="w-full">
          <TabsList className="flex justify-start bg-white border-b mb-6 space-x-8">
            <TabsTrigger 
              value="correlation" 
              className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary pb-2"
            >
              Correlation Matrix
            </TabsTrigger>
            <TabsTrigger 
              value="scatter" 
              className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary pb-2"
            >
              Scatter Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="impact" 
              className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary pb-2"
            >
              Impact Chart
            </TabsTrigger>
          </TabsList>
        
          <TabsContent value="correlation" className="mt-0">
            <div className="h-80 w-full">
              {heatmapData.length > 0 ? (
                <ResponsiveHeatMap
                  data={heatmapData}
                  keys={biomarkers.filter(b => b !== 'all')}
                  indexBy="modality"
                  margin={{ top: 20, right: 90, bottom: 60, left: 100 }}
                  colors={{
                    type: 'diverging',
                    scheme: 'red_blue',
                    divergeAt: 0.5,
                    minValue: -20,
                    maxValue: 20
                  }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: 'Biomarker',
                    legendOffset: 46
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Modality',
                    legendPosition: 'middle',
                    legendOffset: -80
                  }}
                  cellOpacity={1}
                  cellBorderColor="#e2e8f0"
                  labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                  defs={[]}
                  fill={[]}
                  animate={true}
                  hoverTarget="cell"
                  cellHoverOthersOpacity={0.5}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select modality and biomarker combinations to view correlations
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="scatter" className="mt-0">
            <div className="h-80 w-full">
              {Array.isArray(correlationData) && !('modality' in (correlationData[0] || {})) ? (
                <ResponsiveScatterPlot
                  data={[
                    {
                      id: `${selectedModality} → ${selectedBiomarker}`,
                      data: correlationData as any[]
                    }
                  ]}
                  margin={{ top: 20, right: 20, bottom: 70, left: 90 }}
                  xScale={{ type: 'linear', min: 0, max: 'auto' }}
                  yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                  colors={d => d.color || '#3b82f6'}
                  nodeSize={8}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Session Duration (minutes)',
                    legendPosition: 'middle',
                    legendOffset: 46
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: `${selectedBiomarker} Level`,
                    legendPosition: 'middle',
                    legendOffset: -60
                  }}
                  legends={[
                    {
                      anchor: 'bottom-right',
                      direction: 'row',
                      translateY: 60,
                      itemWidth: 130,
                      itemHeight: 12,
                      symbolSize: 12,
                      symbolShape: 'circle',
                      effects: [
                        {
                          on: 'hover',
                          style: {
                            itemTextColor: '#000',
                            itemBackground: '#f0f9ff'
                          }
                        }
                      ]
                    }
                  ]}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select a specific modality and biomarker to see detailed correlation
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="impact" className="mt-0">
            <div className="h-80 w-full">
              {barData.length > 0 ? (
                <ResponsiveBar
                  data={barData}
                  keys={['effect']}
                  indexBy={selectedModality !== 'all' ? 'biomarker' : 'modality'}
                  margin={{ top: 20, right: 20, bottom: 70, left: 60 }}
                  padding={0.3}
                  valueScale={{ type: 'linear' }}
                  colors={({ data }) => data.color}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: selectedModality !== 'all' ? 'Biomarker' : 'Modality',
                    legendPosition: 'middle',
                    legendOffset: 55
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Effect Size (%)',
                    legendPosition: 'middle',
                    legendOffset: -50
                  }}
                  labelFormat={value => `${value}%`}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                  animate={true}
                  role="application"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select either all modalities or all biomarkers to see impact analysis
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-md font-semibold text-blue-800 flex items-center mb-3">
            <Lightbulb className="w-5 h-5 mr-2" />
            Key Correlations & Insights
          </h3>
          
          {topCorrelations.length > 0 ? (
            <div className="space-y-3">
              {topCorrelations.map((corr, idx) => (
                <div key={idx} className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${Math.abs(corr.effect) > 10 ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <div>
                    <span className="font-medium">{corr.modality}</span> shows a 
                    <span className={`font-semibold mx-1 ${corr.effect > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {corr.effect > 0 ? 'positive' : 'negative'} correlation
                    </span> 
                    with <span className="font-medium">{corr.biomarker}</span> 
                    <span className="text-gray-600">
                      ({corr.effect > 0 ? '+' : ''}{corr.effect.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="pt-3 border-t border-blue-200 mt-3 text-sm text-blue-700">
                <p className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <strong>Recommendation:</strong> 
                  <span className="ml-1">
                    {topCorrelations[0]?.effect > 0 
                      ? `Consider increasing frequency of ${topCorrelations[0]?.modality} sessions for optimized ${topCorrelations[0]?.biomarker} results.`
                      : `Monitor ${topCorrelations[0]?.biomarker} closely after ${topCorrelations[0]?.modality} sessions as there may be a temporary detox reaction.`
                    }
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">
              Select modality and biomarker combinations to view correlation insights
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
