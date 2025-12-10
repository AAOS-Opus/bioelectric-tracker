'use client';

import { useState } from 'react';
import { X, Check, Info, Clock, RefreshCw } from 'lucide-react';
import { ModalitySession } from '../WeeklySchedule';
import { getDayName, formatTime } from './utils';

interface OptimizeScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOptimize: () => void;
  sessions: ModalitySession[];
}

export default function OptimizeScheduleModal({
  isOpen,
  onClose,
  onOptimize,
  sessions
}: OptimizeScheduleModalProps) {
  const [optimizationCriteria, setOptimizationCriteria] = useState({
    spacing: true,
    timePreference: 'morning',
    balanceDays: true,
    prioritizeAdherence: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOptimize();
    onClose();
  };

  if (!isOpen) return null;

  // Group sessions by day for the visualization
  const sessionsByDay: Record<number, ModalitySession[]> = {};
  for (let i = 0; i < 7; i++) {
    sessionsByDay[i] = sessions.filter(s => s.day === i);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Optimize Your Schedule
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">About Optimization</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Our AI-powered scheduler will analyze your sessions and preferences to create 
                      a balanced weekly schedule that maximizes adherence and results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-900 mb-2">Optimization Preferences</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="spacing"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={optimizationCriteria.spacing}
                        onChange={(e) => setOptimizationCriteria({
                          ...optimizationCriteria,
                          spacing: e.target.checked
                        })}
                      />
                      <label htmlFor="spacing" className="ml-2 block text-sm text-gray-700">
                        Optimize session spacing throughout the week
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="balanceDays"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={optimizationCriteria.balanceDays}
                        onChange={(e) => setOptimizationCriteria({
                          ...optimizationCriteria,
                          balanceDays: e.target.checked
                        })}
                      />
                      <label htmlFor="balanceDays" className="ml-2 block text-sm text-gray-700">
                        Balance sessions across days
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="prioritizeAdherence"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={optimizationCriteria.prioritizeAdherence}
                        onChange={(e) => setOptimizationCriteria({
                          ...optimizationCriteria,
                          prioritizeAdherence: e.target.checked
                        })}
                      />
                      <label htmlFor="prioritizeAdherence" className="ml-2 block text-sm text-gray-700">
                        Consider past adherence patterns
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="timePreference" className="block text-sm font-medium text-gray-700">
                    Time of Day Preference
                  </label>
                  <select
                    id="timePreference"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={optimizationCriteria.timePreference}
                    onChange={(e) => setOptimizationCriteria({
                      ...optimizationCriteria,
                      timePreference: e.target.value
                    })}
                  >
                    <option value="morning">Morning (6 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                    <option value="evening">Evening (6 PM - 10 PM)</option>
                    <option value="distributed">Distributed throughout the day</option>
                  </select>
                </div>
                
                {/* Current Schedule Overview */}
                <div>
                  <h4 className="font-medium text-sm text-gray-900 mb-2">Current Schedule Distribution</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="grid grid-cols-7 gap-1">
                      {[...Array(7)].map((_, day) => (
                        <div key={day} className="text-center">
                          <div className="text-xs font-medium text-gray-500">{getDayName(day).substring(0, 3)}</div>
                          <div className="mt-1">
                            <div className={`text-sm font-medium ${
                              sessionsByDay[day].length === 0 ? 'text-gray-400' :
                              sessionsByDay[day].length <= 2 ? 'text-green-600' :
                              sessionsByDay[day].length <= 4 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {sessionsByDay[day].length || 0}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Optimize Schedule
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
