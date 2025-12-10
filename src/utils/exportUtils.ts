/**
 * Export Utilities
 * 
 * This module provides functions for exporting weekly snapshot data
 * to various formats like CSV and PDF.
 */

import { format, parseISO } from 'date-fns';
import { WeeklySnapshot } from './weeklyMetrics';
import { ExportOptions } from '@/components/progress/ExportPanel';

/**
 * Exports weekly snapshots data to CSV format
 * 
 * @param snapshots Array of weekly snapshots to export
 * @param options Export configuration options
 * @returns CSV string
 */
export function exportToCSV(snapshots: WeeklySnapshot[], options: ExportOptions): string {
  // Filter snapshots based on options
  const filteredSnapshots = filterSnapshotsByOptions(snapshots, options);
  
  // Define headers based on included fields
  const headers: string[] = ['Week', 'Start Date', 'End Date', 'Phase'];
  
  if (options.includeFields.productUsage) {
    headers.push(
      'Product Adherence (%)',
      'Total Products',
      'Missed Products',
      'Streak Days'
    );
  }
  
  if (options.includeFields.modalitySessions) {
    headers.push(
      'Modality Adherence (%)',
      'Total Sessions',
      'Total Minutes'
    );
  }
  
  if (options.includeFields.wellness) {
    headers.push(
      'Energy Level (1-10)',
      'Sleep Quality (1-10)',
      'Pain Level (1-10)',
      'Mental Clarity (1-10)',
      'Symptom Severity (1-10)'
    );
  }
  
  if (options.includeFields.biomarkers) {
    headers.push(
      'Biomarkers Available'
    );
  }
  
  if (options.includeFields.healthScore) {
    headers.push(
      'Health Score',
      'Improvement (%)'
    );
  }
  
  // Create CSV header row
  let csv = headers.join(',') + '\n';
  
  // Add data rows
  filteredSnapshots.forEach(snapshot => {
    const row: any[] = [
      snapshot.weekId,
      format(parseISO(snapshot.startDate), 'yyyy-MM-dd'),
      format(parseISO(snapshot.endDate), 'yyyy-MM-dd'),
      `Phase ${snapshot.phaseNumber}: ${snapshot.phaseName}`
    ];
    
    if (options.includeFields.productUsage) {
      row.push(
        snapshot.productUsage.adherenceRate,
        snapshot.productUsage.totalProducts,
        snapshot.productUsage.missedProducts,
        snapshot.productUsage.streakDays
      );
    }
    
    if (options.includeFields.modalitySessions) {
      row.push(
        snapshot.modalitySessions.adherenceRate,
        snapshot.modalitySessions.totalSessions,
        snapshot.modalitySessions.totalMinutes
      );
    }
    
    if (options.includeFields.wellness) {
      row.push(
        snapshot.wellness.energyLevel,
        snapshot.wellness.sleepQuality,
        snapshot.wellness.painLevel,
        snapshot.wellness.mentalClarity,
        snapshot.wellness.symptomSeverity
      );
    }
    
    if (options.includeFields.biomarkers) {
      row.push(
        snapshot.biomarkers.available ? 'Yes' : 'No'
      );
    }
    
    if (options.includeFields.healthScore) {
      row.push(
        snapshot.healthScore.overall,
        snapshot.healthScore.improvement
      );
    }
    
    // Add row to CSV
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

/**
 * Exports weekly snapshots data to PDF format
 * Note: This is a placeholder that would use a PDF generation library in a full implementation
 * 
 * @param snapshots Array of weekly snapshots to export
 * @param options Export configuration options
 * @returns Promise that resolves when PDF is generated
 */
export async function exportToPDF(snapshots: WeeklySnapshot[], options: ExportOptions): Promise<Blob> {
  // This would use a library like jsPDF or pdfmake to generate a PDF
  // For now, we'll just return a placeholder
  
  // Filter snapshots based on options
  const filteredSnapshots = filterSnapshotsByOptions(snapshots, options);
  
  console.log('Generating PDF with', filteredSnapshots.length, 'snapshots and options:', options);
  
  // In a real implementation, this would be the PDF generation code
  // For now, just return a placeholder Blob that we can download
  return new Blob(['PDF export is not implemented yet.'], { type: 'application/pdf' });
}

/**
 * Filters snapshots based on export options
 * 
 * @param snapshots Array of all available snapshots
 * @param options Export configuration options
 * @returns Filtered array of snapshots
 */
function filterSnapshotsByOptions(snapshots: WeeklySnapshot[], options: ExportOptions): WeeklySnapshot[] {
  // If exporting all data, return everything
  if (options.timeRange === 'all') {
    return snapshots;
  }
  
  // If exporting only displayed data, return as is
  if (options.timeRange === 'displayed') {
    return snapshots;
  }
  
  // If exporting selected weeks only
  if (options.timeRange === 'selected' && options.selectedWeeks) {
    return snapshots.filter(snapshot => 
      options.selectedWeeks?.includes(snapshot.weekId)
    );
  }
  
  // If exporting custom date range
  if (options.timeRange === 'custom' && options.customDateRange) {
    const startDate = new Date(options.customDateRange.start);
    const endDate = new Date(options.customDateRange.end);
    
    return snapshots.filter(snapshot => {
      const snapshotStartDate = parseISO(snapshot.startDate);
      const snapshotEndDate = parseISO(snapshot.endDate);
      
      return (
        (snapshotStartDate >= startDate && snapshotStartDate <= endDate) ||
        (snapshotEndDate >= startDate && snapshotEndDate <= endDate) ||
        (snapshotStartDate <= startDate && snapshotEndDate >= endDate)
      );
    });
  }
  
  // Default fallback - return everything
  return snapshots;
}

/**
 * Initiates a download of the exported data
 * 
 * @param data Data to download
 * @param filename Filename for the download
 * @param type MIME type of the data
 */
export function downloadFile(data: string | Blob, filename: string, type: string): void {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Main export function that handles data export based on format
 * 
 * @param snapshots Array of weekly snapshots to export
 * @param options Export configuration options
 */
export async function exportSnapshots(snapshots: WeeklySnapshot[], options: ExportOptions): Promise<void> {
  try {
    const filename = options.fileName || `weekly-snapshots-${new Date().toISOString().split('T')[0]}`;
    
    if (options.exportFormat === 'csv') {
      const csvData = exportToCSV(snapshots, options);
      downloadFile(csvData, `${filename}.csv`, 'text/csv');
    } else if (options.exportFormat === 'pdf') {
      const pdfBlob = await exportToPDF(snapshots, options);
      downloadFile(pdfBlob, `${filename}.pdf`, 'application/pdf');
    }
  } catch (error) {
    console.error('Error exporting snapshots:', error);
    throw new Error('Failed to export data. Please try again.');
  }
}
