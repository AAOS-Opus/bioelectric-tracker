"use client";

'use client'

import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { 
  FileText, 
  Download, 
  Mail, 
  Share2, 
  Plus, 
  X, 
  Calendar, 
  Check
} from 'lucide-react'

interface ReportConfig {
  id: string
  title: string
  description: string
  lastGenerated?: string
  templateType: 'Comprehensive' | 'Biomarker' | 'Detox' | 'Protocol' | 'Custom'
  sections: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  customText?: string
  recipients?: string[]
}

// Example template options for reports
const REPORT_TEMPLATES = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Health Report',
    description: 'Complete overview of all health metrics, protocols, and progress',
    sections: [
      'demographics',
      'biomarkers',
      'modalitySessions',
      'detoxProgress', 
      'protocolAdherence',
      'phaseProgress',
      'recommendations'
    ]
  },
  {
    id: 'biomarker',
    name: 'Biomarker Tracking Report',
    description: 'Focused report on biomarker trends and correlations',
    sections: [
      'demographics',
      'biomarkers',
      'biomarkerTrends',
      'modalityCorrelations'
    ]
  },
  {
    id: 'detox',
    name: 'Detoxification Progress Report',
    description: 'Detailed analysis of toxin elimination and detox protocol effectiveness',
    sections: [
      'demographics',
      'detoxProgress',
      'toxinLevels',
      'modalitySessions',
      'recommendations'
    ]
  },
  {
    id: 'protocol',
    name: 'Protocol Adherence Report',
    description: 'Summary of treatment protocol adherence and effectiveness',
    sections: [
      'demographics',
      'protocolAdherence',
      'modalitySessions',
      'phaseProgress',
      'productUsage'
    ]
  },
  {
    id: 'custom',
    name: 'Custom Report',
    description: 'Create a customized report with selected sections',
    sections: []
  }
]

// Available sections for custom reports
const AVAILABLE_SECTIONS = [
  { id: 'demographics', name: 'Patient Demographics', default: true },
  { id: 'biomarkers', name: 'Current Biomarker Status', default: true },
  { id: 'biomarkerTrends', name: 'Biomarker Trends', default: false },
  { id: 'modalitySessions', name: 'Modality Sessions', default: false },
  { id: 'detoxProgress', name: 'Detoxification Progress', default: false },
  { id: 'toxinLevels', name: 'Toxin Level Analysis', default: false },
  { id: 'protocolAdherence', name: 'Protocol Adherence', default: false },
  { id: 'phaseProgress', name: 'Phase Progress & Milestones', default: false },
  { id: 'productUsage', name: 'Product Usage Summary', default: false },
  { id: 'modalityCorrelations', name: 'Modality-Biomarker Correlations', default: false },
  { id: 'recommendations', name: 'Personalized Recommendations', default: true },
  { id: 'patientNotes', name: 'Patient Notes & Observations', default: false }
]

