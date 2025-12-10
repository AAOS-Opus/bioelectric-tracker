'use client';

import { Calendar, Clock, Plus, Settings, RefreshCw, Download, Template } from 'lucide-react';
import { ViewMode } from '../WeeklySchedule';
import { cn } from '@/lib/utils';

interface ScheduleHeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  timeIncrement: 15 | 30 | 60;
  setTimeIncrement: (increment: 15 | 30 | 60) => void;
  onAddSession: () => void;
  onOptimizeSchedule: () => void;
  onManageTemplates: () => void;
  onExportCalendar: () => void;
  optimizationStatus: 'idle' | 'loading' | 'success' | 'error';
}

export default function ScheduleHeader({
  viewMode,
  setViewMode,
  timeIncrement,
  setTimeIncrement,
  onAddSession,
  onOptimizeSchedule,
  onManageTemplates,
  onExportCalendar,
  optimizationStatus
}: ScheduleHeaderProps) {
  return (
    <div className="border-b p-4 px-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center">
          <h3 className="text-xl font-medium mr-4">Weekly Schedule</h3>
          
          <div className="hidden sm:flex space-x-1 bg-gray-100 p-1 rounded-md">
            <button
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                viewMode === 'week' ? "bg-white shadow-sm" : "hover:bg-gray-200"
              )}
              onClick={() => setViewMode('week')}
              aria-label="Switch to week view"
            >
              <Calendar className="w-4 h-4 inline-block mr-1.5" />
              Week
            </button>
            <button
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                viewMode === 'day' ? "bg-white shadow-sm" : "hover:bg-gray-200"
              )}
              onClick={() => setViewMode('day')}
              aria-label="Switch to day view"
            >
              <Clock className="w-4 h-4 inline-block mr-1.5" />
              Day
            </button>
            <button
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                viewMode === 'overview' ? "bg-white shadow-sm" : "hover:bg-gray-200"
              )}
              onClick={() => setViewMode('overview')}
              aria-label="Switch to overview"
            >
              Overview
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center space-x-2">
          <div className="hidden sm:flex space-x-1 mr-2 bg-gray-100 p-1 rounded-md">
            <button
              className={cn(
                "px-2 py-1 rounded text-xs font-medium transition-colors",
                timeIncrement === 15 ? "bg-white shadow-sm" : "hover:bg-gray-200"
              )}
              onClick={() => setTimeIncrement(15)}
              aria-label="Set time increment to 15 minutes"
            >
              15min
            </button>
            <button
              className={cn(
                "px-2 py-1 rounded text-xs font-medium transition-colors",
                timeIncrement === 30 ? "bg-white shadow-sm" : "hover:bg-gray-200"
              )}
              onClick={() => setTimeIncrement(30)}
              aria-label="Set time increment to 30 minutes"
            >
              30min
            </button>
            <button
              className={cn(
                "px-2 py-1 rounded text-xs font-medium transition-colors",
                timeIncrement === 60 ? "bg-white shadow-sm" : "hover:bg-gray-200"
              )}
              onClick={() => setTimeIncrement(60)}
              aria-label="Set time increment to 60 minutes"
            >
              60min
            </button>
          </div>
        
          <button
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            onClick={onAddSession}
            aria-label="Add new session"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Session</span>
          </button>
          
          <button
            className={cn(
              "inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors",
              optimizationStatus === 'loading' 
                ? "bg-yellow-100 text-yellow-800 cursor-wait" 
                : optimizationStatus === 'success'
                ? "bg-green-100 text-green-800"
                : optimizationStatus === 'error'
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
            onClick={onOptimizeSchedule}
            disabled={optimizationStatus === 'loading'}
            aria-label="Optimize schedule"
          >
            <RefreshCw className={cn(
              "w-4 h-4 mr-1.5",
              optimizationStatus === 'loading' ? "animate-spin" : ""
            )} />
            {optimizationStatus === 'loading' 
              ? 'Optimizing...' 
              : optimizationStatus === 'success'
              ? 'Optimized!'
              : optimizationStatus === 'error'
              ? 'Failed'
              : 'Optimize'}
          </button>
          
          <div className="relative group">
            <button
              className="inline-flex items-center px-2 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              aria-label="More actions"
              aria-haspopup="true"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="py-1">
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={onManageTemplates}
                >
                  <Template className="w-4 h-4 mr-2" />
                  Manage Templates
                </button>
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={onExportCalendar}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
