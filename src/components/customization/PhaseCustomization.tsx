'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CalendarIcon, ExternalLink, RefreshCw, Save } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { toast } from '@/components/ui/use-toast'
import styles from './PhaseCustomization.module.css'

// Schema for phase validation
const phaseSchema = z.object({
  name: z.string().min(2, { message: "Phase name must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  affirmation: z.string().optional(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, { 
    message: "Color must be a valid hex code" 
  }),
  durationDays: z.number().int().min(1, { message: "Duration must be at least 1 day" }),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

type PhaseFormValues = z.infer<typeof phaseSchema>;

interface Phase {
  _id: string;
  name: string;
  description: string;
  affirmation?: string;
  color: string;
  order: number;
  durationDays: number;
  startDate?: Date;
  endDate?: Date;
}

export function PhaseCustomization() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [originalPhases, setOriginalPhases] = useState<Phase[]>([]);
  const [programStartDate, setProgramStartDate] = useState<Date | undefined>(
    new Date()
  );
  
  // Set up form with validation
  const { 
    register, 
    handleSubmit, 
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty } 
  } = useForm<PhaseFormValues>({
    resolver: zodResolver(phaseSchema),
    defaultValues: {
      name: '',
      description: '',
      affirmation: '',
      color: '#4ade80',
      durationDays: 30,
    }
  });
  
  const watchDurationDays = watch('durationDays');
  const watchStartDate = watch('startDate');
  
  // Load initial phases
  useEffect(() => {
    const fetchPhases = async () => {
      try {
        // In a real app, this would be an API call
        // For now, populate with sample data
        const phasesData = [
          { 
            _id: 'phase1', 
            name: 'Terrain Clearing', 
            description: 'Focus on clearing toxins and preparing the body for regeneration.',
            affirmation: 'I am cleansing my body of toxins and creating a clean foundation for healing.',
            color: '#4ade80', 
            order: 1,
            durationDays: 30,
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
          },
          { 
            _id: 'phase2', 
            name: 'Mitochondrial Rebuild', 
            description: 'Rejuvenate cellular energy production and enhance mitochondrial function.',
            affirmation: 'My cells are vibrant with energy and my mitochondria are functioning optimally.',
            color: '#60a5fa', 
            order: 2,
            durationDays: 45,
            startDate: new Date(new Date().setDate(new Date().getDate() + 31)),
            endDate: new Date(new Date().setDate(new Date().getDate() + 75)),
          },
          { 
            _id: 'phase3', 
            name: 'Heavy Metal Liberation', 
            description: 'Safely remove toxic metals and support detoxification pathways.',
            affirmation: 'I am releasing stored toxins and my body is becoming pure and clean.',
            color: '#f97316', 
            order: 3,
            durationDays: 30,
            startDate: new Date(new Date().setDate(new Date().getDate() + 76)),
            endDate: new Date(new Date().setDate(new Date().getDate() + 105)),
          },
          { 
            _id: 'phase4', 
            name: 'Biofield Expansion', 
            description: 'Enhance the body\'s electromagnetic field and optimize cellular communication.',
            affirmation: 'My biofield is expanding, connecting me to universal healing energies.',
            color: '#8b5cf6', 
            order: 4,
            durationDays: 30,
            startDate: new Date(new Date().setDate(new Date().getDate() + 106)),
            endDate: new Date(new Date().setDate(new Date().getDate() + 135)),
          }
        ];
        
        setPhases(phasesData);
        setOriginalPhases([...phasesData]);
        setProgramStartDate(phasesData[0]?.startDate);
      } catch (error) {
        console.error('Error fetching phases:', error);
        toast({
          title: 'Error',
          description: 'Failed to load phases',
          variant: 'destructive'
        });
      }
    };

    fetchPhases();
  }, []);

  // Color mapping utility (maps specific hex values to predefined class names)
  const getColorClass = (color: string): string => {
    // Convert color to lowercase for consistent matching
    const lowerColor = color.toLowerCase();
    
    // Standard color mappings
    const colorMap: Record<string, string> = {
      // Medical blue palette
      '#dbeafe': styles.medicalBlue100,
      '#bfdbfe': styles.medicalBlue200,
      '#93c5fd': styles.medicalBlue300,
      '#60a5fa': styles.medicalBlue400,
      '#3b82f6': styles.medicalBlue500,
      '#2563eb': styles.medicalBlue600,
      '#1d4ed8': styles.medicalBlue700,
      '#1e40af': styles.medicalBlue800,
      '#1e3a8a': styles.medicalBlue900,

      // Medical green palette
      '#d1fae5': styles.medicalGreen100,
      '#a7f3d0': styles.medicalGreen200,
      '#6ee7b7': styles.medicalGreen300,
      '#34d399': styles.medicalGreen400,
      '#10b981': styles.medicalGreen500,
      '#059669': styles.medicalGreen600,
      '#047857': styles.medicalGreen700,
      '#065f46': styles.medicalGreen800,
      '#064e3b': styles.medicalGreen900,

      // Common colors
      '#ef4444': styles.colorRed,
      '#f97316': styles.colorOrange,
      '#f59e0b': styles.colorYellow,
      '#8b5cf6': styles.colorPurple,
      '#14b8a6': styles.colorTeal,
      '#6b7280': styles.colorGray,
    };

    // Check if color is in our map
    if (colorMap[lowerColor]) {
      return colorMap[lowerColor];
    }

    // Default phase colors if color matches a phase color
    if (lowerColor === '#1d4ed8') return styles.phase1;
    if (lowerColor === '#059669') return styles.phase2;
    if (lowerColor === '#0d9488') return styles.phase3;
    if (lowerColor === '#3b82f6') return styles.phase4;

    // For any color not in our map, apply a phase class based on phase order if available
    const phaseOrder = 1; // Default to phase1 styling
    return styles[`phase${phaseOrder}`];
  };

  // Get phase color class based on phase order
  const getPhaseColorClass = (phase: Phase): string => {
    // If the phase has a defined color, use that with our color map
    if (phase.color) {
      return getColorClass(phase.color);
    }
    
    // Otherwise fall back to the phase order
    return styles[`phase${phase.order}`];
  };

  // Function to combine multiple class names
  const classNames = (...classes: string[]): string => {
    return classes.filter(Boolean).join(' ');
  };

  // Handle editing a phase
  const handleEditPhase = (phase: Phase) => {
    setEditingPhase(phase);
    setExpandedPhase(phase._id);
    
    // Set form values
    setValue('name', phase.name);
    setValue('description', phase.description);
    setValue('affirmation', phase.affirmation || '');
    setValue('color', phase.color);
    setValue('durationDays', phase.durationDays);
    setValue('startDate', phase.startDate);
    setValue('endDate', phase.endDate);
  };

  // Handle form submission
  const onSubmit = async (data: PhaseFormValues) => {
    if (!editingPhase) return;
    
    try {
      // In a real app, this would be an API call to update the phase
      const updatedPhases = phases.map(phase => 
        phase._id === editingPhase._id
          ? { 
              ...phase, 
              name: data.name,
              description: data.description,
              affirmation: data.affirmation,
              color: data.color,
              durationDays: data.durationDays,
              startDate: data.startDate,
              endDate: data.endDate,
            }
          : phase
      );
      
      setPhases(updatedPhases);
      toast({
        title: 'Success',
        description: `Phase "${data.name}" has been updated`,
        variant: 'default'
      });
      
      // Update dates for all phases if the phase dates changed
      if (editingPhase.order === 1 && data.startDate) {
        recalculateAllPhaseDates(updatedPhases, data.startDate);
      } else {
        recalculateSubsequentPhaseDates(updatedPhases, editingPhase.order);
      }
      
      // Reset form
      setEditingPhase(null);
    } catch (error) {
      console.error('Error updating phase:', error);
      toast({
        title: 'Error',
        description: 'Failed to update phase',
        variant: 'destructive'
      });
    }
  };

  // Recalculate dates for all phases
  const recalculateAllPhaseDates = (phaseList: Phase[], startDate: Date) => {
    const updatedPhases = [...phaseList];
    let currentDate = new Date(startDate);
    
    updatedPhases.sort((a, b) => a.order - b.order).forEach(phase => {
      phase.startDate = new Date(currentDate);
      phase.endDate = new Date(currentDate);
      phase.endDate.setDate(currentDate.getDate() + phase.durationDays - 1);
      
      // Next phase starts the day after this one ends
      currentDate = new Date(phase.endDate);
      currentDate.setDate(currentDate.getDate() + 1);
    });
    
    setPhases([...updatedPhases]);
    setProgramStartDate(startDate);
  };

  // Recalculate dates for subsequent phases
  const recalculateSubsequentPhaseDates = (phaseList: Phase[], startOrder: number) => {
    const updatedPhases = [...phaseList];
    const sortedPhases = updatedPhases.sort((a, b) => a.order - b.order);
    
    // Find the end date of the current phase
    const currentPhase = sortedPhases.find(phase => phase.order === startOrder);
    if (!currentPhase || !currentPhase.endDate) return;
    
    let nextStartDate = new Date(currentPhase.endDate);
    nextStartDate.setDate(nextStartDate.getDate() + 1);
    
    // Update all subsequent phases
    sortedPhases
      .filter(phase => phase.order > startOrder)
      .forEach(phase => {
        phase.startDate = new Date(nextStartDate);
        phase.endDate = new Date(nextStartDate);
        phase.endDate.setDate(nextStartDate.getDate() + phase.durationDays - 1);
        
        // Next phase starts the day after this one ends
        nextStartDate = new Date(phase.endDate);
        nextStartDate.setDate(nextStartDate.getDate() + 1);
      });
    
    setPhases([...updatedPhases]);
  };

  // Reset all phases to default
  const handleResetToDefault = () => {
    setPhases([...originalPhases]);
    setEditingPhase(null);
    toast({
      title: 'Reset Complete',
      description: 'All phases have been reset to their original values',
      variant: 'default'
    });
  };

  // Update program start date and recalculate all phase dates
  const handleUpdateProgramStartDate = (date: Date) => {
    recalculateAllPhaseDates(phases, date);
    toast({
      title: 'Dates Updated',
      description: 'Program start date and all phase dates have been recalculated',
      variant: 'default'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Phase Customization</h2>
        <Button variant="outline" onClick={handleResetToDefault}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset to Default
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Program Timeline</CardTitle>
          <CardDescription>
            Set your program start date to automatically calculate phase durations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="program-start-date">Program Start Date</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="program-start-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal md:col-span-2",
                        !programStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {programStartDate ? format(programStartDate, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={programStartDate}
                      onSelect={(date) => date && setProgramStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Button 
                  onClick={() => programStartDate && handleUpdateProgramStartDate(programStartDate)}
                  disabled={!programStartDate}
                  className="md:col-span-2"
                >
                  Recalculate All Phase Dates
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This will adjust all phase dates based on your selected start date
              </p>
            </div>
            
            <div className="border rounded-md p-4">
              <div className="relative">
                {/* Timeline track */}
                <div className="absolute left-6 top-0 h-full w-0.5 bg-slate-200"></div>
                
                {/* Timeline events */}
                <div className="space-y-8">
                  {phases
                    .sort((a, b) => a.order - b.order)
                    .map((phase, index) => (
                      <div key={phase._id} className="relative flex items-start">
                        <div className={classNames(styles.phaseCircle, getPhaseColorClass(phase))}>
                          <span className="font-bold">{phase.order}</span>
                        </div>
                        <div className="ml-4 mt-1">
                          <Badge className={classNames(styles.phaseBadge, getPhaseColorClass(phase))}>
                            {phase.durationDays} Days
                          </Badge>
                          <h3 className="text-lg font-semibold">{phase.name}</h3>
                          <div className="text-sm text-muted-foreground">
                            {phase.startDate && phase.endDate && (
                              <>
                                {format(phase.startDate, "MMM d, yyyy")} - {format(phase.endDate, "MMM d, yyyy")}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Accordion
        type="single"
        collapsible
        value={expandedPhase || undefined}
        onValueChange={(value: string | null) => setExpandedPhase(value)}
      >
        {phases
          .sort((a, b) => a.order - b.order)
          .map((phase) => (
            <AccordionItem key={phase._id} value={phase._id}>
              <AccordionTrigger>
                <div className="flex items-center">
                  <div className={classNames(styles.phaseIndicator, getPhaseColorClass(phase))}></div>
                  <span>Phase {phase.order}: {phase.name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {editingPhase && editingPhase._id === phase._id ? (
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">
                              Phase Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="name"
                              {...register('name')}
                            />
                            {errors.name && (
                              <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="color">
                              Phase Color <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex space-x-2">
                              <Controller
                                name="color"
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    id="color"
                                    type="color"
                                    className="w-12 h-10 p-1"
                                    {...field}
                                  />
                                )}
                              />
                              <Input
                                {...register('color')}
                                placeholder="#000000"
                                className="flex-1"
                              />
                            </div>
                            {errors.color && (
                              <p className="text-sm text-red-500">{errors.color.message}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">
                            Description <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="description"
                            {...register('description')}
                            rows={3}
                          />
                          {errors.description && (
                            <p className="text-sm text-red-500">{errors.description.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="affirmation">Daily Affirmation</Label>
                          <Textarea
                            id="affirmation"
                            {...register('affirmation')}
                            rows={2}
                            placeholder="Optional daily affirmation for this phase"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="durationDays">
                              Duration (Days) <span className="text-red-500">*</span>
                            </Label>
                            <span className="text-sm">{watchDurationDays} days</span>
                          </div>
                          <Controller
                            name="durationDays"
                            control={control}
                            render={({ field }) => (
                              <Slider
                                id="durationDays"
                                min={1}
                                max={90}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                            )}
                          />
                          {errors.durationDays && (
                            <p className="text-sm text-red-500">{errors.durationDays.message}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Controller
                              name="startDate"
                              control={control}
                              render={({ field }) => (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      id="startDate"
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? format(field.value, "PPP") : "Select a date"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              )}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Controller
                              name="endDate"
                              control={control}
                              render={({ field }) => (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      id="endDate"
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? format(field.value, "PPP") : "Select a date"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => {
                                        // Disable dates before start date
                                        return watchStartDate ? date < watchStartDate : false;
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              )}
                            />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingPhase(null);
                            reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </CardFooter>
                    </Card>
                  </form>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Name</h4>
                            <p>{phase.name}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Color</h4>
                            <div className="flex items-center space-x-2">
                              <div className={classNames(styles.colorPreview, getPhaseColorClass(phase))}></div>
                              <code className="text-xs bg-muted p-1 rounded">{phase.color}</code>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1">Description</h4>
                          <p className="text-sm">{phase.description}</p>
                        </div>
                        
                        {phase.affirmation && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Daily Affirmation</h4>
                            <p className="text-sm italic">"{phase.affirmation}"</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Duration</h4>
                            <p>{phase.durationDays} days</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Start Date</h4>
                            <p>{phase.startDate ? format(phase.startDate, "MMM d, yyyy") : "Not set"}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">End Date</h4>
                            <p>{phase.endDate ? format(phase.endDate, "MMM d, yyyy") : "Not set"}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={() => handleEditPhase(phase)}>
                        Edit Phase
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>
      
      <TooltipProvider>
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              Need Help?
              <Tooltip>
                <TooltipTrigger asChild>
                  <ExternalLink className="ml-2 h-4 w-4 text-muted-foreground cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  View detailed documentation
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Each phase represents a distinct period in your bioelectric regeneration program.
              Customize the names, descriptions, and durations to match your specific health journey.
              The timeline will automatically adjust to your changes.
            </p>
          </CardContent>
        </Card>
      </TooltipProvider>
    </div>
  )
}
