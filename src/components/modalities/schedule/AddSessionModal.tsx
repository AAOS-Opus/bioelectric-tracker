'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Calendar } from 'lucide-react';
import { ModalitySession, ModalityType } from '../WeeklySchedule';
import { formatTime, getDayName } from './utils';

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSession: (session: Omit<ModalitySession, 'id' | 'color'>) => void;
  editSession?: ModalitySession;
  onUpdateSession?: (session: ModalitySession) => void;
}

export default function AddSessionModal({
  isOpen,
  onClose,
  onAddSession,
  editSession,
  onUpdateSession
}: AddSessionModalProps) {
  const [title, setTitle] = useState('');
  const [modalityType, setModalityType] = useState<ModalityType>('Spooky Scalar');
  const [day, setDay] = useState(0); // Monday
  const [startHour, setStartHour] = useState(9); // 9 AM
  const [startMinute, setStartMinute] = useState(0); // 00
  const [duration, setDuration] = useState(30); // 30 minutes
  const [recurring, setRecurring] = useState<boolean | 'daily' | 'weekly'>(false);
  const [notes, setNotes] = useState('');
  
  // Reset form when modal opens or edit session changes
  useEffect(() => {
    if (isOpen) {
      if (editSession) {
        setTitle(editSession.title);
        setModalityType(editSession.modalityType);
        setDay(editSession.day);
        const startTimeMinutes = editSession.startTime;
        setStartHour(Math.floor(startTimeMinutes / 60));
        setStartMinute(startTimeMinutes % 60);
        setDuration(editSession.duration);
        setRecurring(editSession.recurring || false);
        setNotes(editSession.notes || '');
      } else {
        // Default values for new session
        setTitle('');
        setModalityType('Spooky Scalar');
        setDay(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); // Current day, adjusted for Monday=0 format
        setStartHour(9);
        setStartMinute(0);
        setDuration(30);
        setRecurring(false);
        setNotes('');
      }
    }
  }, [isOpen, editSession]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startTime = startHour * 60 + startMinute;
    
    if (editSession && onUpdateSession) {
      onUpdateSession({
        ...editSession,
        title,
        modalityType,
        day,
        startTime,
        duration,
        recurring,
        notes
      });
    } else {
      onAddSession({
        title,
        modalityType,
        day,
        startTime,
        duration,
        recurring,
        notes
      });
    }
    
    onClose();
  };

  if (!isOpen) return null;

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
                {editSession ? 'Edit Session' : 'Add New Session'}
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
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Modality Type */}
                <div>
                  <label htmlFor="modalityType" className="block text-sm font-medium text-gray-700">
                    Modality Type
                  </label>
                  <select
                    id="modalityType"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={modalityType}
                    onChange={(e) => setModalityType(e.target.value as ModalityType)}
                    required
                    title="Select Modality Type"
                    aria-label="Select Modality Type"
                  >
                    <option value="Spooky Scalar">Spooky Scalar</option>
                    <option value="MWO">MWO (Multi-Wave Oscillator)</option>
                    <option value="Movement">Movement</option>
                    <option value="Mindfulness">Mindfulness</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    className="mt-1 block w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    placeholder={`${modalityType} Session`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                {/* Day and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="day" className="block text-sm font-medium text-gray-700">
                      Day
                    </label>
                    <div className="relative mt-1">
                      <select
                        id="day"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={day}
                        onChange={(e) => setDay(parseInt(e.target.value))}
                        required
                        title="Select Day"
                        aria-label="Select Day"
                      >
                        <option value={0}>Monday</option>
                        <option value={1}>Tuesday</option>
                        <option value={2}>Wednesday</option>
                        <option value={3}>Thursday</option>
                        <option value={4}>Friday</option>
                        <option value={5}>Saturday</option>
                        <option value={6}>Sunday</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <Calendar className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                      Start Time
                    </label>
                    <div className="relative mt-1 flex rounded-md shadow-sm">
                      <select
                        id="startHour"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-7 py-2 sm:text-sm border-gray-300 rounded-l-md"
                        value={startHour}
                        onChange={(e) => setStartHour(parseInt(e.target.value))}
                        required
                        title="Hour"
                        aria-label="Hour"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <span className="inline-flex items-center px-1 border-t border-b border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        :
                      </span>
                      <select
                        id="startMinute"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-7 py-2 sm:text-sm border-gray-300 rounded-r-md"
                        value={startMinute}
                        onChange={(e) => setStartMinute(parseInt(e.target.value))}
                        required
                        title="Minute"
                        aria-label="Minute"
                      >
                        <option value={0}>00</option>
                        <option value={15}>15</option>
                        <option value={30}>30</option>
                        <option value={45}>45</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Duration */}
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                    Duration (minutes)
                  </label>
                  <select
                    id="duration"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    required
                    title="Select Duration"
                    aria-label="Select Duration"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                
                {/* Recurring */}
                <div>
                  <div className="flex items-center">
                    <input
                      id="recurring"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={!!recurring}
                      onChange={(e) => setRecurring(e.target.checked)}
                    />
                    <label htmlFor="recurring" className="ml-2 block text-sm text-gray-700">
                      Recurring session
                    </label>
                  </div>
                  
                  {recurring && (
                    <div className="mt-2 ml-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <input
                            id="recurring-daily"
                            type="radio"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            checked={recurring === 'daily'}
                            onChange={() => setRecurring('daily')}
                          />
                          <label htmlFor="recurring-daily" className="ml-2 block text-sm text-gray-700">
                            Daily
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="recurring-weekly"
                            type="radio"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            checked={recurring === 'weekly'}
                            onChange={() => setRecurring('weekly')}
                          />
                          <label htmlFor="recurring-weekly" className="ml-2 block text-sm text-gray-700">
                            Weekly
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={3}
                    placeholder="Any special instructions or notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                >
                  {editSession ? 'Update Session' : 'Add Session'}
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
