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
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { ResponsiveHeatMap } from '@nivo/heatmap'
import { Activity } from 'lucide-react'

type ProductAdherenceData = {
  product: string
  date: string
  completed: boolean
  category: string
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function AdherencePatterns({ data }: { data: ProductAdherenceData[] }) {
  const [view, setView] = useState<'heatmap' | 'calendar'>('heatmap')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  
  // Extract unique products and categories for filters
  const products = ['all', ...new Set(data.map(item => item.product))]
  const categories = ['all', ...new Set(data.map(item => item.category))]
  
  // Filter data based on selections
  const filteredData = data.filter(item => 
    (productFilter === 'all' || item.product === productFilter) &&
    (categoryFilter === 'all' || item.category === categoryFilter)
  )
  
  // Process data for heatmap visualization
  const processHeatmapData = () => {
    const productGroups: Record<string, Record<string, number>> = {}
    
    filteredData.forEach(item => {
      const product = item.product
      const date = new Date(item.date)
      const month = monthNames[date.getMonth()]
      
      if (!productGroups[product]) {
        productGroups[product] = {}
        monthNames.forEach(m => productGroups[product][m] = 0)
      }
      
      if (item.completed) {
        productGroups[product][month] += 1
      }
    })
    
    return Object.keys(productGroups).map(product => ({
      product,
      ...productGroups[product]
    }))
  }
  
  // Process data for calendar view
  const processCalendarData = () => {
    const calendarData: Record<string, number> = {}
    
    filteredData.forEach(item => {
      const dateStr = item.date.split('T')[0]
      if (!calendarData[dateStr]) {
        calendarData[dateStr] = 0
      }
      
      if (item.completed) {
        calendarData[dateStr] += 1
      }
    })
    
    return calendarData
  }
  
  const heatmapData = processHeatmapData()
  const calendarData = processCalendarData()
  
  // Calculate adherence statistics
  const calculateAdherenceStats = () => {
    if (!data.length) return { percentage: 0, streak: 0 }
    
    const completed = data.filter(item => item.completed).length
    const percentage = Math.round((completed / data.length) * 100)
    
    // Find current streak
    const sortedDates = [...data]
      .filter(item => item.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(item => new Date(item.date).toISOString().split('T')[0])
    
    let streak = 0
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const current = new Date(sortedDates[i])
      const next = new Date(sortedDates[i + 1])
      const diffTime = Math.abs(current.getTime() - next.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        streak++
      } else {
        break
      }
    }
    
    return { percentage, streak: streak + 1 }
  }
  
  const adherenceStats = calculateAdherenceStats()
  
  // Generate color for heatmap cell
  const getHeatmapColor = (value: number) => {
    if (value === 0) return '#f3f4f6'
    if (value <= 5) return '#cffafe'
    if (value <= 10) return '#67e8f9'
    if (value <= 15) return '#22d3ee'
    if (value <= 20) return '#06b6d4'
    return '#0891b2'
  }
  
  // Generate day styling for calendar
  const getDayStyle = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const value = calendarData[dateStr] || 0
    const backgroundColor = getHeatmapColor(value)
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        color: value > 10 ? 'white' : 'black'
      }
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Activity className="w-5 h-5 mr-2 text-primary" />
              Product Adherence Patterns
            </CardTitle>
            <CardDescription>
              Track your supplement usage patterns over time
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant={view === 'heatmap' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setView('heatmap')}
            >
              Heatmap
            </Button>
            <Button 
              variant={view === 'calendar' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setView('calendar')}
            >
              Calendar
            </Button>
          </div>
        </div>
        
        <div className="flex mt-4 space-x-4">
          <div className="w-1/2">
            <label className="text-sm font-medium">Filter by Product</label>
            <Select 
              value={productFilter} 
              onValueChange={setProductFilter}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product} value={product}>
                    {product === 'all' ? 'All Products' : product}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-1/2">
            <label className="text-sm font-medium">Filter by Category</label>
            <Select 
              value={categoryFilter} 
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-700">Adherence Rate</h4>
            <p className="text-2xl font-bold">{adherenceStats.percentage}%</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-700">Current Streak</h4>
            <p className="text-2xl font-bold">{adherenceStats.streak} days</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-700">Products Tracked</h4>
            <p className="text-2xl font-bold">{products.length - 1}</p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-amber-700">Most Consistent</h4>
            <p className="text-xl font-bold truncate">
              {products.length > 1 ? products[1] : 'N/A'}
            </p>
          </div>
        </div>
        
        {view === 'heatmap' && (
          <div className="h-80 w-full">
            {heatmapData.length > 0 ? (
              <ResponsiveHeatMap
                data={heatmapData}
                keys={monthNames}
                indexBy="product"
                margin={{ top: 20, right: 90, bottom: 60, left: 100 }}
                colors={value => getHeatmapColor(value)}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Month',
                  legendOffset: 46
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Product',
                  legendPosition: 'middle',
                  legendOffset: -80
                }}
                cellOpacity={1}
                cellBorderColor="#e2e8f0"
                labelTextColor="#2d3748"
                defs={[]}
                fill={[]}
                animate={true}
                motionStiffness={90}
                motionDamping={15}
                hoverTarget="cell"
                cellHoverOthersOpacity={0.5}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No adherence data available for selected filters
              </div>
            )}
          </div>
        )}
        
        {view === 'calendar' && (
          <div className="mt-6">
            <Calendar
              modifiers={{
                completed: (date) => {
                  const dateStr = date.toISOString().split('T')[0]
                  return !!calendarData[dateStr]
                }
              }}
              modifiersStyles={{
                completed: {
                  fontWeight: 'bold'
                }
              }}
              components={{
                DayContent: ({ date }) => {
                  const dateStr = date.toISOString().split('T')[0]
                  const count = calendarData[dateStr] || 0
                  return (
                    <div className="h-full w-full flex flex-col items-center justify-center">
                      <div>{date.getDate()}</div>
                      {count > 0 && (
                        <div className="text-xs mt-1 font-bold">
                          {count} taken
                        </div>
                      )}
                    </div>
                  )
                }
              }}
              dayStyle={getDayStyle}
              className="border rounded-md p-4"
            />
          </div>
        )}
        
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-2">Key Insights:</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>Your adherence is strongest on weekdays, with noticeable drops on weekends</li>
            <li>Detox category products show the highest consistency in usage</li>
            <li>Morning protocols have better adherence than evening protocols</li>
            <li>Consider setting reminders for weekends to improve overall adherence</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
