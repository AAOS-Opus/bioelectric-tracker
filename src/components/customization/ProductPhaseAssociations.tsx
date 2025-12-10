'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'

// Schema for phase association validation
const phaseAssociationSchema = z.object({
  phaseAssociations: z.array(
    z.object({
      phaseId: z.string(),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
      notes: z.string().optional(),
    })
  )
});

type PhaseAssociationFormValues = z.infer<typeof phaseAssociationSchema>;

interface Phase {
  _id: string;
  name: string;
  order: number;
  color?: string;
}

interface ProductPhaseAssociation {
  phaseId: string;
  dosage?: string;
  frequency?: string;
  notes?: string;
}

interface ProductPhaseAssociationsProps {
  productId: string;
  productName: string;
  defaultDosage?: string;
  defaultFrequency?: string;
  defaultUnit?: string;
  phases: Phase[];
  initialAssociations?: ProductPhaseAssociation[];
  onSave: (productId: string, associations: ProductPhaseAssociation[]) => void;
}

export function ProductPhaseAssociations({
  productId,
  productName,
  defaultDosage,
  defaultFrequency,
  defaultUnit,
  phases,
  initialAssociations = [],
  onSave
}: ProductPhaseAssociationsProps) {
  
  // Create default associations for all phases if none exist
  const getDefaultAssociations = () => {
    // If we have initial associations, use them
    if (initialAssociations.length > 0) {
      return {
        phaseAssociations: phases.map(phase => {
          const existing = initialAssociations.find(assoc => assoc.phaseId === phase._id);
          return {
            phaseId: phase._id,
            dosage: existing?.dosage || defaultDosage || '',
            frequency: existing?.frequency || defaultFrequency || '',
            notes: existing?.notes || ''
          };
        })
      };
    }
    
    // Otherwise create default associations for all phases
    return {
      phaseAssociations: phases.map(phase => ({
        phaseId: phase._id,
        dosage: defaultDosage || '',
        frequency: defaultFrequency || '',
        notes: ''
      }))
    };
  };

  const { 
    control, 
    handleSubmit, 
    formState: { errors, isDirty },
    reset
  } = useForm<PhaseAssociationFormValues>({
    resolver: zodResolver(phaseAssociationSchema),
    defaultValues: getDefaultAssociations()
  });

  // Reset form when initial associations change
  useEffect(() => {
    reset(getDefaultAssociations());
  }, [initialAssociations, phases, defaultDosage, defaultFrequency]);

  const { fields } = useFieldArray({
    name: "phaseAssociations",
    control
  });

  const onSubmit = (data: PhaseAssociationFormValues) => {
    try {
      onSave(productId, data.phaseAssociations);
      
      toast({
        title: 'Phase settings saved',
        description: `Phase settings for ${productName} have been updated.`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error saving phase associations:', error);
      toast({
        title: 'Error',
        description: 'Failed to save phase settings',
        variant: 'destructive'
      });
    }
  };

  const getPhaseById = (phaseId: string) => {
    return phases.find(phase => phase._id === phaseId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        Phase-specific settings for <span className="font-semibold">{productName}</span>
      </h3>
      
      <p className="text-sm text-muted-foreground">
        Customize how this product should be used during each phase of the regeneration program.
        Leave fields empty to use the default product settings.
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Accordion type="single" collapsible className="w-full">
          {fields.map((field, index) => {
            const phase = getPhaseById(field.phaseId);
            if (!phase) return null;
            
            return (
              <AccordionItem key={field.id} value={field.phaseId}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      style={{ backgroundColor: phase.color }} 
                      className="text-white"
                    >
                      Phase {phase.order}
                    </Badge>
                    <span>{phase.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`dosage-${index}`}>
                              Dosage for {phase.name}
                            </Label>
                            <div className="flex space-x-2">
                              <Controller
                                name={`phaseAssociations.${index}.dosage`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    id={`dosage-${index}`}
                                    {...field}
                                    placeholder={defaultDosage || "Dosage"}
                                  />
                                )}
                              />
                              {defaultUnit && (
                                <span className="flex items-center text-sm text-muted-foreground px-3 border rounded-md">
                                  {defaultUnit}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Leave empty to use default product dosage
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`frequency-${index}`}>
                              Frequency for {phase.name}
                            </Label>
                            <Controller
                              name={`phaseAssociations.${index}.frequency`}
                              control={control}
                              render={({ field }) => (
                                <Input
                                  id={`frequency-${index}`}
                                  {...field}
                                  placeholder={defaultFrequency || "e.g., Twice daily"}
                                />
                              )}
                            />
                            <p className="text-xs text-muted-foreground">
                              Leave empty to use default product frequency
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`notes-${index}`}>
                            Phase-specific Notes
                          </Label>
                          <Controller
                            name={`phaseAssociations.${index}.notes`}
                            control={control}
                            render={({ field }) => (
                              <Textarea
                                id={`notes-${index}`}
                                {...field}
                                placeholder="Special instructions for this phase"
                                rows={2}
                              />
                            )}
                          />
                          <p className="text-xs text-muted-foreground">
                            Any special considerations for using this product during {phase.name}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        
        <div className="mt-4 flex justify-end">
          <Button 
            type="submit"
            disabled={!isDirty}
          >
            Save Phase Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
