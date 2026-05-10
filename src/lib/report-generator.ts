// Real-time Report Generator for Industrial AI Predictive Maintenance
// Generates structured downloadable reports from live AI predictions and sensor data

import { MachineState, sensorSimulator } from './industrial-sensor-simulator';
import { AIPrediction, aiPredictionPipeline } from './ai-prediction-pipeline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface GeneratedReport {
  id: string;
  name: string;
  type: 'PDF' | 'XLSX' | 'CSV';
  date: string;
  size: string;
  data: any;
  downloadUrl?: string;
}

export interface ReportData {
  title: string;
  generatedAt: string;
  period: string;
  summary: {
    totalMachines: number;
    averageHealth: number;
    averageRUL: number;
    criticalAlerts: number;
    totalAnomalies: number;
    averageEfficiency: number;
  };
  machines: MachineReportData[];
  alerts: AlertReportData[];
  trends: TrendData[];
  recommendations: string[];
}

export interface MachineReportData {
  id: string;
  name: string;
  area: string;
  health: number;
  rul: number;
  operationalState: string;
  efficiency: number;
  performanceScore: number;
  anomalyScore: number;
  maintenanceUrgency: string;
  latestSensorData: {
    temperature: number;
    vibration: number;
    pressure: number;
    load: number;
    current: number;
    voltage: number;
    rpm: number;
    flowRate: number;
    powerConsumption: number;
  };
  predictedFailures: Array<{
    type: string;
    component: string;
    estimatedTime: number;
    confidence: number;
    severity: string;
  }>;
}

export interface AlertReportData {
  machine: string;
  severity: string;
  description: string;
  time: string;
  confidence: number;
  component: string;
  estimatedTime: number;
}

export interface TrendData {
  date: string;
  averageHealth: number;
  averageRUL: number;
  averageEfficiency: number;
  anomalyCount: number;
}

export class ReportGenerator {
  
  static generateWeeklyHealthReport(): GeneratedReport {
    const machines = sensorSimulator.getMachineStates();
    const predictions = aiPredictionPipeline.getAllPredictions();
    const criticalAlerts = aiPredictionPipeline.getCriticalAlerts();
    
    const reportData: ReportData = {
      title: 'Weekly Plant Health Report',
      generatedAt: new Date().toISOString(),
      period: 'Last 7 Days',
      summary: this.calculateSummary(machines, predictions, criticalAlerts),
      machines: machines.map(machine => this.generateMachineReport(machine, predictions)),
      alerts: this.generateAlertReports(criticalAlerts),
      trends: this.generateTrendData(),
      recommendations: this.generateRecommendations(machines, predictions)
    };

    return {
      id: 'weekly-health-' + Date.now(),
      name: 'Weekly Plant Health Report',
      type: 'PDF',
      date: new Date().toLocaleDateString(),
      size: this.estimateFileSize(reportData, 'PDF'),
      data: reportData
    };
  }

  static generateFailureAnalysisReport(): GeneratedReport {
    const machines = sensorSimulator.getMachineStates();
    const predictions = aiPredictionPipeline.getAllPredictions();
    const criticalAlerts = aiPredictionPipeline.getCriticalAlerts();
    
    const reportData: ReportData = {
      title: 'Failure Code Analysis Report',
      generatedAt: new Date().toISOString(),
      period: 'Last 7 Days',
      summary: this.calculateSummary(machines, predictions, criticalAlerts),
      machines: machines.map(machine => this.generateMachineReport(machine, predictions)),
      alerts: this.generateAlertReports(criticalAlerts),
      trends: this.generateTrendData(),
      recommendations: this.generateFailureSpecificRecommendations(predictions)
    };

    return {
      id: 'failure-analysis-' + Date.now(),
      name: 'Failure Code Analysis',
      type: 'PDF',
      date: new Date().toLocaleDateString(),
      size: this.estimateFileSize(reportData, 'PDF'),
      data: reportData
    };
  }

  static generateEnergyConsumptionReport(): GeneratedReport {
    const machines = sensorSimulator.getMachineStates();
    const predictions = aiPredictionPipeline.getAllPredictions();
    
    const reportData: ReportData = {
      title: 'Energy Consumption Trends',
      generatedAt: new Date().toISOString(),
      period: 'Last 7 Days',
      summary: this.calculateSummary(machines, predictions, []),
      machines: machines.map(machine => this.generateMachineReport(machine, predictions)),
      alerts: [],
      trends: this.generateEnergyTrendData(),
      recommendations: this.generateEnergyRecommendations(machines)
    };

    return {
      id: 'energy-trends-' + Date.now(),
      name: 'Energy Consumption Trends',
      type: 'XLSX',
      date: new Date().toLocaleDateString(),
      size: this.estimateFileSize(reportData, 'XLSX'),
      data: reportData
    };
  }

