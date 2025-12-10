'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Upload, Download, LayoutGrid, RefreshCw } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { BiomarkerForm } from './biomarker/BiomarkerForm'
import { BiomarkerList } from './biomarker/BiomarkerList'
import { BiomarkerGroupsManager } from './biomarker/BiomarkerGroupsManager'
import { BiomarkerTemplates } from './biomarker/BiomarkerTemplates'
import { ImportExportModal } from './ImportExportModal'

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

export function BiomarkerConfiguration() {
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([])
  const [categories, setCategories] = useState<BiomarkerCategory[]>([])
  const [selectedBiomarker, setSelectedBiomarker] = useState<Biomarker | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('list')
  const [isImportExportOpen, setIsImportExportOpen] = useState(false)
  const [phases, setPhases] = useState<{ _id: string, name: string, order: number }[]>([])

  // Fetch biomarkers, categories, and phases when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, these would be API calls
        // Example placeholder data
        const biomarkersData: Biomarker[] = [
          {
            _id: '1',
            name: 'ALT (Alanine Aminotransferase)',
            description: 'Liver enzyme that indicates liver health and detoxification capacity',
            unit: 'U/L',
            category: 'Liver Function',
            inputType: 'numeric',
            minValue: 0,
            maxValue: 50,
            targetValue: 25,
            targetDirection: 'decrease',
            frequency: 'monthly',
            phases: ['phase1', 'phase3'],
            isKeyMetric: true,
            visualType: 'line',
            active: true,
            precision: 1,
            tags: ['liver', 'detox', 'enzyme'],
            correlationEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: '2',
            name: 'Energy Level',
            description: 'Subjective rating of overall energy throughout the day',
            category: 'Energy Metrics',
            inputType: 'scale',
            minValue: 1,
            maxValue: 10,
            targetValue: 8,
            targetDirection: 'increase',
            scaleOptions: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
            frequency: 'daily',
            phases: ['phase1', 'phase2', 'phase3', 'phase4'],
            isKeyMetric: true,
            visualType: 'line',
            active: true,
            customLabels: {
              minLabel: 'Exhausted',
              maxLabel: 'Vibrant'
            },
            tags: ['energy', 'subjective', 'daily'],
            correlationEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: '3',
            name: 'Detox Symptoms',
            description: 'Presence of detoxification reactions or Herxheimer responses',
            category: 'Detoxification',
            inputType: 'boolean',
            targetDirection: 'decrease',
            frequency: 'daily',
            phases: ['phase1', 'phase3'],
            isKeyMetric: false,
            visualType: 'bar',
            active: true,
            customLabels: {
              trueLabel: 'Present',
              falseLabel: 'Absent'
            },
            tags: ['detox', 'symptoms', 'herx'],
            correlationEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: '4',
            name: 'Notes',
            description: 'Free-form observations about health status and treatment responses',
            category: 'Journal',
            inputType: 'text',
            targetDirection: 'maintain',
            frequency: 'daily',
            phases: ['phase1', 'phase2', 'phase3', 'phase4'],
            isKeyMetric: false,
            visualType: 'line',
            active: true,
            tags: ['journal', 'observations', 'notes'],
            correlationEnabled: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        const categoriesData: BiomarkerCategory[] = [
          { _id: 'cat1', name: 'Liver Function', color: '#0f766e', order: 1, description: 'Markers related to liver health and detoxification' },
          { _id: 'cat2', name: 'Energy Metrics', color: '#2563eb', order: 2, description: 'Subjective and objective energy measurements' },
          { _id: 'cat3', name: 'Detoxification', color: '#7c3aed', order: 3, description: 'Detoxification reactions and clearance symptoms' },
          { _id: 'cat4', name: 'Journal', color: '#4f46e5', order: 4, description: 'Text notes and observations' }
        ];
        
        const phasesData = [
          { _id: 'phase1', name: 'Terrain Clearing', order: 1 },
          { _id: 'phase2', name: 'Mitochondrial Rebuild', order: 2 },
          { _id: 'phase3', name: 'Heavy Metal Liberation', order: 3 },
          { _id: 'phase4', name: 'Biofield Expansion', order: 4 }
        ];
        
        setBiomarkers(biomarkersData);
        setCategories(categoriesData);
        setPhases(phasesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load biomarkers and categories',
          variant: 'destructive'
        });
      }
    };

    fetchData();
  }, []);

  const handleAddBiomarker = () => {
    setSelectedBiomarker(null);
    setIsFormOpen(true);
    setActiveTab('form');
  };

  const handleEditBiomarker = (biomarker: Biomarker) => {
    setSelectedBiomarker(biomarker);
    setIsFormOpen(true);
    setActiveTab('form');
  };

  const handleSaveBiomarker = (biomarker: Partial<Biomarker>) => {
    try {
      if (selectedBiomarker) {
        // Update existing biomarker
        const updatedBiomarkers = biomarkers.map(b => 
          b._id === selectedBiomarker._id ? { ...b, ...biomarker, updatedAt: new Date() } as Biomarker : b
        );
        setBiomarkers(updatedBiomarkers);
        
        toast({
          title: 'Success',
          description: `${biomarker.name} has been updated`,
          variant: 'default'
        });
      } else {
        // Create new biomarker
        const newBiomarker = {
          _id: Date.now().toString(), // Placeholder ID
          ...biomarker,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Biomarker;
        
        setBiomarkers([...biomarkers, newBiomarker]);
        
        toast({
          title: 'Success',
          description: `${biomarker.name} has been added`,
          variant: 'default'
        });
      }
      
      setIsFormOpen(false);
      setSelectedBiomarker(null);
      setActiveTab('list');
    } catch (error) {
      console.error('Error saving biomarker:', error);
      toast({
        title: 'Error',
        description: 'Failed to save biomarker',
        variant: 'destructive'
      });
    }
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setSelectedBiomarker(null);
    setActiveTab('list');
  };

  const handleToggleActive = async (biomarkerId: string, isActive: boolean) => {
    try {
      const updatedBiomarkers = biomarkers.map(biomarker =>
        biomarker._id === biomarkerId
          ? { ...biomarker, active: isActive, updatedAt: new Date() }
          : biomarker
      );
      
      setBiomarkers(updatedBiomarkers);
      
      toast({
        title: 'Success',
        description: `Biomarker ${isActive ? 'activated' : 'deactivated'}`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error toggling biomarker active state:', error);
      toast({
        title: 'Error',
        description: 'Failed to update biomarker',
        variant: 'destructive'
      });
    }
  };

  const handleToggleKeyMetric = async (biomarkerId: string, isKeyMetric: boolean) => {
    try {
      const updatedBiomarkers = biomarkers.map(biomarker =>
        biomarker._id === biomarkerId
          ? { ...biomarker, isKeyMetric, updatedAt: new Date() }
          : biomarker
      );
      
      setBiomarkers(updatedBiomarkers);
      
      toast({
        title: 'Success',
        description: `Biomarker ${isKeyMetric ? 'marked as' : 'removed from'} key metrics`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error setting key metric status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update biomarker',
        variant: 'destructive'
      });
    }
  };

  const handleCategoryUpdate = (updatedCategories: BiomarkerCategory[]) => {
    setCategories(updatedCategories);
    
    toast({
      title: 'Categories Updated',
      description: 'Biomarker categories have been updated',
      variant: 'default'
    });
  };

  const handleImportBiomarkers = (importedBiomarkers: any[]) => {
    try {
      // Process imported biomarkers, perform validation, etc.
      const newBiomarkers = importedBiomarkers.map(biomarker => ({
        ...biomarker,
        _id: biomarker._id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true
      })) as Biomarker[];
      
      setBiomarkers([...biomarkers, ...newBiomarkers]);
      
      toast({
        title: 'Import Successful',
        description: `${newBiomarkers.length} biomarkers imported`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error importing biomarkers:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import biomarkers',
        variant: 'destructive'
      });
    }
  };

  const handleReorderBiomarkers = (reorderedBiomarkers: Biomarker[]) => {
    setBiomarkers(reorderedBiomarkers);
    
    toast({
      title: 'Biomarkers Reordered',
      description: 'The order of biomarkers has been updated',
      variant: 'default'
    });
  };
  
  const handleApplyTemplate = (templateBiomarkers: Partial<Biomarker>[]) => {
    try {
      const newBiomarkers = templateBiomarkers.map(biomarker => ({
        ...biomarker,
        _id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true
      })) as Biomarker[];
      
      setBiomarkers([...biomarkers, ...newBiomarkers]);
      
      toast({
        title: 'Template Applied',
        description: `${newBiomarkers.length} biomarkers added from template`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error applying template:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply template',
        variant: 'destructive'
      });
    }
  };

  const handleResetToDefaults = () => {
    // In a real app, this would reset to system defaults
    toast({
      title: 'Reset to Defaults',
      description: 'All biomarker settings have been reset to default values',
      variant: 'default'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Biomarker Configuration</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsImportExportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import/Export
          </Button>
          <Button onClick={handleAddBiomarker}>
            <Plus className="mr-2 h-4 w-4" />
            Add Biomarker
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Biomarker List</TabsTrigger>
          <TabsTrigger value="groups">Organize Groups</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          {isFormOpen && <TabsTrigger value="form">
            {selectedBiomarker ? 'Edit Biomarker' : 'New Biomarker'}
          </TabsTrigger>}
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <BiomarkerList 
            biomarkers={biomarkers}
            categories={categories}
            onEdit={handleEditBiomarker}
            onToggleActive={handleToggleActive}
            onToggleKeyMetric={handleToggleKeyMetric}
            onReorder={handleReorderBiomarkers}
          />
        </TabsContent>
        
        <TabsContent value="groups" className="space-y-4">
          <BiomarkerGroupsManager 
            categories={categories}
            biomarkers={biomarkers}
            onUpdateCategories={handleCategoryUpdate}
            onUpdateBiomarkers={setBiomarkers}
          />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <BiomarkerTemplates onApplyTemplate={handleApplyTemplate} />
        </TabsContent>
        
        {isFormOpen && (
          <TabsContent value="form" className="space-y-4">
            <BiomarkerForm 
              biomarker={selectedBiomarker}
              categories={categories}
              phases={phases} 
              onSave={handleSaveBiomarker}
              onCancel={handleCancelForm}
            />
          </TabsContent>
        )}
      </Tabs>
      
      <Card className="bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('groups')}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              Organize Groups
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <ImportExportModal 
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onImport={handleImportBiomarkers}
        exportData={biomarkers}
        type="biomarkers"
      />
    </div>
  )
}
