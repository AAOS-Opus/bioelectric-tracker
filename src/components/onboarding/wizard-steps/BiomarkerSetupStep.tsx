'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Plus, Info, AlertCircle, Check } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Biomarker {
  id: string;
  name: string;
  description: string;
  category: string;
  recommendedPhases: number[];
  unit?: string;
  isDefault: boolean;
}

interface BiomarkerSetupStepProps {
  selectedBiomarkers: string[];
  onUpdateBiomarkers: (biomarkers: string[]) => void;
}

export default function BiomarkerSetupStep({
  selectedBiomarkers,
  onUpdateBiomarkers
}: BiomarkerSetupStepProps) {
  const [biomarkers] = useState<Biomarker[]>([
    {
      id: 'energyLevel',
      name: 'Energy Level',
      description: 'Track daily energy levels on a scale of 1-10',
      category: 'Subjective',
      recommendedPhases: [1, 2, 3, 4],
      isDefault: true
    },
    {
      id: 'sleepQuality',
      name: 'Sleep Quality',
      description: 'Record the quality of your sleep each night',
      category: 'Subjective',
      recommendedPhases: [1, 2, 3, 4],
      isDefault: true
    },
    {
      id: 'detoxSymptoms',
      name: 'Detox Symptoms',
      description: 'Track intensity of detox reactions (headache, fatigue, etc.)',
      category: 'Subjective',
      recommendedPhases: [1, 3],
      isDefault: true
    },
    {
      id: 'inflammationLevel',
      name: 'Inflammation Level',
      description: 'Subjective rating of inflammation symptoms',
      category: 'Subjective',
      recommendedPhases: [1, 2, 3],
      isDefault: false
    },
    {
      id: 'cognitiveFocus',
      name: 'Cognitive Focus',
      description: 'Ability to concentrate and maintain mental clarity',
      category: 'Subjective',
      recommendedPhases: [2, 4],
      isDefault: false
    },
    {
      id: 'digestiveFunction',
      name: 'Digestive Function',
      description: 'Track digestive symptoms and bowel movements',
      category: 'Subjective',
      recommendedPhases: [1, 2],
      isDefault: false
    },
    {
      id: 'moodScore',
      name: 'Mood Score',
      description: 'Daily assessment of mood and emotional wellbeing',
      category: 'Subjective',
      recommendedPhases: [1, 2, 3, 4],
      isDefault: false
    },
    {
      id: 'jointPain',
      name: 'Joint Pain',
      description: 'Record joint pain levels throughout healing process',
      category: 'Subjective',
      recommendedPhases: [1, 3],
      isDefault: false
    },
    {
      id: 'waterIntake',
      name: 'Water Intake',
      description: 'Daily water consumption in ounces or liters',
      category: 'Objective',
      unit: 'oz',
      recommendedPhases: [1, 2, 3, 4],
      isDefault: false
    },
    {
      id: 'bodyWeight',
      name: 'Body Weight',
      description: 'Track weight changes during protocol',
      category: 'Objective',
      unit: 'lbs',
      recommendedPhases: [1, 2, 3, 4],
      isDefault: false
    }
  ])

  const handleToggle = (biomarkerId: string) => {
    if (selectedBiomarkers.includes(biomarkerId)) {
      onUpdateBiomarkers(selectedBiomarkers.filter(id => id !== biomarkerId))
    } else {
      onUpdateBiomarkers([...selectedBiomarkers, biomarkerId])
    }
  }

  const handleSelectDefaults = () => {
    const defaultBiomarkers = biomarkers
      .filter(b => b.isDefault)
      .map(b => b.id)
    onUpdateBiomarkers(defaultBiomarkers)
  }

  const categories = ['Subjective', 'Objective']

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-medical-blue-800">Biomarker Setup</h2>
        <p className="text-gray-600">
          Select the biomarkers you'd like to track during your regeneration journey. 
          These will help you monitor your progress and identify patterns.
        </p>
      </div>

      <div className="bg-medical-blue-50 p-4 rounded-lg border border-medical-blue-100">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-medical-blue-500 mt-0.5 mr-3" />
          <div>
            <h3 className="font-medium text-medical-blue-700">Why Track Biomarkers?</h3>
            <p className="text-sm text-medical-blue-600 mt-1">
              Consistently tracking your biomarkers helps identify patterns in your healing journey,
              correlate protocol adherence with outcomes, and provide evidence of progress that might 
              otherwise go unnoticed.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-medical-blue-700">Select Biomarkers to Track</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSelectDefaults}
          >
            Restore Defaults
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          {categories.map(category => (
            <div key={category} className="space-y-3">
              <h4 className="font-medium text-gray-700 border-b pb-2">{category} Measures</h4>
              
              <div className="grid md:grid-cols-2 gap-3">
                {biomarkers
                  .filter(b => b.category === category)
                  .map(biomarker => (
                    <Card 
                      key={biomarker.id} 
                      className={`border transition-all ${
                        selectedBiomarkers.includes(biomarker.id) 
                          ? 'border-medical-green-300 bg-medical-green-50' 
                          : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start">
                          <Checkbox 
                            id={`biomarker-${biomarker.id}`} 
                            checked={selectedBiomarkers.includes(biomarker.id)}
                            onCheckedChange={() => handleToggle(biomarker.id)}
                            className="mt-1 mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Label 
                                  htmlFor={`biomarker-${biomarker.id}`}
                                  className="font-medium text-gray-900 cursor-pointer"
                                >
                                  {biomarker.name}
                                </Label>
                                {biomarker.isDefault && (
                                  <Badge className="ml-2 bg-medical-blue-100 text-medical-blue-700 hover:bg-medical-blue-100">
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <Info className="h-4 w-4 text-gray-400" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{biomarker.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1">{biomarker.description}</p>
                            
                            <div className="flex gap-1 mt-2">
                              {biomarker.recommendedPhases.map(phase => (
                                <Badge 
                                  key={phase} 
                                  variant="outline"
                                  className="text-xs"
                                >
                                  Phase {phase}
                                </Badge>
                              ))}
                              
                              {biomarker.unit && (
                                <Badge 
                                  variant="secondary"
                                  className="text-xs ml-1"
                                >
                                  Unit: {biomarker.unit}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Card className="border-medical-green-200 bg-medical-green-50">
        <CardContent className="p-4">
          <div className="flex items-start">
            <Check className="h-5 w-5 text-medical-green-600 mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-medical-green-800">Selected Biomarkers: {selectedBiomarkers.length}</h3>
              <p className="text-sm text-medical-green-700 mt-1">
                You'll be able to track these biomarkers on your dashboard and see trends over time.
                You can always add or remove biomarkers later in your settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
