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
import { ResponsiveLine } from '@nivo/line'
import { 
  Droplets, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight
} from 'lucide-react'

const TOXIN_CATEGORIES = {
  'Heavy Metals': ['Mercury', 'Lead', 'Arsenic', 'Cadmium', 'Aluminum'],
  'Environmental': ['Glyphosate', 'BPA', 'Phthalates', 'PFAs', 'Formaldehyde'],
  'Microbial': ['LPS', 'Ochratoxin', 'Aflatoxin', 'Zearalenone', 'DON']
}

type ToxinReading = {
  toxin: string
  category: string
  date: string
  value: number
  unit: string
  threshold: number
}

export default function ToxinElimination({ data }: { data: ToxinReading[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Heavy Metals')
  const [selectedToxin, setSelectedToxin] = useState<string>('all')
  const [timeFrame, setTimeFrame] = useState<string>('all')
  
  // Get unique toxins for the selected category
  const toxinsInCategory = ['all', ...TOXIN_CATEGORIES[selectedCategory as keyof typeof TOXIN_CATEGORIES]]
  
  // Filter data based on selections
  const getFilteredData = () => {
    // Filter by category
    let filtered = data.filter(item => item.category === selectedCategory)
    
    // Filter by specific toxin if selected
    if (selectedToxin !== 'all') {
      filtered = filtered.filter(item => item.toxin === selectedToxin)
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
      
      filtered = filtered.filter(
        item => new Date(item.date) >= filterDate
      )
    }
    
    return filtered
  }
  
  const filteredData = getFilteredData()
  
  // Organize data for chart visualization
  const prepareChartData = () => {
    // Group by toxin
    const toxinGroups: Record<string, ToxinReading[]> = {}
    
    filteredData.forEach(reading => {
      if (!toxinGroups[reading.toxin]) {
        toxinGroups[reading.toxin] = []
      }
      toxinGroups[reading.toxin].push(reading)
    })
    
    // Convert to line chart format
    return Object.keys(toxinGroups).map(toxin => {
      // Sort readings by date
      const readings = toxinGroups[toxin].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      
      // Extract data points for plotting
      const points = readings.map(reading => ({
        x: new Date(reading.date).toISOString().split('T')[0],
        y: reading.value
      }))
      
      // Add prediction points if we have enough data
      if (points.length >= 3) {
        const predictedPoints = generatePredictions(points)
        points.push(...predictedPoints)
      }
      
      return {
        id: toxin,
        data: points
      }
    })
  }
  
  // Generate predictive model points
  const generatePredictions = (dataPoints: { x: string; y: number }[]) => {
    // Simple linear regression for prediction
    // In a real implementation, use more sophisticated prediction models
    const n = dataPoints.length
    const lastPoint = dataPoints[n - 1]
    const lastDate = new Date(lastPoint.x)
    
    // Only use the last 3 points for prediction trend
    const recentPoints = dataPoints.slice(Math.max(0, n - 3))
    
    // Calculate average rate of change
    let totalChange = 0
    for (let i = 1; i < recentPoints.length; i++) {
      totalChange += recentPoints[i].y - recentPoints[i-1].y
    }
    const avgChange = totalChange / (recentPoints.length - 1)
    
    // Generate future points (3 months)
    const predictions = []
    for (let i = 1; i <= 3; i++) {
      const predictedDate = new Date(lastDate)
      predictedDate.setMonth(predictedDate.getMonth() + i)
      
      // Calculate predicted value with some randomization
      // Detox usually accelerates a bit before plateauing
      let predictedValue = lastPoint.y + (avgChange * i * 0.9)
      
      // Ensure we don't go below zero
      predictedValue = Math.max(0, predictedValue)
      
      predictions.push({
        x: predictedDate.toISOString().split('T')[0],
        y: predictedValue
      })
    }
    
    return predictions
  }
  
  const chartData = prepareChartData()
  
  // Analyze detox progress
  const analyzeDetoxProgress = () => {
    // Only analyze if toxin is selected and we have data
    if (selectedToxin === 'all' || filteredData.length === 0) {
      return {
        reductionRate: 0,
        timeToThreshold: 0,
        isPredictedToReachThreshold: false,
        status: 'unknown'
      }
    }
    
    // Sort readings by date
    const readings = [...filteredData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    // Need at least 2 readings to calculate reduction
    if (readings.length < 2) {
      return {
        reductionRate: 0,
        timeToThreshold: 0,
        isPredictedToReachThreshold: false,
        status: 'insufficient-data'
      }
    }
    
    const firstReading = readings[0]
    const lastReading = readings[readings.length - 1]
    const threshold = lastReading.threshold
    
    // Calculate reduction percentage
    const totalReduction = firstReading.value - lastReading.value
    const reductionPercentage = (totalReduction / firstReading.value) * 100
    
    // Calculate time between first and last reading in days
    const daysBetween = (new Date(lastReading.date).getTime() - new Date(firstReading.date).getTime()) / (1000 * 60 * 60 * 24)
    
    // Calculate average daily reduction
    const dailyReduction = totalReduction / daysBetween
    
    // Calculate estimated days to reach threshold
    const remainingReduction = lastReading.value - threshold
    const daysToThreshold = dailyReduction > 0 
      ? Math.ceil(remainingReduction / dailyReduction)
      : 999 // If no reduction or increase, set to a high number
    
    // Determine detox status
    let status = 'unknown'
    if (lastReading.value <= threshold) {
      status = 'optimal'
    } else if (dailyReduction <= 0) {
      status = 'stalled'
    } else if (daysToThreshold <= 90) {
      status = 'good'
    } else {
      status = 'slow'
    }
    
    return {
      reductionRate: reductionPercentage,
      timeToThreshold: daysToThreshold,
      isPredictedToReachThreshold: daysToThreshold < 365 && dailyReduction > 0,
      status
    }
  }
  
  const detoxAnalysis = analyzeDetoxProgress()
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'optimal':
        return (
          <div className="flex items-center text-green-700 bg-green-100 px-2 py-1 rounded text-sm">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Optimal
          </div>
        )
      case 'good':
        return (
          <div className="flex items-center text-blue-700 bg-blue-100 px-2 py-1 rounded text-sm">
            <TrendingDown className="w-4 h-4 mr-1" />
            Good Progress
          </div>
        )
      case 'slow':
        return (
          <div className="flex items-center text-amber-700 bg-amber-100 px-2 py-1 rounded text-sm">
            <Clock className="w-4 h-4 mr-1" />
            Slow Progress
          </div>
        )
      case 'stalled':
        return (
          <div className="flex items-center text-red-700 bg-red-100 px-2 py-1 rounded text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            Stalled
          </div>
        )
      default:
        return (
          <div className="flex items-center text-gray-700 bg-gray-100 px-2 py-1 rounded text-sm">
            Analyzing...
          </div>
        )
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Droplets className="w-5 h-5 mr-2 text-primary" />
              Toxin Elimination Tracking
            </CardTitle>
            <CardDescription>
              Monitor your detoxification progress with predictive modeling
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
            <label className="text-sm font-medium">Toxin Category</label>
            <Select 
              value={selectedCategory} 
              onValueChange={val => {
                setSelectedCategory(val)
                setSelectedToxin('all')
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(TOXIN_CATEGORIES).map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-1/2">
            <label className="text-sm font-medium">Specific Toxin</label>
            <Select 
              value={selectedToxin} 
              onValueChange={setSelectedToxin}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Toxin" />
              </SelectTrigger>
              <SelectContent>
                {toxinsInCategory.map(toxin => (
                  <SelectItem key={toxin} value={toxin}>
                    {toxin === 'all' ? 'All Toxins' : toxin}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveLine
              data={chartData}
              margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
              xScale={{ 
                type: 'time', 
                format: '%Y-%m-%d',
                precision: 'day',
              }}
              xFormat="time:%Y-%m-%d"
              yScale={{ 
                type: 'linear', 
                min: 'auto', 
                max: 'auto', 
                stacked: false, 
                reverse: false 
              }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                format: '%b %d',
                tickValues: 'every month',
                legend: 'Date',
                legendOffset: 36,
                legendPosition: 'middle'
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: selectedToxin !== 'all' ? `${selectedToxin} Level` : 'Toxin Levels',
                legendOffset: -50,
                legendPosition: 'middle'
              }}
              enableGridX={false}
              colors={{ scheme: 'category10' }}
              pointSize={10}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              enableSlices={false}
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
              markers={
                selectedToxin !== 'all' && filteredData.length > 0 
                  ? [
                      {
                        axis: 'y',
                        value: filteredData[0].threshold,
                        lineStyle: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '6 6' },
                        legend: 'Target Threshold',
                        legendOrientation: 'horizontal',
                      }
                    ]
                  : []
              }
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No toxin elimination data available for selected filters
            </div>
          )}
        </div>
        
        {selectedToxin !== 'all' && detoxAnalysis.status !== 'unknown' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-md font-semibold">{selectedToxin} Elimination Status</h3>
                {getStatusBadge(detoxAnalysis.status)}
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reduction Rate:</span>
                  <span className="font-semibold">
                    {detoxAnalysis.reductionRate.toFixed(1)}%
                  </span>
                </div>
                
                {detoxAnalysis.isPredictedToReachThreshold && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Estimated Time to Target:</span>
                    <span className="font-semibold">
                      {detoxAnalysis.timeToThreshold} days
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Sample Level:</span>
                  <span className="font-semibold">
                    {filteredData.length > 0 
                      ? `${filteredData[filteredData.length - 1].value} ${filteredData[filteredData.length - 1].unit}`
                      : 'N/A'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Target Threshold:</span>
                  <span className="font-semibold text-green-600">
                    {filteredData.length > 0 
                      ? `${filteredData[filteredData.length - 1].threshold} ${filteredData[filteredData.length - 1].unit}`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-md font-semibold mb-3">Recommended Optimizations</h3>
              
              <div className="space-y-3">
                {detoxAnalysis.status === 'stalled' && (
                  <>
                    <div className="flex items-start">
                      <div className="bg-red-100 rounded-full p-1 mr-2 mt-0.5">
                        <ArrowRight className="w-3 h-3 text-red-800" />
                      </div>
                      <p className="text-sm">
                        Increase daily water intake to 3L and add lemon
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-red-100 rounded-full p-1 mr-2 mt-0.5">
                        <ArrowRight className="w-3 h-3 text-red-800" />
                      </div>
                      <p className="text-sm">
                        Add advanced binder supplements between modality sessions
                      </p>
                    </div>
                  </>
                )}
                
                {detoxAnalysis.status === 'slow' && (
                  <>
                    <div className="flex items-start">
                      <div className="bg-amber-100 rounded-full p-1 mr-2 mt-0.5">
                        <ArrowRight className="w-3 h-3 text-amber-800" />
                      </div>
                      <p className="text-sm">
                        Increase modality session frequency to 5x per week
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-amber-100 rounded-full p-1 mr-2 mt-0.5">
                        <ArrowRight className="w-3 h-3 text-amber-800" />
                      </div>
                      <p className="text-sm">
                        Add glutathione support supplements to enhance detox pathways
                      </p>
                    </div>
                  </>
                )}
                
                {detoxAnalysis.status === 'good' && (
                  <>
                    <div className="flex items-start">
                      <div className="bg-blue-100 rounded-full p-1 mr-2 mt-0.5">
                        <ArrowRight className="w-3 h-3 text-blue-800" />
                      </div>
                      <p className="text-sm">
                        Maintain current protocol with consistent timing
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-blue-100 rounded-full p-1 mr-2 mt-0.5">
                        <ArrowRight className="w-3 h-3 text-blue-800" />
                      </div>
                      <p className="text-sm">
                        Consider infrared sauna 2x weekly to enhance elimination
                      </p>
                    </div>
                  </>
                )}
                
                {detoxAnalysis.status === 'optimal' && (
                  <>
                    <div className="flex items-start">
                      <div className="bg-green-100 rounded-full p-1 mr-2 mt-0.5">
                        <ArrowRight className="w-3 h-3 text-green-800" />
                      </div>
                      <p className="text-sm">
                        Focus on maintenance protocol to prevent re-accumulation
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-green-100 rounded-full p-1 mr-2 mt-0.5">
                        <ArrowRight className="w-3 h-3 text-green-800" />
                      </div>
                      <p className="text-sm">
                        Transition to monthly testing instead of bi-weekly
                      </p>
                    </div>
                  </>
                )}
                
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-1 mr-2 mt-0.5">
                    <ArrowRight className="w-3 h-3 text-blue-800" />
                  </div>
                  <p className="text-sm">
                    Check for correlations with other toxins in this category
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedToxin === 'all' && (
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold text-blue-800 mb-3">
              Overall {selectedCategory} Detoxification Insights
            </h3>
            
            <p className="text-sm text-gray-700 mb-3">
              Select a specific toxin from the dropdown above to see detailed elimination 
              projections, status, and personalized recommendations.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded border border-blue-200">
                <h4 className="text-sm font-medium text-blue-700">Key Detox Trends</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Consistent modality sessions show 2-3x faster elimination rates
                  compared to intermittent usage patterns.
                </p>
              </div>
              
              <div className="bg-white p-3 rounded border border-blue-200">
                <h4 className="text-sm font-medium text-blue-700">Modality Impact</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Spooky Scalar sessions show stronger correlation with heavy metal
                  reduction, while MWO impacts environmental toxins more effectively.
                </p>
              </div>
              
              <div className="bg-white p-3 rounded border border-blue-200">
                <h4 className="text-sm font-medium text-blue-700">Protocol Synergy</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Combined protocol adherence (modalities + supplements) shows
                  exponential rather than linear improvement in detox markers.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
