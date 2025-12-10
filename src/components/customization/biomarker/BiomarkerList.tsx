'use client'

import React, { useState, useEffect } from 'react'
import { 
  AlertCircle,
  CheckCircle, 
  Edit, 
  Star, 
  StarOff,
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Biomarker {
  _id: string
  name: string
  description?: string
  unit?: string
  category: string
  inputType: 'numeric' | 'scale' | 'boolean' | 'text'
  minValue?: number
  maxValue?: number
  targetValue?: number
  targetDirection: 'increase' | 'decrease' | 'maintain'
  scaleOptions?: string[]
  frequency: 'daily' | 'weekly' | 'monthly'
  phases: string[]
  isKeyMetric: boolean
  visualType: 'line' | 'bar' | 'gauge'
  active: boolean
  customLabels?: {
    trueLabel?: string
    falseLabel?: string
    minLabel?: string
    maxLabel?: string
  }
  precision?: number
  tags: string[]
  correlationEnabled: boolean
  correlationTimeframe?: number
  createdAt: Date
  updatedAt: Date
}

interface BiomarkerCategory {
  _id: string
  name: string
  description?: string
  color: string
  order: number
}

interface BiomarkerListProps {
  biomarkers: Biomarker[]
  categories: BiomarkerCategory[]
  onEdit: (biomarker: Biomarker) => void
  onToggleActive: (biomarkerId: string, isActive: boolean) => void
  onToggleKeyMetric: (biomarkerId: string, isKeyMetric: boolean) => void
  onReorder: (reorderedBiomarkers: Biomarker[]) => void
}

export function BiomarkerList({
  biomarkers,
  categories,
  onEdit,
  onToggleActive,
  onToggleKeyMetric,
  onReorder
}: BiomarkerListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedInputTypes, setSelectedInputTypes] = useState<string[]>([])
  const [selectedFrequencies, setSelectedFrequencies] = useState<string[]>([])
  const [keyMetricsOnly, setKeyMetricsOnly] = useState(false)
  const [activeOnly, setActiveOnly] = useState(true)
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  
  // Group biomarkers by category
  const biomarkersByCategory = biomarkers.reduce((acc, biomarker) => {
    if (!acc[biomarker.category]) {
      acc[biomarker.category] = [];
    }
    acc[biomarker.category].push(biomarker);
    return acc;
  }, {} as Record<string, Biomarker[]>);
  
  // Filter and sort biomarkers
  const filteredBiomarkers = biomarkers.filter(biomarker => {
    // Search term filter
    const matchesSearch = 
      biomarker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (biomarker.description && biomarker.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      biomarker.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Category filter
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(biomarker.category);
    
    // Input type filter
    const matchesInputType = selectedInputTypes.length === 0 || selectedInputTypes.includes(biomarker.inputType);
    
    // Frequency filter
    const matchesFrequency = selectedFrequencies.length === 0 || selectedFrequencies.includes(biomarker.frequency);
    
    // Key metrics filter
    const matchesKeyMetrics = !keyMetricsOnly || biomarker.isKeyMetric;
    
    // Active filter
    const matchesActive = !activeOnly || biomarker.active;
    
    return matchesSearch && matchesCategory && matchesInputType && matchesFrequency && matchesKeyMetrics && matchesActive;
  }).sort((a, b) => {
    // Handle different field types
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortField === 'category') {
      return sortDirection === 'asc' 
        ? a.category.localeCompare(b.category)
        : b.category.localeCompare(a.category);
    } else if (sortField === 'inputType') {
      return sortDirection === 'asc' 
        ? a.inputType.localeCompare(b.inputType)
        : b.inputType.localeCompare(a.inputType);
    } else if (sortField === 'frequency') {
      return sortDirection === 'asc' 
        ? a.frequency.localeCompare(b.frequency)
        : b.frequency.localeCompare(a.frequency);
    } else if (sortField === 'updatedAt') {
      return sortDirection === 'asc' 
        ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return 0;
  });
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
  
  const handleInputTypeSelect = (inputType: string) => {
    setSelectedInputTypes(prev => 
      prev.includes(inputType)
        ? prev.filter(type => type !== inputType)
        : [...prev, inputType]
    );
  };
  
  const handleFrequencySelect = (frequency: string) => {
    setSelectedFrequencies(prev => 
      prev.includes(frequency)
        ? prev.filter(freq => freq !== frequency)
        : [...prev, frequency]
    );
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedInputTypes([]);
    setSelectedFrequencies([]);
    setKeyMetricsOnly(false);
    setActiveOnly(true);
    setSortField('name');
    setSortDirection('asc');
  };
  
  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color || '#94a3b8'; // Default slate-400 color
  };
  
  const getInputTypeLabel = (type: string) => {
    switch(type) {
      case 'numeric': return 'Numeric';
      case 'scale': return 'Scale';
      case 'boolean': return 'Yes/No';
      case 'text': return 'Text';
      default: return type;
    }
  };
  
  const getFrequencyLabel = (frequency: string) => {
    switch(frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return frequency;
    }
  };
  
  const getTargetDirectionIcon = (direction: string) => {
    switch(direction) {
      case 'increase': return <ChevronUp className="h-4 w-4 text-green-500" />;
      case 'decrease': return <ChevronDown className="h-4 w-4 text-amber-500" />;
      case 'maintain': return <span className="text-blue-500">≈</span>;
      default: return null;
    }
  };
  
  const getTotalActiveCount = () => {
    return biomarkers.filter(b => b.active).length;
  };
  
  const getTotalKeyMetricsCount = () => {
    return biomarkers.filter(b => b.isKeyMetric).length;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search biomarkers by name, description, or tags"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="whitespace-nowrap"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
        
        {showFilters && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Filters</CardTitle>
              <CardDescription>
                Filter biomarkers by various criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Categories</Label>
                  <ScrollArea className="h-24 rounded-md border">
                    <div className="p-2 space-y-1">
                      {categories.map((category) => (
                        <div key={category._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category._id}`}
                            checked={selectedCategories.includes(category.name)}
                            onCheckedChange={() => handleCategorySelect(category.name)}
                          />
                          <Label
                            htmlFor={`category-${category._id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              ></div>
                              <span>{category.name}</span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                
                <div className="space-y-2">
                  <Label>Input Types</Label>
                  <div className="space-y-1">
                    {['numeric', 'scale', 'boolean', 'text'].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={selectedInputTypes.includes(type)}
                          onCheckedChange={() => handleInputTypeSelect(type)}
                        />
                        <Label
                          htmlFor={`type-${type}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {getInputTypeLabel(type)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <div className="space-y-1">
                    {['daily', 'weekly', 'monthly'].map((frequency) => (
                      <div key={frequency} className="flex items-center space-x-2">
                        <Checkbox
                          id={`frequency-${frequency}`}
                          checked={selectedFrequencies.includes(frequency)}
                          onCheckedChange={() => handleFrequencySelect(frequency)}
                        />
                        <Label
                          htmlFor={`frequency-${frequency}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {getFrequencyLabel(frequency)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="key-metrics"
                    checked={keyMetricsOnly}
                    onCheckedChange={setKeyMetricsOnly}
                  />
                  <Label htmlFor="key-metrics" className="cursor-pointer">
                    Key Metrics Only
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active-only"
                    checked={activeOnly}
                    onCheckedChange={setActiveOnly}
                  />
                  <Label htmlFor="active-only" className="cursor-pointer">
                    Active Biomarkers Only
                  </Label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort-field">Sort By</Label>
                  <Select
                    value={sortField}
                    onValueChange={(value) => setSortField(value)}
                  >
                    <SelectTrigger id="sort-field">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="inputType">Input Type</SelectItem>
                      <SelectItem value="frequency">Frequency</SelectItem>
                      <SelectItem value="updatedAt">Last Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sort-direction">Direction</Label>
                  <Select
                    value={sortDirection}
                    onValueChange={(value) => setSortDirection(value as 'asc' | 'desc')}
                  >
                    <SelectTrigger id="sort-direction">
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {filteredBiomarkers.length} of {biomarkers.length} biomarkers
          {keyMetricsOnly && ` (Key Metrics: ${getTotalKeyMetricsCount()})`}
          {activeOnly && ` (Active: ${getTotalActiveCount()})`}
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Biomarker List</CardTitle>
          <CardDescription>
            Manage your biomarkers and their settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%] cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center">
                    Name
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                  <div className="flex items-center">
                    Category
                    {sortField === 'category' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('inputType')}>
                  <div className="flex items-center">
                    Type
                    {sortField === 'inputType' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('frequency')}>
                  <div className="flex items-center">
                    Frequency
                    {sortField === 'frequency' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBiomarkers.length > 0 ? (
                filteredBiomarkers.map((biomarker) => (
                  <TableRow key={biomarker._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        {biomarker.isKeyMetric && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                        <span>{biomarker.name}</span>
                      </div>
                      {biomarker.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                          {biomarker.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={`border-[${getCategoryColor(biomarker.category)}] text-[${getCategoryColor(biomarker.category)}]`}
                      >
                        {biomarker.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getInputTypeLabel(biomarker.inputType)}
                      {biomarker.unit && <span className="text-xs text-muted-foreground ml-1">({biomarker.unit})</span>}
                    </TableCell>
                    <TableCell>
                      {getFrequencyLabel(biomarker.frequency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {getTargetDirectionIcon(biomarker.targetDirection)}
                        {biomarker.inputType === 'numeric' && biomarker.targetValue != null && (
                          <span>{biomarker.targetValue}{biomarker.unit}</span>
                        )}
                        {biomarker.inputType === 'scale' && biomarker.targetValue != null && (
                          <span>{biomarker.targetValue}/10</span>
                        )}
                        {biomarker.inputType === 'boolean' && (
                          <span>{biomarker.targetDirection === 'increase' ? 'Yes' : 'No'}</span>
                        )}
                        {biomarker.inputType === 'text' && (
                          <span>—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={biomarker.active ? "default" : "secondary"}>
                        {biomarker.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onToggleKeyMetric(biomarker._id, !biomarker.isKeyMetric)}
                              >
                                {biomarker.isKeyMetric ? (
                                  <StarOff className="h-4 w-4 text-yellow-500" />
                                ) : (
                                  <Star className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {biomarker.isKeyMetric ? "Remove from Key Metrics" : "Add to Key Metrics"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onToggleActive(biomarker._id, !biomarker.active)}
                              >
                                {biomarker.active ? (
                                  <AlertCircle className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {biomarker.active ? "Deactivate" : "Activate"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(biomarker)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Edit
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No biomarkers found matching your criteria.
                    {(searchTerm || selectedCategories.length > 0 || selectedInputTypes.length > 0 || 
                      selectedFrequencies.length > 0 || keyMetricsOnly) && (
                      <div className="mt-2">
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-medium">Biomarkers by Category</h3>
        {Object.keys(biomarkersByCategory).length > 0 ? (
          Object.entries(biomarkersByCategory)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, biomarkers]) => (
              <Collapsible
                key={category}
                open={expandedCategory === category}
                onOpenChange={() => setExpandedCategory(expandedCategory === category ? null : category)}
                className="border rounded-lg"
              >
                <CollapsibleTrigger asChild>
                  <div 
                    className={`border-l-4 border-[${getCategoryColor(category)}] px-4 py-2 rounded-md`}
                    style={{ borderLeft: `4px solid ${getCategoryColor(category)}` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base font-medium">{category}</h4>
                        <Badge variant="outline">{biomarkers.length}</Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        {expandedCategory === category ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 pt-0 space-y-2">
                    {biomarkers
                      .filter(b => activeOnly ? b.active : true)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((biomarker) => (
                        <div 
                          key={biomarker._id} 
                          className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50"
                        >
                          <div className="flex items-center space-x-2">
                            {biomarker.isKeyMetric && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                            <span>{biomarker.name}</span>
                            {!biomarker.active && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(biomarker)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
        ) : (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              No biomarkers defined yet. Add some biomarkers to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