  static generateMaintenanceComplianceReport(): GeneratedReport {
    const machines = sensorSimulator.getMachineStates();
    const predictions = aiPredictionPipeline.getAllPredictions();
    
    const reportData: ReportData = {
      title: 'Maintenance Compliance Report',
      generatedAt: new Date().toISOString(),
      period: 'Last 30 Days',
      summary: this.calculateSummary(machines, predictions, []),
      machines: machines.map(machine => this.generateMachineReport(machine, predictions)),
      alerts: [],
      trends: this.generateComplianceTrendData(),
      recommendations: this.generateComplianceRecommendations(machines, predictions)
    };

    return {
      id: 'maintenance-compliance-' + Date.now(),
      name: 'Maintenance Compliance',
      type: 'PDF',
      date: new Date().toLocaleDateString(),
      size: this.estimateFileSize(reportData, 'PDF'),
      data: reportData
    };
  }

  private static calculateSummary(machines: MachineState[], predictions: AIPrediction[], criticalAlerts: any[]) {
    return {
      totalMachines: machines.length,
      averageHealth: Math.round(machines.reduce((sum, m) => sum + m.health, 0) / machines.length),
      averageRUL: Math.round(predictions.reduce((sum, p) => sum + p.rulHours, 0) / predictions.length),
      criticalAlerts: criticalAlerts.length,
      totalAnomalies: predictions.reduce((sum, p) => sum + (p.anomalyScore > 0.5 ? 1 : 0), 0),
      averageEfficiency: Math.round(predictions.reduce((sum, p) => sum + p.efficiency, 0) / predictions.length)
    };
  }

  private static generateMachineReport(machine: MachineState, predictions: AIPrediction[]): MachineReportData {
    const prediction = predictions.find(p => p.machineId === machine.id);
    const latestReading = sensorSimulator.getLatestSensorReading(machine.id);
    
    return {
      id: machine.id,
      name: machine.name,
      area: this.getMachineArea(machine.type),
      health: Math.round(machine.health),
      rul: Math.round(prediction?.rulHours || machine.rul),
      operationalState: machine.operationalState,
      efficiency: prediction?.efficiency || 0,
      performanceScore: prediction?.performanceScore || 0,
      anomalyScore: prediction?.anomalyScore || 0,
      maintenanceUrgency: prediction?.maintenanceUrgency || 'low',
      latestSensorData: {
        temperature: latestReading?.temperature || 0,
        vibration: latestReading?.vibration || 0,
        pressure: latestReading?.pressure || 0,
        load: latestReading?.load || 0,
        current: latestReading?.current || 0,
        voltage: latestReading?.voltage || 0,
        rpm: latestReading?.rpm || 0,
        flowRate: latestReading?.flowRate || 0,
        powerConsumption: latestReading?.powerConsumption || 0
      },
      predictedFailures: prediction?.predictedFailures || []
    };
  }

  private static generateAlertReports(criticalAlerts: any[]): AlertReportData[] {
    return criticalAlerts.map(alert => ({
      machine: alert.machineId.replace('MACHINE_', 'Machine '),
      severity: alert.maintenanceUrgency || 'high',
      description: alert.predictedFailures[0]?.description || 'Performance degradation detected',
      time: new Date(alert.timestamp).toLocaleString(),
      confidence: alert.predictedFailures[0]?.confidence || 0,
      component: alert.predictedFailures[0]?.component || 'system',
      estimatedTime: alert.predictedFailures[0]?.estimatedTime || 0
    }));
  }

