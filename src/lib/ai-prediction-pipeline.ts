// AI Prediction Pipeline for Industrial Predictive Maintenance
// Integrates with sensor simulator to provide real-time predictions

import { SensorReading, MachineState, sensorSimulator } from './industrial-sensor-simulator';

export interface AIPrediction {
  machineId: string;
  timestamp: number;
  healthScore: number;        // 0-100
  rulHours: number;          // Remaining Useful Life
  failureProbability: number; // 0-1
  predictedFailures: PredictedFailure[];
  performanceScore: number;   // 0-100
  efficiency: number;         // 0-100
  maintenanceUrgency: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  anomalyScore: number;       // 0-1
  trendAnalysis: TrendAnalysis;
}

export interface PredictedFailure {
  type: string;
  component: string;
  estimatedTime: number;     // Hours until failure
  confidence: number;         // 0-100
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface TrendAnalysis {
  healthTrend: 'improving' | 'stable' | 'declining';
  performanceTrend: 'improving' | 'stable' | 'declining';
  keyIndicators: {
    temperature: 'normal' | 'elevated' | 'critical';
    vibration: 'normal' | 'elevated' | 'critical';
    load: 'normal' | 'high' | 'overload';
  };
}

export class AIPredictionPipeline {
  private predictions: Map<string, AIPrediction> = new Map();
  private modelUpdateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 2000; // Update predictions every 2 seconds

  constructor() {
    this.startPredictionPipeline();
  }

  private calculateHealthScore(machine: MachineState, reading: SensorReading): number {
    let healthScore = machine.health;

    // Factor in current sensor readings
    const tempFactor = Math.max(0, 100 - Math.max(0, reading.temperature - 60) * 2);
    const vibrationFactor = Math.max(0, 100 - Math.max(0, reading.vibration - 2) * 15);
    const loadFactor = Math.max(0, 100 - Math.max(0, reading.load - 70) * 1.5);

    // Weighted average
    healthScore = (healthScore * 0.4 + tempFactor * 0.25 + vibrationFactor * 0.25 + loadFactor * 0.1);

    // Consider recent trends
    const recentReadings = sensorSimulator.getSensorHistory(machine.id, 10);
    if (recentReadings.length >= 5) {
      const recentVibration = recentReadings.slice(-5).reduce((sum, r) => sum + r.vibration, 0) / 5;
      const olderVibration = recentReadings.slice(0, 5).reduce((sum, r) => sum + r.vibration, 0) / 5;
      
      if (recentVibration > olderVibration * 1.2) {
        healthScore -= 5; // Declining trend
      } else if (recentVibration < olderVibration * 0.8) {
        healthScore += 3; // Improving trend
      }
    }

    return Math.max(0, Math.min(100, healthScore));
  }

  private calculateRUL(machine: MachineState, healthScore: number): number {
    const baseRUL = machine.rul;
    const healthMultiplier = healthScore / 100;
    const operationalMultiplier = this.getOperationalMultiplier(machine.operationalState);
    
    // Adjust RUL based on current health and operational state
    let adjustedRUL = baseRUL * healthMultiplier * operationalMultiplier;

    // Factor in current load and stress
    const latestReading = sensorSimulator.getLatestSensorReading(machine.id);
    if (latestReading) {
      if (latestReading.load > 85) adjustedRUL *= 0.7;
      if (latestReading.vibration > 4) adjustedRUL *= 0.8;
      if (latestReading.temperature > 90) adjustedRUL *= 0.85;
    }

    return Math.max(0, adjustedRUL);
  }

  private getOperationalMultiplier(state: MachineState['operationalState']): number {
    switch (state) {
      case 'idle': return 1.2;
      case 'startup': return 1.0;
      case 'active': return 0.9;
      case 'overload': return 0.5;
      case 'warning': return 0.7;
      case 'failure': return 0.3;
      default: return 1.0;
    }
  }

  private calculateFailureProbability(machine: MachineState, healthScore: number, rul: number): number {
    let probability = 0;

    // Base probability from health score
    if (healthScore < 30) probability += 0.4;
    else if (healthScore < 50) probability += 0.2;
    else if (healthScore < 70) probability += 0.1;

    // RUL factor
    if (rul < 10) probability += 0.3;
    else if (rul < 24) probability += 0.15;
    else if (rul < 48) probability += 0.05;

    // Operational state factor
    if (machine.operationalState === 'overload') probability += 0.2;
    if (machine.operationalState === 'warning') probability += 0.15;
    if (machine.operationalState === 'failure') probability += 0.5;

    // Anomaly probability
    probability += machine.anomalyProbability * 0.3;

    return Math.min(1, probability);
  }

