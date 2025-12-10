/**
 * Export Panel Component
 * 
 * This component provides functionality to export weekly snapshots data
 * in various formats (CSV, PDF) with configurable options.
 */

import React, { useState } from 'react';
import { WeeklySnapshot } from '@/utils/weeklyMetrics';

interface ExportPanelProps {
  snapshots: WeeklySnapshot[];
  onClose: () => void;
  onExport: (format: string, options: ExportOptions) => void;
}

export interface ExportOptions {
  timeRange: 'all' | 'displayed' | 'selected' | 'custom';
  customDateRange?: { start: string; end: string };
  selectedWeeks?: string[];
  includeFields: {
    productUsage: boolean;
    modalitySessions: boolean;
    wellness: boolean;
    biomarkers: boolean;
    healthScore: boolean;
  };
  exportFormat: 'csv' | 'pdf';
  includeCharts: boolean;
  fileName?: string;
}

/**
 * ExportPanel Component
 * 
 * @param props Component properties
 * @returns React component
 */
export const ExportPanel: React.FC<ExportPanelProps> = ({
  snapshots,
  onClose,
  onExport
}) => {
  // Default export options
  const [options, setOptions] = useState<ExportOptions>({
    timeRange: 'displayed',
    includeFields: {
      productUsage: true,
      modalitySessions: true,
      wellness: true,
      biomarkers: true,
      healthScore: true
    },
    exportFormat: 'csv',
    includeCharts: false,
    fileName: `weekly-snapshots-export-${new Date().toISOString().split('T')[0]}`
  });
  
  // Handle option changes
  const handleOptionChange = (field: keyof ExportOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle field inclusion toggles
  const handleFieldToggle = (field: keyof ExportOptions['includeFields']) => {
    setOptions(prev => ({
      ...prev,
      includeFields: {
        ...prev.includeFields,
        [field]: !prev.includeFields[field]
      }
    }));
  };
  
  // Trigger export with current options
  const handleExportClick = () => {
    onExport(options.exportFormat, options);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="export-panel-title">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 id="export-panel-title" className="text-xl font-bold text-gray-800">Export Weekly Snapshots</h2>
          <button
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close export panel"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div>
              <div className="mb-5">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Export Format</h3>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-blue-600"
                      checked={options.exportFormat === 'csv'}
                      onChange={() => handleOptionChange('exportFormat', 'csv')}
                    />
                    <span className="ml-2 text-sm text-gray-700">CSV</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-blue-600"
                      checked={options.exportFormat === 'pdf'}
                      onChange={() => handleOptionChange('exportFormat', 'pdf')}
                    />
                    <span className="ml-2 text-sm text-gray-700">PDF</span>
                  </label>
                </div>
              </div>
              
              <div className="mb-5">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Time Range</h3>
                <div className="space-y-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-blue-600"
                      checked={options.timeRange === 'displayed'}
                      onChange={() => handleOptionChange('timeRange', 'displayed')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Currently Displayed ({snapshots.length} weeks)</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-blue-600"
                      checked={options.timeRange === 'all'}
                      onChange={() => handleOptionChange('timeRange', 'all')}
                    />
                    <span className="ml-2 text-sm text-gray-700">All Available Data</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-blue-600"
                      checked={options.timeRange === 'selected'}
                      onChange={() => handleOptionChange('timeRange', 'selected')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Selected Weeks Only</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-blue-600"
                      checked={options.timeRange === 'custom'}
                      onChange={() => handleOptionChange('timeRange', 'custom')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Custom Date Range</span>
                  </label>
                  
                  {options.timeRange === 'custom' && (
                    <div className="pl-6 pt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="custom-start-date" className="block text-xs text-gray-500 mb-1">
                          Start Date
                        </label>
                        <input
                          id="custom-start-date"
                          type="date"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          value={options.customDateRange?.start || ''}
                          onChange={(e) => handleOptionChange('customDateRange', {
                            ...options.customDateRange,
                            start: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <label htmlFor="custom-end-date" className="block text-xs text-gray-500 mb-1">
                          End Date
                        </label>
                        <input
                          id="custom-end-date"
                          type="date"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          value={options.customDateRange?.end || ''}
                          onChange={(e) => handleOptionChange('customDateRange', {
                            ...options.customDateRange,
                            end: e.target.value
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-5">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Filename</h3>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  value={options.fileName}
                  onChange={(e) => handleOptionChange('fileName', e.target.value)}
                  placeholder="Enter filename (without extension)"
                />
              </div>
            </div>
            
            {/* Right column */}
            <div>
              <div className="mb-5">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Include Data</h3>
                <div className="space-y-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={options.includeFields.productUsage}
                      onChange={() => handleFieldToggle('productUsage')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Product Usage</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={options.includeFields.modalitySessions}
                      onChange={() => handleFieldToggle('modalitySessions')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Modality Sessions</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={options.includeFields.wellness}
                      onChange={() => handleFieldToggle('wellness')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Wellness Metrics</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={options.includeFields.biomarkers}
                      onChange={() => handleFieldToggle('biomarkers')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Biomarker Data</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={options.includeFields.healthScore}
                      onChange={() => handleFieldToggle('healthScore')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Health Score</span>
                  </label>
                </div>
              </div>
              
              {options.exportFormat === 'pdf' && (
                <div className="mb-5">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">PDF Options</h3>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={options.includeCharts}
                      onChange={() => handleOptionChange('includeCharts', !options.includeCharts)}
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Charts</span>
                  </label>
                </div>
              )}
              
              <div className="bg-blue-50 p-3 rounded-md mt-5">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Export Summary</h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Format: {options.exportFormat.toUpperCase()}</li>
                  <li>• Weeks: {
                    options.timeRange === 'displayed' ? `${snapshots.length} currently displayed weeks` :
                    options.timeRange === 'all' ? 'All available data' :
                    options.timeRange === 'selected' ? 'Selected weeks only' :
                    'Custom date range'
                  }</li>
                  <li>• Data fields: {Object.entries(options.includeFields)
                    .filter(([, included]) => included)
                    .map(([field]) => field)
                    .join(', ')
                  }</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6 space-x-3">
            <button
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
              onClick={handleExportClick}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
