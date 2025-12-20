import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() {}

  /**
   * Export data to CSV format
   */
  exportToCSV(data: any[], filename: string, columns?: string[]): void {
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Get columns from first item or use provided columns
    const keys = columns || Object.keys(data[0]);
    
    // Create CSV header
    const header = keys.join(',');
    
    // Create CSV rows
    const rows = data.map(item => 
      keys.map(key => {
        const value = item[key];
        // Handle nested objects
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        // Escape quotes in strings
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    );

    // Combine header and rows
    const csv = [header, ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export data to JSON format
   */
  exportToJSON(data: any[], filename: string): void {
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generate PDF export (requires external library)
   * For now, returns instruction to implement with jsPDF
   */
  exportToPDF(data: any[], filename: string): void {
    console.log('PDF export requires jsPDF library. Install with: npm install jspdf');
    this.exportToJSON(data, filename);
  }
}