  private generatePredictedFailures(machine: MachineState, failureProb: number): PredictedFailure[] {
    const failures: PredictedFailure[] = [];
    const reading = sensorSimulator.getLatestSensorReading(machine.id);
    
    if (!reading || failureProb < 0.1) return failures;

    // Temperature-related failure
    if (reading.temperature > 85) {
      failures.push({
        type: 'thermal_failure',
        component: 'bearing',
        estimatedTime: Math.max(2, 24 * (1 - failureProb)),
        confidence: Math.min(95, 50 + failureProb * 100),
        severity: reading.temperature > 100 ? 'critical' : 'high',
        description: 'Elevated temperature indicates potential bearing failure'
      });
    }

    // Vibration-related failure
    if (reading.vibration > 3.5) {
      failures.push({
        type: 'mechanical_failure',
        component: 'shaft',
        estimatedTime: Math.max(4, 48 * (1 - failureProb)),
        confidence: Math.min(90, 45 + failureProb * 90),
        severity: reading.vibration > 6 ? 'critical' : reading.vibration > 4.5 ? 'high' : 'medium',
        description: 'High vibration levels suggest mechanical stress on shaft assembly'
      });
    }

    // Load-related failure
    if (reading.load > 85) {
      failures.push({
        type: 'overload_failure',
        component: 'motor',
        estimatedTime: Math.max(1, 12 * (1 - failureProb)),
        confidence: Math.min(85, 40 + failureProb * 85),
        severity: reading.load > 95 ? 'critical' : 'high',
        description: 'Sustained overload conditions may cause motor failure'
      });
    }

    return failures;
  }

  private calculatePerformanceScore(machine: MachineState, reading: SensorReading): number {
    let score = 100;

    // Efficiency factors
    const loadEfficiency = reading.load > 20 && reading.load < 80 ? 100 : Math.max(0, 100 - Math.abs(reading.load - 50) * 2);
    const tempEfficiency = Math.max(0, 100 - Math.max(0, reading.temperature - 70) * 3);
    const vibrationEfficiency = Math.max(0, 100 - reading.vibration * 10);

    // Weighted calculation
    score = (loadEfficiency * 0.4 + tempEfficiency * 0.3 + vibrationEfficiency * 0.3);

    // Health factor
    score = score * (machine.health / 100);

    return Math.max(0, Math.min(100, score));
  }

  private calculateEfficiency(machine: MachineState, reading: SensorReading): number {
    // Power efficiency calculation
    const expectedPower = this.getExpectedPowerConsumption(machine.type, reading.load);
    const actualPower = reading.powerConsumption;
    const efficiency = expectedPower > 0 ? Math.min(100, (expectedPower / actualPower) * 100) : 0;

    // Adjust for machine health
    return efficiency * (machine.health / 100);
  }

  private getExpectedPowerConsumption(machineType: MachineState['type'], load: number): number {
    const basePower = {
      hydrapulper: 15,
      digester: 25,
      screen: 12,
      dryer: 20,
      calender: 8,
      paper_machine: 32
    };

    return basePower[machineType] * (load / 100);
  }

  private determineMaintenanceUrgency(failureProb: number, rul: number, healthScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (failureProb > 0.7 || rul < 6 || healthScore < 25) return 'critical';
    if (failureProb > 0.4 || rul < 12 || healthScore < 40) return 'high';
    if (failureProb > 0.2 || rul < 24 || healthScore < 60) return 'medium';
    return 'low';
  }

  private generateRecommendations(machine: MachineState, prediction: AIPrediction): string[] {
    const recommendations: string[] = [];
    const reading = sensorSimulator.getLatestSensorReading(machine.id);

    if (!reading) return recommendations;

    // Temperature recommendations
    if (reading.temperature > 85) {
      recommendations.push('Check cooling system and lubrication');
      if (reading.temperature > 95) {
        recommendations.push('Immediate inspection required - risk of thermal damage');
      }
    }

    // Vibration recommendations
    if (reading.vibration > 3.5) {
      recommendations.push('Inspect bearings and alignment');
      if (reading.vibration > 5) {
        recommendations.push('Schedule immediate maintenance - high vibration detected');
      }
    }

    // Load recommendations
    if (reading.load > 85) {
      recommendations.push('Reduce operational load to prevent overload');
    }

    // RUL recommendations
    if (prediction.rulHours < 24) {
      recommendations.push('Plan replacement within 24 hours');
    } else if (prediction.rulHours < 48) {
      recommendations.push('Schedule maintenance within 48 hours');
    }

    // Health recommendations
    if (prediction.healthScore < 50) {
      recommendations.push('Comprehensive health assessment recommended');
    }

    return recommendations;
  }

  private calculateAnomalyScore(machine: MachineState, reading: SensorReading): number {
    let score = machine.anomalyProbability;

    // Deviation from normal patterns
    const normalRanges = {
      temperature: { min: 60, max: 85 },
      vibration: { min: 1, max: 3.5 },
      pressure: { min: 0.8, max: 2.5 },
      load: { min: 20, max: 80 }
    };

    Object.entries(normalRanges).forEach(([key, range]) => {
      const value = reading[key as keyof SensorReading] as number;
      if (value < range.min || value > range.max) {
        score += 0.2;
      }
    });

    return Math.min(1, score);
  }

