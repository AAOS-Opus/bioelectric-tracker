'use client';

import { useState } from 'react';
import { X, Save, Check, Calendar, Trash } from 'lucide-react';
import { ModalitySession, ScheduleTemplate } from '../WeeklySchedule';
import { getDayName, formatTime } from './utils';
import './schedule.css';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ScheduleTemplate[];
  currentSessions: ModalitySession[];
  onSaveTemplate: (name: string, description?: string) => void;
  onApplyTemplate: (templateId: string) => void;
}

export default function TemplateManager({
  isOpen,
  onClose,
  templates,
  currentSessions,
  onSaveTemplate,
  onApplyTemplate
}: TemplateManagerProps) {
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'save' | 'apply'>('apply');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [confirmApply, setConfirmApply] = useState(false);
  
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;
    
    onSaveTemplate(newTemplateName, newTemplateDescription);
    setNewTemplateName('');
    setNewTemplateDescription('');
    setActiveTab('apply');
  };
  
  const handleApplyTemplate = () => {
    if (!selectedTemplateId) return;
    
    onApplyTemplate(selectedTemplateId);
    setSelectedTemplateId(null);
    setConfirmApply(false);
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
                Schedule Templates
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
            
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('apply')}
                  className={`${
                    activeTab === 'apply'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  aria-current={activeTab === 'apply' ? 'page' : undefined}
                >
                  Apply Template
                </button>
                <button
                  onClick={() => setActiveTab('save')}
                  className={`${
                    activeTab === 'save'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  aria-current={activeTab === 'save' ? 'page' : undefined}
                >
                  Save Current Schedule
                </button>
              </nav>
            </div>
            
            {activeTab === 'apply' ? (
              <div>
                {templates.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No templates yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new template from your current schedule.
                    </p>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setActiveTab('save')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Save className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Create Template
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 mb-4">
                      Select a template to apply to your current schedule. This will replace your existing sessions.
                    </p>
                    
                    {confirmApply && selectedTemplateId ? (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                This will replace all your current sessions. This action cannot be undone.
                              </p>
                            </div>
                            <div className="mt-4 flex space-x-3">
                              <button
                                type="button"
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                onClick={handleApplyTemplate}
                              >
                                Yes, Apply Template
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={() => setConfirmApply(false)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                        {templates.map(template => {
                          const isSelected = selectedTemplateId === template.id;
                          const sessionCount = template.sessions.length;
                          const createdDate = new Date(template.createdAt).toLocaleDateString();
                          
                          return (
                            <li 
                              key={template.id} 
                              className={`
                                py-4 px-2 flex items-start cursor-pointer rounded-md 
                                ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                              `}
                              onClick={() => setSelectedTemplateId(template.id)}
                            >
                              <div className={`
                                flex-shrink-0 h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center
                                ${isSelected ? 'bg-blue-600 border-blue-600' : ''}
                              `}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <div className="ml-3 flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">{template.name}</p>
                                  <p className="text-xs text-gray-500">{createdDate}</p>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                  {template.description || `Contains ${sessionCount} sessions.`}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    
                    {selectedTemplateId && !confirmApply && (
                      <div className="mt-5 sm:mt-6">
                        <button
                          type="button"
                          onClick={() => setConfirmApply(true)}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                        >
                          Apply Selected Template
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveTemplate}>
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    Save your current schedule as a template to quickly apply it again later.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="templateName" className="block text-sm font-medium text-gray-700">
                        Template Name
                      </label>
                      <input
                        type="text"
                        id="templateName"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="E.g., My Weekly Schedule"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="templateDescription" className="block text-sm font-medium text-gray-700">
                        Description (optional)
                      </label>
                      <textarea
                        id="templateDescription"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={newTemplateDescription}
                        onChange={(e) => setNewTemplateDescription(e.target.value)}
                        placeholder="Brief description of this template..."
                        rows={3}
                      ></textarea>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Sessions to Save</h4>
                      {currentSessions.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          No sessions in current schedule
                        </p>
                      ) : (
                        <ul className="space-y-2 max-h-32 overflow-y-auto">
                          {currentSessions.map(session => (
                            <li key={session.id} className="flex items-center">
                              <div 
                                className={`modality-indicator-sm color-${session.modalityType.toLowerCase().replace(' ', '-')}`}
                              ></div>
                              <span className="text-sm">
                                {session.title || session.modalityType} - {getDayName(session.day)}, {formatTime(session.startTime)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-6">
                  <button
                    type="submit"
                    disabled={currentSessions.length === 0 || !newTemplateName.trim()}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm ${
                      (currentSessions.length === 0 || !newTemplateName.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Template
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
