'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import styles from './WizardSteps.module.css'

interface Phase {
  id: string;
  name: string;
  durationDays: number;
  startDate?: Date;
  endDate?: Date;
  color: string;
}

interface PhaseSetupStepProps {
  phases: Phase[];
  programStartDate: Date;
  onUpdatePhases: (phases: Phase[]) => void;
  onUpdateStartDate: (date: Date) => void;
}

const getPhaseWidthClass = (durationDays: number) => {
  if (durationDays < 30) return styles.phaseProgressBarWidthSmall;
  if (durationDays < 60) return styles.phaseProgressBarWidthMedium;
  return styles.phaseProgressBarWidthLarge;
}

const getPhaseColorClass = (color: string) => {
  return `${styles.phaseProgressBarColor}-${color}`;
}

export default function PhaseSetupStep({
  phases,
  programStartDate,
  onUpdatePhases,
  onUpdateStartDate
}: PhaseSetupStepProps) {
  // Update phase duration
  const handlePhaseDurationChange = (phaseId: string, days: number) => {
    const updatedPhases = phases.map(phase => 
      phase.id === phaseId 
        ? { ...phase, durationDays: days } 
        : phase
    )
    
    // Recalculate dates based on new durations
    calculatePhaseDates(updatedPhases, programStartDate)
    onUpdatePhases(updatedPhases)
  }

  // Update program start date and recalculate all phase dates
  const handleStartDateChange = (date: Date) => {
    onUpdateStartDate(date)
    calculatePhaseDates(phases, date)
  }

  // Calculate phase dates based on program start date and durations
  const calculatePhaseDates = (phasesToUpdate: Phase[], startDate: Date) => {
    let currentDate = new Date(startDate)
    
    const updatedPhases = phasesToUpdate.map(phase => {
      const phaseStartDate = new Date(currentDate)
      const phaseEndDate = new Date(currentDate)
      phaseEndDate.setDate(phaseEndDate.getDate() + phase.durationDays - 1)
      
      // Update current date for next phase
      currentDate = new Date(phaseEndDate)
      currentDate.setDate(currentDate.getDate() + 1)
      
      return {
        ...phase,
        startDate: phaseStartDate,
        endDate: phaseEndDate
      }
    })
    
    onUpdatePhases(updatedPhases)
  }

  return (
    <div className={styles.container}>
      <div className={styles.timelineSetup}>
        <h2 className={styles.timelineSetupTitle}>Program Timeline Setup</h2>
        <p className={styles.timelineSetupDescription}>
          Your Bioelectric Regeneration journey consists of four carefully designed phases. 
          Let's set up the timeline for your program.
        </p>
      </div>

      <div className={styles.programStartDate}>
        <div className={styles.programStartDateLabel}>
          <Label htmlFor="program-start" className={styles.programStartDateLabelText}>
            When would you like to start your program?
          </Label>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                styles.programStartDateButton,
                !programStartDate && styles.programStartDateButtonDisabled
              )}
            >
              <CalendarIcon className={styles.programStartDateButtonIcon} />
              {programStartDate ? format(programStartDate, "PPP") : "Select a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className={styles.programStartDatePopover}>
            <Calendar
              mode="single"
              selected={programStartDate}
              onSelect={(date) => date && handleStartDateChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className={styles.phaseDurations}>
        <h3 className={styles.phaseDurationsTitle}>Phase Duration</h3>
        <p className={styles.phaseDurationsDescription}>
          Below are the recommended durations for each phase. You can adjust these based on your 
          personal needs or practitioner recommendations.
        </p>
        
        <div className={styles.phaseDurationsGrid}>
          {phases.map((phase, index) => (
            <Card key={phase.id} className={styles.phaseCard}>
              <CardContent className={styles.phaseCardContent}>
                <div className={styles.phaseGrid}>
                  <div>
                    <h4 className={styles.phaseTitle}>
                      Phase {index + 1}: {phase.name}
                    </h4>
                    <div className={styles.phaseProgress}>
                      <div 
                        className={cn(
                          styles.phaseProgressBar, 
                          getPhaseWidthClass(phase.durationDays),
                          getPhaseColorClass(phase.color)
                        )}
                      ></div>
                    </div>
                  </div>
                  
                  <div className={styles.phaseDuration}>
                    <Label htmlFor={`duration-${phase.id}`} className={styles.phaseDurationLabel}>
                      Duration (days)
                    </Label>
                    <Input
                      id={`duration-${phase.id}`}
                      type="number"
                      min="7"
                      max="180"
                      value={phase.durationDays}
                      onChange={(e) => handlePhaseDurationChange(phase.id, parseInt(e.target.value) || 30)}
                      className={styles.phaseDurationInput}
                    />
                  </div>
                  
                  <div className={styles.phaseDates}>
                    <div>
                      <span className={styles.phaseDateLabel}>Start:</span>{' '}
                      <span className={styles.phaseDateValue}>
                        {phase.startDate ? format(phase.startDate, 'MMM d, yyyy') : 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className={styles.phaseDateLabel}>End:</span>{' '}
                      <span className={styles.phaseDateValue}>
                        {phase.endDate ? format(phase.endDate, 'MMM d, yyyy') : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className={styles.programTimelineBenefits}>
        <h3 className={styles.programTimelineBenefitsTitle}>Program Timeline Benefits</h3>
        <p className={styles.programTimelineBenefitsDescription}>
          Setting up your timeline helps the system generate appropriate reminders, track your progress
          throughout each phase, and provide phase-specific recommendations at the right time.
        </p>
      </div>
    </div>
  )
}