export default function ReportGenerator({ 
  savedReports = [],
  onSaveReport,
  onGenerateReport,
  onShareReport
}: { 
  savedReports: ReportConfig[]
  onSaveReport?: (report: ReportConfig) => void
  onGenerateReport?: (report: ReportConfig) => Promise<string>
  onShareReport?: (report: ReportConfig, email: string) => Promise<boolean>
}) {
  const [step, setStep] = useState<'select' | 'configure' | 'preview'>('select')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [reportConfig, setReportConfig] = useState<ReportConfig | null>(null)
  const [customSections, setCustomSections] = useState<string[]>([])
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [reportTitle, setReportTitle] = useState<string>('')
  const [reportDescription, setReportDescription] = useState<string>('')
  const [customText, setCustomText] = useState<string>('')
  const [recipientEmail, setRecipientEmail] = useState<string>('')
  const [savedReportSelected, setSavedReportSelected] = useState<string>('')
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    
    const template = REPORT_TEMPLATES.find(t => t.id === templateId)
    
    if (template) {
      const now = new Date()
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(now.getMonth() - 3)
      
      setReportTitle(template.name)
      setReportDescription(template.description)
      setCustomSections(template.sections)
      setStartDate(threeMonthsAgo)
      setEndDate(now)
      
      setReportConfig({
        id: `report-${Date.now()}`,
        title: template.name,
        description: template.description,
        templateType: template.id as any,
        sections: template.sections,
        dateRange: {
          start: threeMonthsAgo,
          end: now
        },
        customText: ''
      })
      
      setStep('configure')
    }
  }
  
  // Handle saved report selection
  const handleSavedReportSelect = (reportId: string) => {
    setSavedReportSelected(reportId)
    
    const report = savedReports.find(r => r.id === reportId)
    
    if (report) {
      setReportConfig(report)
      setReportTitle(report.title)
      setReportDescription(report.description)
      setCustomSections(report.sections)
      setStartDate(report.dateRange.start)
      setEndDate(report.dateRange.end)
      setCustomText(report.customText || '')
      
      setStep('configure')
    }
  }
  
  // Handle section toggle for custom reports
  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    if (checked) {
      setCustomSections(prev => [...prev, sectionId])
    } else {
      setCustomSections(prev => prev.filter(id => id !== sectionId))
    }
    
    // Update report config
    if (reportConfig) {
      const updatedSections = checked 
        ? [...reportConfig.sections, sectionId]
        : reportConfig.sections.filter(id => id !== sectionId)
      
      setReportConfig({
        ...reportConfig,
        sections: updatedSections
      })
    }
  }
  
  // Process date changes for the report
  const handleDateChange = (type: 'start' | 'end', date: Date | undefined) => {
    if (type === 'start') {
      setStartDate(date || null)
      if (reportConfig) {
        setReportConfig({
          ...reportConfig,
          dateRange: {
            ...reportConfig.dateRange,
            start: date || null
          }
        })
      }
    } else {
      setEndDate(date || null)
      if (reportConfig) {
        setReportConfig({
          ...reportConfig,
          dateRange: {
            ...reportConfig.dateRange,
            end: date || null
          }
        })
      }
    }
  }
  
  // Save current report configuration
  const handleSaveReport = () => {
    if (!reportConfig) return
    
    const updatedConfig = {
      ...reportConfig,
      title: reportTitle,
      description: reportDescription,
      sections: customSections,
      customText: customText,
      lastGenerated: new Date().toISOString()
    }
    
    setReportConfig(updatedConfig)
    
    if (onSaveReport) {
      onSaveReport(updatedConfig)
    }
  }
  
  // Generate report based on configuration
  const handleGenerateReport = async () => {
    if (!reportConfig) return
    
    setLoading(true)
    
    try {
      const updatedConfig = {
        ...reportConfig,
        title: reportTitle,
        description: reportDescription,
        sections: customSections,
        customText: customText,
        lastGenerated: new Date().toISOString()
      }
      
      setReportConfig(updatedConfig)
      
      if (onGenerateReport) {
        await onGenerateReport(updatedConfig)
      }
      
      // In a real implementation, this would generate the actual report document
      // For now, we'll just simulate it with a delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setStep('preview')
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Share report with practitioner
  const handleShareReport = async () => {
    if (!reportConfig || !recipientEmail) return
    
    setLoading(true)
    
    try {
      if (onShareReport) {
        await onShareReport(reportConfig, recipientEmail)
      }
      
      // In a real implementation, this would send the report
      // For now, we'll just simulate it with a delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setRecipientEmail('')
    } catch (error) {
      console.error('Error sharing report:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Go back to template selection
  const handleReset = () => {
    setStep('select')
    setSelectedTemplate('')
    setReportConfig(null)
    setCustomSections([])
    setStartDate(null)
    setEndDate(null)
    setReportTitle('')
    setReportDescription('')
    setCustomText('')
    setRecipientEmail('')
    setSavedReportSelected('')
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              Health Report Generator
            </CardTitle>
            <CardDescription>
              Create and share custom health reports with practitioners
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {step === 'select' && (
          <div>
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Select Report Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {REPORT_TEMPLATES.map(template => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTemplate === template.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-gray-400'
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      {selectedTemplate === template.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {savedReports.length > 0 && (
              <div>
                <h3 className="text-md font-medium mb-2">Or Use a Saved Report</h3>
                <div className="border rounded-lg divide-y">
                  {savedReports.map(report => (
                    <div
                      key={report.id}
                      className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSavedReportSelect(report.id)}
                    >
                      <div>
                        <h4 className="font-medium">{report.title}</h4>
                        <p className="text-sm text-gray-600">{report.description}</p>
                        {report.lastGenerated && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            Last generated: {new Date(report.lastGenerated).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        Use Template
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {step === 'configure' && reportConfig && (
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-4"
              onClick={handleReset}
            >
              <X className="w-4 h-4 mr-1" /> Back to Templates
            </Button>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Report Title</label>
                <Input
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  placeholder="Enter report title"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                  placeholder="Brief description or purpose of this report"
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <DatePicker
                    date={startDate || undefined}
                    onChange={(date) => handleDateChange('start', date)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <DatePicker
                    date={endDate || undefined}
                    onChange={(date) => handleDateChange('end', date)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Report Sections</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_SECTIONS.map(section => (
                    <div key={section.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={section.id}
                        checked={customSections.includes(section.id)}
                        onCheckedChange={(checked) => 
                          handleSectionToggle(section.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={section.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {section.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Custom Notes/Message</label>
                <Textarea
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  placeholder="Add any additional notes or context for the report recipient..."
                  className="mt-1"
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleSaveReport}>
                  Save Template
                </Button>
                <Button 
                  onClick={handleGenerateReport}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {step === 'preview' && reportConfig && (
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-4"
              onClick={() => setStep('configure')}
            >
              <X className="w-4 h-4 mr-1" /> Back to Editor
            </Button>
            
            <div className="bg-white border rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-primary">{reportTitle}</h2>
                  <p className="text-gray-600">{reportDescription}</p>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded">
                  Generated {new Date().toLocaleDateString()}
                </div>
              </div>
              
              <div className="space-y-4 my-6">
                {customSections.includes('demographics') && (
                  <div className="border-b pb-3">
                    <h3 className="font-medium mb-2">Patient Demographics</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Name:</p>
                        <p>John Doe</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Age:</p>
                        <p>42</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Program Start:</p>
                        <p>January 15, 2023</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Current Phase:</p>
                        <p>Phase 3: Deep Regeneration</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {customSections.includes('biomarkers') && (
                  <div className="border-b pb-3">
                    <h3 className="font-medium mb-2">Current Biomarker Status</h3>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <p className="text-gray-700 font-medium">GGT</p>
                        <p className="text-2xl font-bold text-green-700">32 <span className="text-xs font-normal">U/L</span></p>
                        <p className="text-xs text-green-700">Normal Range</p>
                      </div>
                      <div className="bg-amber-50 p-2 rounded border border-amber-200">
                        <p className="text-gray-700 font-medium">AST</p>
                        <p className="text-2xl font-bold text-amber-700">38 <span className="text-xs font-normal">U/L</span></p>
                        <p className="text-xs text-amber-700">Slightly Elevated</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <p className="text-gray-700 font-medium">ALT</p>
                        <p className="text-2xl font-bold text-green-700">29 <span className="text-xs font-normal">U/L</span></p>
                        <p className="text-xs text-green-700">Normal Range</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {customSections.includes('modalitySessions') && (
                  <div className="border-b pb-3">
                    <h3 className="font-medium mb-2">Modality Session Summary</h3>
                    <div className="text-sm">
                      <div className="flex justify-between py-1 border-b">
                        <span>Spooky Scalar Sessions</span>
                        <span className="font-medium">24 sessions (avg. 3x weekly)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span>MWO Sessions</span>
                        <span className="font-medium">18 sessions (avg. 2x weekly)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Total Session Duration</span>
                        <span className="font-medium">845 minutes</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {customSections.includes('recommendations') && (
                  <div>
                    <h3 className="font-medium mb-2">Personalized Recommendations</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="bg-blue-100 text-blue-800 rounded-full p-1 mr-2 mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                        Increase Spooky Scalar frequency to 4x weekly to accelerate GGT normalization
                      </li>
                      <li className="flex items-start">
                        <div className="bg-blue-100 text-blue-800 rounded-full p-1 mr-2 mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                        Continue current detox protocol with additional support for AST reduction
                      </li>
                      <li className="flex items-start">
                        <div className="bg-blue-100 text-blue-800 rounded-full p-1 mr-2 mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                        Consider Phase 4 transition within 4-6 weeks based on current progress
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              
              {customText && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium mb-2">Additional Notes</h3>
                  <p className="text-sm whitespace-pre-line">{customText}</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-md font-medium mb-3">Share Report</h3>
              
              <div className="flex space-x-2">
                <Input
                  placeholder="Practitioner email address"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  className="max-w-md"
                />
                <Button 
                  onClick={handleShareReport}
                  disabled={!recipientEmail || loading}
                  className="whitespace-nowrap"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Report
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
