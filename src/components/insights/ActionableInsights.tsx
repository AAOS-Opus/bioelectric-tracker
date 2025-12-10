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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Lightbulb, 
  Activity, 
  Clock, 
  CheckCircle, 
  X, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  AlertCircle,
  Calendar,
  PieChart,
  HeartPulse
} from 'lucide-react'
import styles from './ActionableInsights.module.css'

type InsightCategory = 'Biomarkers' | 'Adherence' | 'Modalities' | 'Detox' | 'Recommendations'
type InsightPriority = 'High' | 'Medium' | 'Low'
type InsightTrend = 'Improving' | 'Declining' | 'Stable' | 'Mixed'

interface Insight {
  id: string
  title: string
  description: string
  category: InsightCategory
  priority: InsightPriority
  trend: InsightTrend
  actionItems: string[]
  relatedMetrics: string[]
  dateGenerated: string
  requiresAttention: boolean
}

export default function ActionableInsights({ 
  insights 
}: { 
  insights: Insight[] 
}) {
  const [filter, setFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  
  // Filter insights based on selections
  const getFilteredInsights = () => {
    let filtered = [...insights]
    
    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(insight => insight.category === filter)
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(insight => insight.priority === priorityFilter)
    }
    
    // Sort by priority and then by date (newest first)
    return filtered.sort((a, b) => {
      const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 }
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - 
                           priorityOrder[b.priority as keyof typeof priorityOrder]
      
      if (priorityDiff !== 0) return priorityDiff
      
      // If same priority, sort by date (newest first)
      return new Date(b.dateGenerated).getTime() - new Date(a.dateGenerated).getTime()
    })
  }
  
  const filteredInsights = getFilteredInsights()
  
  // Get summary stats
  const getSummaryStats = () => {
    const totalCount = insights.length
    const requireAttention = insights.filter(i => i.requiresAttention).length
    const highPriority = insights.filter(i => i.priority === 'High').length
    const improving = insights.filter(i => i.trend === 'Improving').length
    
    return {
      totalCount,
      requireAttention,
      highPriority,
      improving,
      attentionPercentage: Math.round((requireAttention / totalCount) * 100),
      improvingPercentage: Math.round((improving / totalCount) * 100)
    }
  }
  
  const stats = getSummaryStats()
  
  // Get icon for insight category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Biomarkers':
        return <Activity className="w-5 h-5 text-blue-500" />
      case 'Adherence':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'Modalities':
        return <PieChart className="w-5 h-5 text-purple-500" />
      case 'Detox':
        return <HeartPulse className="w-5 h-5 text-red-500" />
      case 'Recommendations':
        return <Lightbulb className="w-5 h-5 text-amber-500" />
      default:
        return <Lightbulb className="w-5 h-5 text-blue-500" />
    }
  }
  
  // Get icon and color for trend
  const getTrendInfo = (trend: InsightTrend) => {
    switch (trend) {
      case 'Improving':
        return {
          icon: <ArrowUpRight className="w-4 h-4" />,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'Declining':
        return {
          icon: <ArrowDownRight className="w-4 h-4" />,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 'Stable':
        return {
          icon: <Minus className="w-4 h-4" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      case 'Mixed':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'text-amber-500',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        }
      default:
        return {
          icon: <Minus className="w-4 h-4" />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }
  
  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return (
          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
            High Priority
          </Badge>
        )
      case 'Medium':
        return (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
            Medium Priority
          </Badge>
        )
      case 'Low':
        return (
          <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
            Low Priority
          </Badge>
        )
      default:
        return null
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-primary" />
              Actionable Health Insights
            </CardTitle>
            <CardDescription>
              Personalized recommendations based on your health data trends
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="insights">
          <TabsList className="mb-4">
            <TabsTrigger value="insights">Key Insights</TabsTrigger>
            <TabsTrigger value="summary">Summary Dashboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights">
            <div className="mb-4 flex space-x-4">
              <div className="w-1/2">
                <label className="text-sm font-medium">Category</label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Biomarkers">Biomarkers</SelectItem>
                    <SelectItem value="Adherence">Protocol Adherence</SelectItem>
                    <SelectItem value="Modalities">Modality Effectiveness</SelectItem>
                    <SelectItem value="Detox">Detoxification</SelectItem>
                    <SelectItem value="Recommendations">Recommendations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-1/2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="High">High Priority</SelectItem>
                    <SelectItem value="Medium">Medium Priority</SelectItem>
                    <SelectItem value="Low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {filteredInsights.length > 0 ? (
              <div className={styles.insightGrid}>
                {filteredInsights.map(insight => {
                  const trendInfo = getTrendInfo(insight.trend)
                  
                  return (
                    <Card 
                      key={insight.id} 
                      className={styles.insightCard}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          {getCategoryIcon(insight.category)}
                          <h3 className="font-medium ml-2">{insight.title}</h3>
                        </div>
                        {getPriorityBadge(insight.priority)}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{insight.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${trendInfo.bgColor} ${trendInfo.color}`}>
                          {trendInfo.icon}
                          <span className="ml-1">{insight.trend}</span>
                        </div>
                        
                        <div className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(insight.dateGenerated).toLocaleDateString()}
                        </div>
                        
                        {insight.relatedMetrics.map((metric, idx) => (
                          <div key={idx} className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            {metric}
                          </div>
                        ))}
                      </div>
                      
                      {insight.actionItems.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium mb-2">Recommended Actions:</h4>
                          <ul className="space-y-1">
                            {insight.actionItems.map((action, idx) => (
                              <li key={idx} className="text-sm flex items-start">
                                <div className="bg-blue-100 text-blue-800 rounded-full p-1 mr-2 mt-0.5">
                                  <CheckCircle className="w-3 h-3" />
                                </div>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center p-8">
                <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-700">No insights found</h3>
                <p className="text-gray-500 text-sm">
                  Try adjusting your filters or check back later for new insights
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium mb-4">Health Insight Overview</h3>
                
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Insights Requiring Attention</span>
                      <span className="text-sm font-medium">{stats.requireAttention} of {stats.totalCount}</span>
                    </div>
                    <div className="h-2 bg-primary/20 rounded-full w-full">
                      <div className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out" style={{ width: `${stats.attentionPercentage}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Improving Metrics</span>
                      <span className="text-sm font-medium">{stats.improvingPercentage}%</span>
                    </div>
                    <div className="h-2 bg-primary/20 rounded-full w-full">
                      <div className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out" style={{ width: `${stats.improvingPercentage}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">High Priority Insights</span>
                      <span className="text-sm font-medium">{stats.highPriority} of {stats.totalCount}</span>
                    </div>
                    <div className="h-2 bg-primary/20 rounded-full w-full">
                      <div className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out" style={{ width: `${(stats.highPriority / stats.totalCount) * 100}%` }} />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-3">Top Priority Actions</h3>
                  
                  <div className="space-y-3">
                    {filteredInsights
                      .filter(i => i.priority === 'High')
                      .slice(0, 3)
                      .map(insight => (
                        <div key={insight.id} className="border-l-4 border-l-red-500 pl-3 py-1">
                          <p className="font-medium text-sm">{insight.title}</p>
                          <p className="text-xs text-gray-600">{insight.actionItems[0]}</p>
                        </div>
                      ))}
                    
                    {filteredInsights.filter(i => i.priority === 'High').length === 0 && (
                      <div className="text-sm text-gray-500 italic">
                        No high priority actions at this time
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-4">Category Breakdown</h3>
                
                <div className="space-y-4">
                  {['Biomarkers', 'Adherence', 'Modalities', 'Detox', 'Recommendations'].map(category => {
                    const count = insights.filter(i => i.category === category).length
                    const percentage = (count / insights.length) * 100
                    
                    return (
                      <div key={category}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm flex items-center">
                            {getCategoryIcon(category)}
                            <span className="ml-2">{category}</span>
                          </span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                        <div className="h-2 bg-primary/20 rounded-full w-full">
                          <div className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-blue-800 mb-3">Monthly Progress</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Improving Insights:</span>
                      <span className="flex items-center text-green-600 font-medium">
                        +{insights.filter(i => i.trend === 'Improving').length}
                        <ArrowUpRight className="ml-1 w-4 h-4" />
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Declining Insights:</span>
                      <span className="flex items-center text-red-600 font-medium">
                        {insights.filter(i => i.trend === 'Declining').length}
                        <ArrowDownRight className="ml-1 w-4 h-4" />
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Stable Insights:</span>
                      <span className="flex items-center text-blue-600 font-medium">
                        {insights.filter(i => i.trend === 'Stable').length}
                        <Minus className="ml-1 w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 border-t pt-4">
              <h3 className="text-md font-medium mb-3">Recent Achievements</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {insights
                  .filter(i => i.trend === 'Improving')
                  .slice(0, 3)
                  .map(insight => (
                    <div 
                      key={insight.id} 
                      className="border border-green-200 bg-green-50 rounded-lg p-3"
                    >
                      <div className="flex items-center text-green-800 mb-1">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <h4 className="text-sm font-medium">{insight.title}</h4>
                      </div>
                      <p className="text-xs text-gray-700">{insight.description}</p>
                    </div>
                  ))}
                
                {insights.filter(i => i.trend === 'Improving').length === 0 && (
                  <div className="col-span-3 text-center py-4 text-gray-500">
                    No recent achievements to display
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