  private static generateTrendData(): TrendData[] {
    const trends: TrendData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toLocaleDateString(),
        averageHealth: Math.round(70 + Math.random() * 20),
        averageRUL: Math.round(10 + Math.random() * 30),
        averageEfficiency: Math.round(60 + Math.random() * 30),
        anomalyCount: Math.floor(Math.random() * 5)
      });
    }
    return trends;
  }

  private static generateEnergyTrendData(): TrendData[] {
    const trends: TrendData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toLocaleDateString(),
        averageHealth: Math.round(70 + Math.random() * 20),
        averageRUL: Math.round(10 + Math.random() * 30),
        averageEfficiency: Math.round(60 + Math.random() * 30),
        anomalyCount: Math.floor(Math.random() * 5)
      });
    }
    return trends;
  }

  private static generateComplianceTrendData(): TrendData[] {
    const trends: TrendData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toLocaleDateString(),
        averageHealth: Math.round(70 + Math.random() * 20),
        averageRUL: Math.round(10 + Math.random() * 30),
        averageEfficiency: Math.round(60 + Math.random() * 30),
        anomalyCount: Math.floor(Math.random() * 5)
      });
    }
    return trends;
  }

  private static generateRecommendations(machines: MachineState[], predictions: AIPrediction[]): string[] {
    const recommendations: string[] = [];
    
    const criticalMachines = machines.filter(m => m.health < 40);
    if (criticalMachines.length > 0) {
      recommendations.push(`Immediate attention required for ${criticalMachines.length} critical machines`);
    }

    const avgHealth = machines.reduce((sum, m) => sum + m.health, 0) / machines.length;
    if (avgHealth < 70) {
      recommendations.push('Overall plant health declining - schedule comprehensive maintenance review');
    }

    const highAnomalyMachines = predictions.filter(p => p.anomalyScore > 0.5);
    if (highAnomalyMachines.length > 0) {
      recommendations.push(`Investigate anomaly patterns in ${highAnomalyMachines.length} machines`);
    }

    recommendations.push('Continue regular preventive maintenance schedule');
    recommendations.push('Monitor energy consumption trends for optimization opportunities');

    return recommendations;
  }

  private static generateFailureSpecificRecommendations(predictions: AIPrediction[]): string[] {
    const recommendations: string[] = [];
    
    const bearingFailures = predictions.filter(p => 
      p.predictedFailures.some(f => f.component === 'bearing')
    );
    if (bearingFailures.length > 0) {
      recommendations.push('Schedule bearing inspections for high-risk equipment');
    }

    const thermalFailures = predictions.filter(p => 
      p.predictedFailures.some(f => f.type === 'thermal_failure')
    );
    if (thermalFailures.length > 0) {
      recommendations.push('Review cooling systems and lubrication schedules');
    }

    const overloadFailures = predictions.filter(p => 
      p.predictedFailures.some(f => f.type === 'overload_failure')
    );
    if (overloadFailures.length > 0) {
      recommendations.push('Implement load balancing strategies across production lines');
    }

    return recommendations;
  }

  private static generateEnergyRecommendations(machines: MachineState[]): string[] {
    const recommendations: string[] = [];
    
    const highPowerMachines = machines.filter(m => {
      const reading = sensorSimulator.getLatestSensorReading(m.id);
      return reading && reading.powerConsumption > 20;
    });
    
    if (highPowerMachines.length > 0) {
      recommendations.push(`${highPowerMachines.length} machines showing high energy consumption - consider efficiency upgrades`);
    }

    recommendations.push('Implement energy-saving practices during off-peak hours');
    recommendations.push('Consider variable frequency drives for motor optimization');
    recommendations.push('Regular cleaning and maintenance of heat exchange systems');

    return recommendations;
  }

  private static generateComplianceRecommendations(machines: MachineState[], predictions: AIPrediction[]): string[] {
    const recommendations: string[] = [];
    
    const overdueMachines = predictions.filter(p => p.rulHours < 24);
    if (overdueMachines.length > 0) {
      recommendations.push(`${overdueMachines.length} machines require immediate maintenance to meet compliance standards`);
    }

    const lowEfficiencyMachines = predictions.filter(p => p.efficiency < 60);
    if (lowEfficiencyMachines.length > 0) {
      recommendations.push(`Address efficiency issues in ${lowEfficiencyMachines.length} machines for regulatory compliance`);
    }

    recommendations.push('Maintain detailed maintenance logs for audit purposes');
    recommendations.push('Schedule regular compliance inspections');
    recommendations.push('Update maintenance procedures based on latest industry standards');

    return recommendations;
  }

  private static getMachineArea(type: MachineState['type']): string {
    const areas = {
      hydrapulper: 'Stock Prep',
      digester: 'Pulping',
      screen: 'Screening',
      dryer: 'Drying',
      calender: 'Finishing',
      paper_machine: 'Formation'
    };
    return areas[type];
  }

  private static estimateFileSize(data: ReportData, type: 'PDF' | 'XLSX' | 'CSV'): string {
    const baseSize = JSON.stringify(data).length;
    
    switch (type) {
      case 'PDF':
        return `${(baseSize * 0.0015).toFixed(1)} MB`;
      case 'XLSX':
        return `${(baseSize * 0.0008).toFixed(1)} MB`;
      case 'CSV':
        return `${(baseSize * 0.0005).toFixed(1)} MB`;
      default:
        return `${(baseSize * 0.001).toFixed(1)} MB`;
    }
  }

  static downloadReport(report: GeneratedReport): void {
    switch (report.type) {
      case 'PDF':
        this.generateSimplePDF(report);
        break;
      case 'XLSX':
        this.generateCSV(report);
        break;
      case 'CSV':
        this.generateCSV(report);
        break;
      default:
        this.generateJSON(report);
    }
  }

  // Generate PDF with exact format matching user's example - centered and larger text
  private static generateSimplePDF(report: GeneratedReport): void {
    try {
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin + 10;
      const contentWidth = pageWidth - 2 * margin;

      // Set up colors
      const colors = {
        primary: [41, 128, 185],
        success: [39, 174, 96],
        warning: [241, 196, 15],
        danger: [231, 76, 60],
        dark: [44, 62, 80],
        light: [236, 240, 241]
      };

      // Add border to the entire page
      pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.setLineWidth(2);
      pdf.rect(5, 5, pageWidth - 10, pageHeight - 10);

      // Generate the exact format requested
      const content = this.generateTextReportContent(report.data);
      
      // Split content into lines and add to PDF
      const lines = content.split('\n');
      const lineHeight = 6; // Increased line height
      const maxLinesPerPage = Math.floor((pageHeight - 50) / lineHeight);
      
      lines.forEach((line, index) => {
        if (index > 0 && index % maxLinesPerPage === 0) {
          pdf.addPage();
          yPosition = margin + 10;
          
          // Add border to new page
          pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
          pdf.setLineWidth(2);
          pdf.rect(5, 5, pageWidth - 10, pageHeight - 10);
        }
        
        // Set font based on line content - increased sizes
        if (line.includes('================================================================================')) {
          pdf.setFontSize(10); // Increased from 8
          pdf.setFont('courier', 'normal');
          pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        } else if (line.includes('INDUSTRIAL AI PREDICTIVE MAINTENANCE REPORT')) {
          pdf.setFontSize(12); // Reduced from 16 to fit page
          pdf.setFont('courier', 'bold');
          pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        } else if (line.includes('EXECUTIVE SUMMARY') || 
                  line.includes('MACHINE DETAILS') ||
                  line.includes('RECOMMENDATIONS') ||
                  line.includes('ALERTS SUMMARY')) {
          pdf.setFontSize(11); // Reduced from 14 to fit page
          pdf.setFont('courier', 'bold');
          pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        } else if (line.includes('Machine:') || line.includes('Report Title:') || line.includes('Generated:') || line.includes('Period:')) {
          pdf.setFontSize(12); // Increased from 9
          pdf.setFont('courier', 'bold');
          pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
        } else if (line.includes('•')) {
          pdf.setFontSize(11); // Increased from 9
          pdf.setFont('courier', 'normal');
          pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
        } else {
          pdf.setFontSize(11); // Increased from 9
          pdf.setFont('courier', 'normal');
          pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
        }
        
        // Calculate centered position for the line
        let textX = margin;
        let centered = false;
        
        // Center specific lines with proper boundary checking
        if (line.includes('INDUSTRIAL AI PREDICTIVE MAINTENANCE REPORT') ||
            line.includes('EXECUTIVE SUMMARY') ||
            line.includes('MACHINE DETAILS') ||
            line.includes('RECOMMENDATIONS') ||
            line.includes('ALERTS SUMMARY')) {
          const textWidth = pdf.getTextWidth(line);
          const availableWidth = pageWidth - 2 * margin;
          
          // If text is too wide, use center alignment with boundary protection
          if (textWidth > availableWidth) {
            centered = true;
          } else {
            textX = (pageWidth - textWidth) / 2;
            centered = true;
          }
        }
        
        // Add the line to PDF
        if (centered) {
          pdf.text(line, pageWidth / 2, yPosition, { align: 'center' });
        } else {
          pdf.text(line, textX, yPosition);
        }
        yPosition += lineHeight;
      });

      // Footer - centered
      const footerY = pageHeight - 25;
      pdf.setFontSize(10); // Increased from 8
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.setFont('courier', 'normal');
      
      const footerText1 = 'Generated by Industrial AI Predictive Maintenance System';
      const footerText2 = 'For questions, contact maintenance leadership team';
      
      const footerText1Width = pdf.getTextWidth(footerText1);
      const footerText2Width = pdf.getTextWidth(footerText2);
      
      pdf.text(footerText1, (pageWidth - footerText1Width) / 2, footerY);
      pdf.text(footerText2, (pageWidth - footerText2Width) / 2, footerY + 8);

      // Save the PDF with proper filename
      const filename = `${report.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text file
      this.generateTextFile(report);
    }
  }

  // Generate the exact text content format requested by user
  private static generateTextReportContent(data: any): string {
    // Get real-time data
    const machines = sensorSimulator.getMachineStates();
    const predictions = aiPredictionPipeline.getAllPredictions();
    const criticalAlerts = aiPredictionPipeline.getCriticalAlerts();
    
    // Calculate real summary
    const summary = {
      totalMachines: machines.length,
      averageHealth: Math.round(machines.reduce((sum, m) => sum + m.health, 0) / machines.length),
      averageRUL: Math.round(predictions.reduce((sum, p) => sum + p.rulHours, 0) / predictions.length),
      criticalAlerts: criticalAlerts.length,
      totalAnomalies: predictions.reduce((sum, p) => sum + (p.anomalyScore > 0.5 ? 1 : 0), 0),
      averageEfficiency: Math.round(predictions.reduce((sum, p) => sum + p.efficiency, 0) / predictions.length)
    };

    let content = `
================================================================================
                    INDUSTRIAL AI PREDICTIVE MAINTENANCE REPORT
================================================================================

Report Title:    ${data.title}
Generated:        ${new Date(data.generatedAt).toLocaleString()}
Period:           ${data.period}

================================================================================
                              EXECUTIVE SUMMARY
================================================================================

Total Machines:           ${summary.totalMachines}
Average Health:           ${summary.averageHealth}%
Average RUL:             ${summary.averageRUL} hours
Critical Alerts:          ${summary.criticalAlerts}
Total Anomalies:          ${summary.totalAnomalies}
Average Efficiency:        ${summary.averageEfficiency}%

================================================================================
                              MACHINE DETAILS
================================================================================

`;

    // Add machine details with real sensor data
    machines.forEach(machine => {
      const prediction = predictions.find(p => p.machineId === machine.id);
      const latestReading = sensorSimulator.getLatestSensorReading(machine.id);
      
      content += `
--------------------------------------------------------------------------------
Machine: ${machine.name} (${machine.id})
--------------------------------------------------------------------------------
Area:                    ${this.getMachineArea(machine.type)}
Health Score:             ${Math.round(machine.health)}%
Remaining Useful Life:      ${Math.round(prediction?.rulHours || machine.rul)} hours
Operational State:        ${machine.operationalState}
Efficiency:              ${Math.round(prediction?.efficiency || 0)}%
Performance Score:        ${Math.round(prediction?.performanceScore || 0)}%
Anomaly Score:           ${Math.round(prediction?.anomalyScore || 0)}
Maintenance Urgency:     ${prediction?.maintenanceUrgency || 'low'}

Latest Sensor Readings:
  Temperature:     ${latestReading?.temperature || 0}°C
  Vibration:       ${latestReading?.vibration || 0} mm/s
  Pressure:         ${latestReading?.pressure || 0} bar
  Load:             ${latestReading?.load || 0}%
  Current:          ${latestReading?.current || 0} A
  Voltage:          ${latestReading?.voltage || 0} V
  RPM:              ${latestReading?.rpm || 0}
  Flow Rate:        ${latestReading?.flowRate || 0} L/min
  Power Consumption: ${latestReading?.powerConsumption || 0} kW

Predicted Failures:
${(prediction?.predictedFailures || []).map(f => 
  `  • ${f.type} in ${f.component} component\n` +
  `    Confidence: ${f.confidence}%\n` +
  `    Estimated Time: ${f.estimatedTime} hours\n` +
  `    Severity: ${f.severity}`
).join('\n') || 'No predicted failures'}
`;
    });

    // Add recommendations
    content += `

================================================================================
                            RECOMMENDATIONS
================================================================================

`;

    const recommendations = this.generateRecommendations(machines, predictions);
    recommendations.forEach(rec => {
      content += `• ${rec}\n`;
    });

    // Add alerts summary
    content += `

================================================================================
                              ALERTS SUMMARY
================================================================================

`;

    if (criticalAlerts.length > 0) {
      criticalAlerts.forEach(alert => {
        content += `${alert.machineId.replace('MACHINE_', 'Machine ')} - ${alert.maintenanceUrgency} Priority: ${alert.predictedFailures[0]?.description || 'Performance degradation detected'}\n`;
        content += `  Time: ${new Date(alert.timestamp).toLocaleString()}\n`;
        content += `  Component: ${alert.predictedFailures[0]?.component || 'system'}\n`;
        content += `  Confidence: ${alert.predictedFailures[0]?.confidence || 0}%\n`;
        content += `  Estimated Failure: ${alert.predictedFailures[0]?.estimatedTime || 0} hours\n\n`;
      });
    } else {
      content += 'No critical alerts at this time.\n';
    }

    content += `

================================================================================
Report generated by Industrial AI Predictive Maintenance System
For questions, contact maintenance leadership team
================================================================================`;

    return content;
  }

  private static generateRealPDF(report: GeneratedReport): void {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Colors
      const colors = {
        primary: [41, 128, 185],      // Blue
        success: [39, 174, 96],       // Green
        warning: [241, 196, 15],      // Yellow
        danger: [231, 76, 60],        // Red
        dark: [44, 62, 80],           // Dark blue
        light: [236, 240, 241]        // Light gray
      };

      // Helper function to add border
      const addBorder = (x: number, y: number, width: number, height: number, color: number[] = colors.dark) => {
        pdf.setDrawColor(color[0], color[1], color[2]);
        pdf.setLineWidth(0.5);
        pdf.rect(x, y, width, height);
      };

      // Helper function to add colored background
      const addBackground = (x: number, y: number, width: number, height: number, color: number[] = colors.light) => {
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(x, y, width, height, 'F');
      };

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number = 12, fontStyle: string = 'normal', color: number[] = colors.dark) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        pdf.setTextColor(color[0], color[1], color[2]);
        
        const lines = pdf.splitTextToSize(text, contentWidth, { fontSize } as any);
        
        if (yPosition + lines.length * fontSize * 0.35 > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        lines.forEach((line: any) => {
          pdf.text(line, margin, yPosition);
          yPosition += fontSize * 0.35;
        });
        
        return yPosition;
      };

      // Helper function to add centered text
      const addCenteredText = (text: string, fontSize: number = 12, fontStyle: string = 'normal', color: number[] = colors.dark) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        pdf.setTextColor(color[0], color[1], color[2]);
        
        const textWidth = pdf.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        
        pdf.text(text, x, yPosition);
        yPosition += fontSize * 0.5;
        
        return yPosition;
      };

      // Helper function to draw simple bar chart
      const drawBarChart = (data: { label: string; value: number; color: number[] }[], title: string) => {
        const chartHeight = 40;
        const chartWidth = contentWidth;
        const barWidth = chartWidth / (data.length * 2);
        const maxValue = Math.max(...data.map(d => d.value));
        
        // Title
        addText(title, 10, 'bold');
        yPosition += 5;
        
        // Chart background
        addBackground(margin, yPosition, chartWidth, chartHeight, colors.light);
        addBorder(margin, yPosition, chartWidth, chartHeight);
        
        // Draw bars
        data.forEach((item, index) => {
          const barHeight = (item.value / maxValue) * (chartHeight - 10);
          const x = margin + (index * 2 * barWidth) + barWidth / 2;
          const y = yPosition + chartHeight - barHeight - 5;
          
          pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
          pdf.rect(x, y, barWidth, barHeight, 'F');
          
          // Label
          pdf.setFontSize(8);
          pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
          pdf.text(item.label, x + barWidth / 2 - (pdf.getTextWidth(item.label) / 2), yPosition + chartHeight - 2);
          
          // Value
          pdf.text(item.value.toString(), x + barWidth / 2 - (pdf.getTextWidth(item.value.toString()) / 2), y - 3);
        });
        
        yPosition += chartHeight + 10;
        return yPosition;
      };

      // Helper function to draw line chart
      const drawLineChart = (data: { x: string; y: number }[], title: string) => {
        const chartHeight = 40;
        const chartWidth = contentWidth;
        const pointRadius = 2;
        
        // Title
        addText(title, 10, 'bold');
        yPosition += 5;
        
        // Chart background
        addBackground(margin, yPosition, chartWidth, chartHeight, colors.light);
        addBorder(margin, yPosition, chartWidth, chartHeight);
        
        const maxValue = Math.max(...data.map(d => d.y));
        const xStep = chartWidth / (data.length - 1);
        
        // Draw grid lines
        pdf.setDrawColor(colors.light[0], colors.light[1], colors.light[2]);
        pdf.setLineWidth(0.2);
        for (let i = 0; i <= 4; i++) {
          const y = yPosition + (chartHeight * i / 4);
          pdf.line(margin, y, margin + chartWidth, y);
        }
        
        // Draw line
        pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        pdf.setLineWidth(1.5);
        
        data.forEach((point, index) => {
          const x = margin + index * xStep;
          const y = yPosition + chartHeight - (point.y / maxValue) * (chartHeight - 10) - 5;
          
          if (index === 0) {
            pdf.line(x, y, x, y);
          } else {
            const prevX = margin + (index - 1) * xStep;
            const prevY = yPosition + chartHeight - (data[index - 1].y / maxValue) * (chartHeight - 10) - 5;
            pdf.line(prevX, prevY, x, y);
          }
          
          // Draw point
          pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
          pdf.circle(x, y, pointRadius, 'F');
          
          // Label
          if (index % Math.ceil(data.length / 5) === 0) {
            pdf.setFontSize(8);
            pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
            pdf.text(point.x, x - (pdf.getTextWidth(point.x) / 2), yPosition + chartHeight - 2);
          }
        });
        
        yPosition += chartHeight + 10;
        return yPosition;
      };

      // Header with border
      addBackground(margin - 5, margin - 5, contentWidth + 10, 30, colors.primary);
      addBorder(margin - 5, margin - 5, contentWidth + 10, 30, colors.primary);
      
      // Title
      yPosition = margin + 10;
      addCenteredText(report.data.title, 18, 'bold', [255, 255, 255]);
      addCenteredText(`Generated: ${new Date(report.data.generatedAt).toLocaleString()} | Period: ${report.data.period}`, 10, 'normal', [255, 255, 255]);
      
      yPosition += 20;

      // Executive Summary Section
      addBackground(margin, yPosition, contentWidth, 8, colors.light);
      addBorder(margin, yPosition, contentWidth, 8, colors.primary);
      addText('EXECUTIVE SUMMARY', 12, 'bold', colors.primary);
      yPosition += 12;
      
      const summary = report.data.summary;
      
      // Summary metrics with colored backgrounds
      const metrics = [
        { label: 'Total Machines', value: summary.totalMachines, color: colors.primary },
        { label: 'Avg Health', value: `${summary.averageHealth}%`, color: summary.averageHealth > 70 ? colors.success : summary.averageHealth > 40 ? colors.warning : colors.danger },
        { label: 'Avg RUL', value: `${summary.averageRUL}h`, color: colors.primary },
        { label: 'Critical Alerts', value: summary.criticalAlerts, color: summary.criticalAlerts > 0 ? colors.danger : colors.success },
        { label: 'Anomalies', value: summary.totalAnomalies, color: colors.warning },
        { label: 'Avg Efficiency', value: `${summary.averageEfficiency}%`, color: colors.success }
      ];
      
      // Create metric boxes
      const boxWidth = contentWidth / 3;
      const boxHeight = 25;
      let boxY = yPosition;
      
      metrics.forEach((metric, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const x = margin + col * boxWidth;
        const y = boxY + row * (boxHeight + 5);
        
        addBackground(x, y, boxWidth - 2, boxHeight, colors.light);
        addBorder(x, y, boxWidth - 2, boxHeight, metric.color);
        
        pdf.setFontSize(9);
        pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
        pdf.text(metric.label, x + 5, y + 10);
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
        pdf.text(metric.value, x + 5, y + 20);
      });
      
      yPosition += Math.ceil(metrics.length / 3) * (boxHeight + 5) + 10;

      // Health Distribution Chart
      const healthData = [
        { label: 'Good', value: report.data.machines.filter((m: any) => m.health > 70).length, color: colors.success },
        { label: 'Warning', value: report.data.machines.filter((m: any) => m.health > 40 && m.health <= 70).length, color: colors.warning },
        { label: 'Critical', value: report.data.machines.filter((m: any) => m.health <= 40).length, color: colors.danger }
      ];
      
      drawBarChart(healthData, 'Machine Health Distribution');

      // Efficiency Trend Chart
      const trendData = report.data.trends.map((trend: any) => ({
        x: trend.date.split('/')[0],
        y: trend.averageEfficiency
      }));
      
      drawLineChart(trendData, 'Efficiency Trend (Last 7 Days)');

      // Machine Details Section
      addBackground(margin, yPosition, contentWidth, 8, colors.light);
      addBorder(margin, yPosition, contentWidth, 8, colors.primary);
      addText('MACHINE DETAILS', 12, 'bold', colors.primary);
      yPosition += 12;

      report.data.machines.forEach((machine: any, index: number) => {
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = margin;
          
          // Repeat header on new page
          addBackground(margin - 5, margin - 5, contentWidth + 10, 30, colors.primary);
          addBorder(margin - 5, margin - 5, contentWidth + 10, 30, colors.primary);
          yPosition = margin + 10;
          addCenteredText(report.data.title + ' (Continued)', 18, 'bold', [255, 255, 255]);
          yPosition += 25;
        }

        // Machine card with border
        const cardHeight = 45;
        addBackground(margin, yPosition, contentWidth, cardHeight, colors.light);
        addBorder(margin, yPosition, contentWidth, cardHeight, 
          machine.health > 70 ? colors.success : machine.health > 40 ? colors.warning : colors.danger);
        
        // Machine info
        addText(`${machine.name} (${machine.id})`, 11, 'bold');
        
        const infoY = yPosition;
        yPosition += 8;
        
        // Two column layout
        const col1X = margin;
        const col2X = margin + contentWidth / 2;
        
        pdf.setFontSize(9);
        pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
        
        // Column 1
        pdf.text(`Area: ${machine.area}`, col1X, yPosition);
        yPosition += 4;
        pdf.text(`Health: ${machine.health}%`, col1X, yPosition);
        yPosition += 4;
        pdf.text(`RUL: ${machine.rul}h`, col1X, yPosition);
        yPosition += 4;
        pdf.text(`State: ${machine.operationalState}`, col1X, yPosition);
        
        // Column 2
        yPosition = infoY + 8;
        pdf.text(`Efficiency: ${machine.efficiency}%`, col2X, yPosition);
        yPosition += 4;
        pdf.text(`Temperature: ${machine.latestSensorData.temperature}°C`, col2X, yPosition);
        yPosition += 4;
        pdf.text(`Power: ${machine.latestSensorData.powerConsumption}kW`, col2X, yPosition);
        yPosition += 4;
        pdf.text(`Urgency: ${machine.maintenanceUrgency}`, col2X, yPosition);
        
        yPosition = infoY + cardHeight + 5;
      });

      // Recommendations Section
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }
      
      addBackground(margin, yPosition, contentWidth, 8, colors.light);
      addBorder(margin, yPosition, contentWidth, 8, colors.primary);
      addText('RECOMMENDATIONS', 12, 'bold', colors.primary);
      yPosition += 12;
      
      report.data.recommendations.forEach((rec: any, index: number) => {
        const recHeight = 8;
        addBackground(margin, yPosition, contentWidth, recHeight, colors.light);
        addBorder(margin, yPosition, contentWidth, recHeight, colors.success);
        
        pdf.setFontSize(10);
        pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
        pdf.text(`${index + 1}. ${rec}`, margin + 5, yPosition + 5);
        
        yPosition += recHeight + 3;
      });

      // Footer with border
      const footerY = pageHeight - 25;
      addBackground(margin, footerY, contentWidth, 20, colors.light);
      addBorder(margin, footerY, contentWidth, 20, colors.primary);
      
      pdf.setFontSize(9);
      pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      pdf.text('Generated by Industrial AI Predictive Maintenance System', margin, footerY + 8);
      pdf.text('For questions, contact maintenance leadership team', margin, footerY + 15);
      
      pdf.setFontSize(8);
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.text(`Page 1`, pageWidth - margin - 15, footerY + 8);

      // Save the PDF
      pdf.save(`${report.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text file
      this.generateTextFile(report);
    }
  }

  private static generateCSV(report: GeneratedReport): void {
    const content = this.generateCSVContent(report.data);
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private static generateJSON(report: GeneratedReport): void {
    const content = JSON.stringify(report.data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private static generateTextFile(report: GeneratedReport): void {
    const content = this.generateFormattedReport(report.data);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private static generateFormattedReport(data: ReportData): string {
    return `
================================================================================
                    INDUSTRIAL AI PREDICTIVE MAINTENANCE REPORT
================================================================================

Report Title:    ${data.title}
Generated:        ${new Date(data.generatedAt).toLocaleString()}
Period:           ${data.period}

================================================================================
                              EXECUTIVE SUMMARY
================================================================================

Total Machines:           ${data.summary.totalMachines}
Average Health:           ${data.summary.averageHealth}%
Average RUL:             ${data.summary.averageRUL} hours
Critical Alerts:          ${data.summary.criticalAlerts}
Total Anomalies:          ${data.summary.totalAnomalies}
Average Efficiency:        ${data.summary.averageEfficiency}%

================================================================================
                              MACHINE DETAILS
================================================================================

${data.machines.map(machine => `
--------------------------------------------------------------------------------
Machine: ${machine.name} (${machine.id})
--------------------------------------------------------------------------------
Area:                    ${machine.area}
Health Score:             ${machine.health}%
Remaining Useful Life:      ${machine.rul} hours
Operational State:        ${machine.operationalState}
Efficiency:              ${machine.efficiency}%
Performance Score:        ${machine.performanceScore}%
Anomaly Score:           ${machine.anomalyScore}
Maintenance Urgency:     ${machine.maintenanceUrgency}

Latest Sensor Readings:
  Temperature:     ${machine.latestSensorData.temperature}°C
  Vibration:       ${machine.latestSensorData.vibration} mm/s
  Pressure:         ${machine.latestSensorData.pressure} bar
  Load:             ${machine.latestSensorData.load}%
  Current:          ${machine.latestSensorData.current} A
  Voltage:          ${machine.latestSensorData.voltage} V
  RPM:              ${machine.latestSensorData.rpm}
  Flow Rate:        ${machine.latestSensorData.flowRate} L/min
  Power Consumption: ${machine.latestSensorData.powerConsumption} kW

Predicted Failures:
${machine.predictedFailures.map(f => 
  `  • ${f.type} in ${f.component} component\n` +
  `    Confidence: ${f.confidence}%\n` +
  `    Estimated Time: ${f.estimatedTime} hours\n` +
  `    Severity: ${f.severity}`
).join('\n')}
`).join('\n')}

================================================================================
                            RECOMMENDATIONS
================================================================================

${data.recommendations.map(r => `• ${r}`).join('\n')}

================================================================================
                              ALERTS SUMMARY
================================================================================

${data.alerts.map(alert => 
  `${alert.machine} - ${alert.severity} Priority: ${alert.description}\n` +
  `  Time: ${alert.time}\n` +
  `  Component: ${alert.component}\n` +
  `  Confidence: ${alert.confidence}%\n` +
  `  Estimated Failure: ${alert.estimatedTime} hours`
).join('\n\n')}

================================================================================
Report generated by Industrial AI Predictive Maintenance System
For questions, contact maintenance leadership team
================================================================================
    `;
  }

  private static generateCSVContent(data: ReportData): string {
    const headers = [
      'Machine ID', 'Machine Name', 'Area', 'Health', 'RUL', 'State', 
      'Efficiency', 'Temperature', 'Vibration', 'Pressure', 'Load', 'Power'
    ];
    
    const rows = data.machines.map(machine => [
      machine.id,
      machine.name,
      machine.area,
      machine.health,
      machine.rul,
      machine.operationalState,
      machine.efficiency,
      machine.latestSensorData.temperature,
      machine.latestSensorData.vibration,
      machine.latestSensorData.pressure,
      machine.latestSensorData.load,
      machine.latestSensorData.powerConsumption
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Export for use in components
export const reportGenerator = ReportGenerator;
