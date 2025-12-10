'use client'

import React, { useState, useRef } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Check, Download, FileUp, AlertCircle } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface ImportExportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: any[]) => void
  exportData: any[]
  type: 'products' | 'modalities' | 'phases' | 'biomarkers'
}

export function ImportExportModal({
  isOpen,
  onClose,
  onImport,
  exportData,
  type
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState('import')
  const [importText, setImportText] = useState('')
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [parsedData, setParsedData] = useState<any[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const typeTitleMap = {
    products: 'Products',
    modalities: 'Modalities',
    phases: 'Phases',
    biomarkers: 'Biomarkers'
  }

  const validateImportData = (data: any[]) => {
    const errors: string[] = []
    
    if (!Array.isArray(data)) {
      errors.push('Imported data must be an array.')
      return { valid: false, errors }
    }
    
    if (data.length === 0) {
      errors.push('No data found to import.')
      return { valid: false, errors }
    }
    
    // Validate based on type
    if (type === 'products') {
      data.forEach((item, index) => {
        if (!item.name) {
          errors.push(`Item #${index + 1} is missing a name.`)
        }
        if (!item.category) {
          errors.push(`Item #${index + 1} (${item.name || 'Unnamed'}) is missing a category.`)
        }
      })
    } else if (type === 'modalities') {
      data.forEach((item, index) => {
        if (!item.name) {
          errors.push(`Item #${index + 1} is missing a name.`)
        }
      })
    } else if (type === 'phases') {
      data.forEach((item, index) => {
        if (!item.name) {
          errors.push(`Item #${index + 1} is missing a name.`)
        }
        if (item.order === undefined) {
          errors.push(`Item #${index + 1} (${item.name || 'Unnamed'}) is missing an order value.`)
        }
      })
    } else if (type === 'biomarkers') {
      data.forEach((item, index) => {
        if (!item.name) {
          errors.push(`Item #${index + 1} is missing a name.`)
        }
        if (!item.inputType) {
          errors.push(`Item #${index + 1} (${item.name || 'Unnamed'}) is missing an input type.`)
        }
      })
    }
    
    return { valid: errors.length === 0, errors }
  }

  const handleParseImport = () => {
    setValidationErrors([])
    setParsedData(null)
    
    try {
      let data
      
      if (importFormat === 'json') {
        data = JSON.parse(importText)
      } else {
        // Basic CSV parsing
        data = parseCSV(importText)
      }
      
      const validation = validateImportData(data)
      
      if (validation.valid) {
        setParsedData(data)
        toast({
          title: 'Validation Successful',
          description: `${data.length} ${type} ready to import`,
          variant: 'default'
        })
      } else {
        setValidationErrors(validation.errors)
        toast({
          title: 'Validation Failed',
          description: `Found ${validation.errors.length} errors in import data`,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error parsing import data:', error)
      setValidationErrors([`Failed to parse ${importFormat.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`])
      toast({
        title: 'Parse Error',
        description: `Failed to parse ${importFormat.toUpperCase()} data`,
        variant: 'destructive'
      })
    }
  }

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n')
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row')
    
    const headers = lines[0].split(',').map(h => h.trim())
    
    return lines.slice(1)
      .filter(line => line.trim() !== '')
      .map(line => {
        const values = line.split(',').map(v => v.trim())
        const obj: Record<string, string> = {}
        
        headers.forEach((header, i) => {
          obj[header] = values[i] || ''
        })
        
        return obj
      })
  }

  const generateCSV = (data: any[]): string => {
    if (data.length === 0) return ''
    
    // Get all unique keys from all objects
    const allKeys = new Set<string>()
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        // Filter out internal MongoDB keys and complex objects
        if (!key.startsWith('_') && typeof item[key] !== 'object') {
          allKeys.add(key)
        }
      })
    })
    
    const headers = Array.from(allKeys)
    const headerRow = headers.join(',')
    
    const rows = data.map(item => {
      return headers.map(key => {
        // Handle values that might contain commas or quotes
        const value = item[key] !== undefined ? String(item[key]) : ''
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    })
    
    return [headerRow, ...rows].join('\n')
  }

  const getExportText = (): string => {
    if (exportFormat === 'json') {
      // Filter out MongoDB internal fields and convert to clean JSON
      const cleanData = exportData.map(item => {
        const cleanItem: Record<string, any> = {}
        Object.entries(item).forEach(([key, value]) => {
          if (!key.startsWith('_') && key !== '__v') {
            cleanItem[key] = value
          }
        })
        return cleanItem
      })
      
      return JSON.stringify(cleanData, null, 2)
    } else {
      return generateCSV(exportData)
    }
  }

  const handleImport = () => {
    if (!parsedData) return
    
    onImport(parsedData)
    onClose()
    setParsedData(null)
    setImportText('')
  }

  const handleExport = () => {
    const exportText = getExportText()
    const blob = new Blob([exportText], { type: exportFormat === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_export.${exportFormat}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Auto-detect format based on extension
    if (file.name.endsWith('.json')) {
      setImportFormat('json')
    } else if (file.name.endsWith('.csv')) {
      setImportFormat('csv')
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportText(content)
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import/Export {typeTitleMap[type]}</DialogTitle>
          <DialogDescription>
            Bulk import or export {type} data for your customization needs
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import {typeTitleMap[type]}</CardTitle>
                <CardDescription>
                  Paste JSON or CSV data below, or upload a file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="import-format">Format</Label>
                    <div className="flex mt-1 space-x-4">
                      <Button
                        type="button"
                        variant={importFormat === 'json' ? 'default' : 'outline'}
                        onClick={() => setImportFormat('json')}
                        className="flex-1"
                      >
                        JSON
                      </Button>
                      <Button
                        type="button"
                        variant={importFormat === 'csv' ? 'default' : 'outline'}
                        onClick={() => setImportFormat('csv')}
                        className="flex-1"
                      >
                        CSV
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <Label htmlFor="file-upload">Upload File</Label>
                    <div className="mt-1">
                      <Button 
                        onClick={handleFileButtonClick}
                        className="w-full"
                      >
                        <FileUp className="mr-2 h-4 w-4" />
                        Choose File
                      </Button>
                      <Label htmlFor="file-upload" className="sr-only">Upload configuration file</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="file-upload"
                        accept=".json,.csv"
                        onChange={handleFileUpload}
                        aria-label="Upload configuration file" 
                        title="Select a JSON or CSV file to import"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="import-text">Paste {importFormat.toUpperCase()} Data</Label>
                  <Textarea
                    id="import-text"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={`Paste ${importFormat.toUpperCase()} data here...`}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                
                <Button 
                  onClick={handleParseImport}
                  disabled={!importText.trim()}
                >
                  Validate Import Data
                </Button>
                
                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Validation Errors</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 mt-2 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                {parsedData && (
                  <Alert>
                    <Check className="h-4 w-4 text-green-500" />
                    <AlertTitle>Ready to Import</AlertTitle>
                    <AlertDescription>
                      {parsedData.length} {parsedData.length === 1 ? type.slice(0, -1) : type} ready to import.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export {typeTitleMap[type]}</CardTitle>
                <CardDescription>
                  Export your data to JSON or CSV format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant={exportFormat === 'json' ? 'default' : 'outline'}
                      onClick={() => setExportFormat('json')}
                      className="flex-1"
                    >
                      JSON
                    </Button>
                    <Button
                      type="button"
                      variant={exportFormat === 'csv' ? 'default' : 'outline'}
                      onClick={() => setExportFormat('csv')}
                      className="flex-1"
                    >
                      CSV
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <Textarea
                    value={getExportText()}
                    readOnly
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                
                <Button onClick={handleExport} disabled={exportData.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Download {exportFormat.toUpperCase()}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {activeTab === 'import' && (
            <Button
              onClick={handleImport}
              disabled={!parsedData}
            >
              Import Data
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