  private analyzeTrends(machine: MachineState): TrendAnalysis {
    const history = sensorSimulator.getSensorHistory(machine.id, 20);
    const reading = sensorSimulator.getLatestSensorReading(machine.id);

    if (!reading || history.length < 10) {
      return {
        healthTrend: 'stable',
        performanceTrend: 'stable',
        keyIndicators: {
          temperature: 'normal',
          vibration: 'normal',
          load: 'normal'
        }
      };
    }

    // Analyze health trend
    const recentHealth = history.slice(-5).reduce((sum, r) => sum + r.temperature, 0) / 5;
    const olderHealth = history.slice(0, 5).reduce((sum, r) => sum + r.temperature, 0) / 5;
    const healthTrend = recentHealth > olderHealth * 1.1 ? 'declining' : recentHealth < olderHealth * 0.9 ? 'improving' : 'stable';

    // Analyze performance trend
    const recentPerf = history.slice(-5).reduce((sum, r) => sum + r.vibration, 0) / 5;
    const olderPerf = history.slice(0, 5).reduce((sum, r) => sum + r.vibration, 0) / 5;
    const performanceTrend = recentPerf > olderPerf * 1.1 ? 'declining' : recentPerf < olderPerf * 0.9 ? 'improving' : 'stable';

    // Key indicators
    const keyIndicators = {
      temperature: (reading.temperature > 95 ? 'critical' : reading.temperature > 85 ? 'elevated' : 'normal') as 'critical' | 'normal' | 'elevated',
      vibration: (reading.vibration > 5 ? 'critical' : reading.vibration > 3.5 ? 'elevated' : 'normal') as 'critical' | 'normal' | 'elevated',
      load: (reading.load > 90 ? 'overload' : reading.load > 80 ? 'high' : 'normal') as 'high' | 'normal' | 'overload'
    };

    return {
      healthTrend: healthTrend as 'improving' | 'stable' | 'declining',
      performanceTrend: performanceTrend as 'improving' | 'stable' | 'declining',
      keyIndicators
    };
  }

  private updatePredictions() {
    const machines = sensorSimulator.getMachineStates();

    machines.forEach(machine => {
      const reading = sensorSimulator.getLatestSensorReading(machine.id);
      if (!reading) return;

      const healthScore = this.calculateHealthScore(machine, reading);
      const rul = this.calculateRUL(machine, healthScore);
      const failureProb = this.calculateFailureProbability(machine, healthScore, rul);
      const predictedFailures = this.generatePredictedFailures(machine, failureProb);
      const performanceScore = this.calculatePerformanceScore(machine, reading);
      const efficiency = this.calculateEfficiency(machine, reading);
      const maintenanceUrgency = this.determineMaintenanceUrgency(failureProb, rul, healthScore);
      const recommendations = this.generateRecommendations(machine, { machineId: machine.id, failureProbability: failureProb } as AIPrediction);
      const anomalyScore = this.calculateAnomalyScore(machine, reading);
      const trendAnalysis = this.analyzeTrends(machine);

      const prediction: AIPrediction = {
        machineId: machine.id,
        timestamp: Date.now(),
        healthScore,
        rulHours: rul,
        failureProbability: failureProb,
        predictedFailures,
        performanceScore,
        efficiency,
        maintenanceUrgency,
        recommendations,
        anomalyScore,
        trendAnalysis
      };

      this.predictions.set(machine.id, prediction);
    });
  }

  public startPredictionPipeline() {
    if (this.modelUpdateInterval) {
      clearInterval(this.modelUpdateInterval);
    }

    this.modelUpdateInterval = setInterval(() => {
      this.updatePredictions();
    }, this.UPDATE_INTERVAL);
  }

  public stopPredictionPipeline() {
    if (this.modelUpdateInterval) {
      clearInterval(this.modelUpdateInterval);
      this.modelUpdateInterval = null;
    }
  }

  public getPrediction(machineId: string): AIPrediction | undefined {
    return this.predictions.get(machineId);
  }

  public getAllPredictions(): AIPrediction[] {
    return Array.from(this.predictions.values());
  }

  public getCriticalAlerts(): AIPrediction[] {
    return Array.from(this.predictions.values()).filter(
      p => p.maintenanceUrgency === 'critical' || p.failureProbability > 0.7
    );
  }

  public getHighPriorityAlerts(): AIPrediction[] {
    return Array.from(this.predictions.values()).filter(
      p => p.maintenanceUrgency === 'high' || p.failureProbability > 0.4
    );
  }
}

// Global instance
export const aiPredictionPipeline = new AIPredictionPipeline();
