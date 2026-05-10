// Industrial Machine Sensor Simulator
// Simulates realistic industrial machine behavior with correlated sensor patterns

export interface SensorReading {
  timestamp: number;
  temperature: number;      // °C
  vibration: number;        // mm/s
  pressure: number;         // bar
  rpm: number;             // RPM
  current: number;         // Amperes
  voltage: number;         // Volts
  load: number;            // %
  flowRate: number;        // L/min
  powerConsumption: number; // kW
}

export interface MachineState {
  id: string;
  name: string;
  type: 'hydrapulper' | 'digester' | 'screen' | 'dryer' | 'calender' | 'paper_machine';
  operationalState: 'idle' | 'startup' | 'active' | 'overload' | 'warning' | 'failure';
  health: number;          // 0-100
  rul: number;            // Remaining Useful Life in hours
  cumulativeOperatingHours: number;
  lastMaintenanceHours: number;
  sensorHistory: SensorReading[];
  anomalyProbability: number;
}

export class IndustrialSensorSimulator {
  private machines: Map<string, MachineState>;
  private simulationInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 1000; // 1 second updates
  private readonly SENSOR_NOISE_FACTOR = 0.02; // 2% noise

  constructor() {
    this.machines = new Map();
    this.initializeMachines();
  }

  private initializeMachines() {
    const machineConfigs = [
      {
        id: 'MACHINE_01',
        name: 'Hydrapulper HC-2000',
        type: 'hydrapulper' as const,
        baseTemp: 65,
        baseVibration: 1.8,
        basePressure: 1.2,
        baseRPM: 1800,
        baseCurrent: 45,
        baseVoltage: 380
      },
      {
        id: 'MACHINE_02',
        name: 'Continuous Digester CD-1200',
        type: 'digester' as const,
        baseTemp: 85,
        baseVibration: 2.2,
        basePressure: 2.5,
        baseRPM: 1200,
        baseCurrent: 65,
        baseVoltage: 380
      },
      {
        id: 'MACHINE_03',
        name: 'Pressure Screen PS-800',
        type: 'screen' as const,
        baseTemp: 70,
        baseVibration: 3.5,
        basePressure: 1.8,
        baseRPM: 2400,
        baseCurrent: 35,
        baseVoltage: 380
      },
      {
        id: 'MACHINE_07',
        name: 'Dryer Cylinders DC-600',
        type: 'dryer' as const,
        baseTemp: 95,
        baseVibration: 2.8,
        basePressure: 0.8,
        baseRPM: 900,
        baseCurrent: 55,
        baseVoltage: 380
      },
      {
        id: 'MACHINE_12',
        name: 'Soft Calender SC-500',
        type: 'calender' as const,
        baseTemp: 60,
        baseVibration: 1.5,
        basePressure: 1.0,
        baseRPM: 1500,
        baseCurrent: 25,
        baseVoltage: 380
      },
      {
        id: 'MACHINE_14',
        name: 'Paper Machine PM-1',
        type: 'paper_machine' as const,
        baseTemp: 75,
        baseVibration: 2.0,
        basePressure: 1.5,
        baseRPM: 2000,
        baseCurrent: 85,
        baseVoltage: 380
      }
    ];

    machineConfigs.forEach(config => {
      this.machines.set(config.id, {
        id: config.id,
        name: config.name,
        type: config.type,
        operationalState: 'idle',
        health: 85 + Math.random() * 15,
        rul: 100 + Math.random() * 200,
        cumulativeOperatingHours: Math.random() * 5000,
        lastMaintenanceHours: Math.random() * 500,
        sensorHistory: [],
        anomalyProbability: 0.05
      });
    });
  }

  private addNoise(value: number): number {
    return value * (1 + (Math.random() - 0.5) * 2 * this.SENSOR_NOISE_FACTOR);
  }

  private calculateLoadFactor(state: MachineState): number {
    switch (state.operationalState) {
      case 'idle': return 0.05 + Math.random() * 0.1;
      case 'startup': return 0.3 + Math.random() * 0.2;
      case 'active': return 0.6 + Math.random() * 0.3;
      case 'overload': return 0.9 + Math.random() * 0.1;
      case 'warning': return 0.4 + Math.random() * 0.3;
      case 'failure': return 0.1 + Math.random() * 0.2;
      default: return 0.5;
    }
  }

  private generateSensorReading(machine: MachineState): SensorReading {
    const loadFactor = this.calculateLoadFactor(machine);
    const healthFactor = machine.health / 100;
    const time = Date.now();
    
    // Machine-specific base values
    const baseValues = this.getBaseValues(machine.type);
    
    // Calculate sensor values with realistic correlations
    const temperature = this.addNoise(
      baseValues.baseTemp + 
      (loadFactor * 25) + // Temperature increases with load
      ((1 - healthFactor) * 15) + // Higher temp when health is poor
      Math.sin(time / 10000) * 2 // Slow oscillation
    );

    const vibration = this.addNoise(
      baseValues.baseVibration + 
      (loadFactor * 3) + // Vibration increases with load
      ((1 - healthFactor) * 2.5) + // Higher vibration when health is poor
      Math.sin(time / 2000) * 0.5 + // Faster oscillation
      (machine.operationalState === 'warning' ? 1.5 : 0) +
      (machine.operationalState === 'failure' ? 3 : 0)
    );

    const pressure = this.addNoise(
      baseValues.basePressure + 
      (loadFactor * 0.8) +
      Math.sin(time / 8000) * 0.1
    );

    const rpm = this.addNoise(
      baseValues.baseRPM * 
      (0.5 + loadFactor * 0.5) + // RPM varies with load
      Math.sin(time / 5000) * 50
    );

    const current = this.addNoise(
      baseValues.baseCurrent * 
      (0.3 + loadFactor * 0.7) + // Current proportional to load
      ((1 - healthFactor) * baseValues.baseCurrent * 0.2)
    );

    const voltage = this.addNoise(
      baseValues.baseVoltage + 
      (Math.random() - 0.5) * 10 // Small voltage fluctuations
    );

    const load = Math.round(loadFactor * 100);
    const flowRate = this.addNoise(loadFactor * 150 + Math.random() * 20);
    const powerConsumption = this.addNoise((current * voltage) / 1000);

    return {
      timestamp: time,
      temperature: Math.round(temperature * 10) / 10,
      vibration: Math.round(vibration * 10) / 10,
      pressure: Math.round(pressure * 10) / 10,
      rpm: Math.round(rpm),
      current: Math.round(current * 10) / 10,
      voltage: Math.round(voltage * 10) / 10,
      load,
      flowRate: Math.round(flowRate * 10) / 10,
      powerConsumption: Math.round(powerConsumption * 100) / 100
    };
  }

  private getBaseValues(type: MachineState['type']) {
    const baseValues = {
      hydrapulper: { baseTemp: 65, baseVibration: 1.8, basePressure: 1.2, baseRPM: 1800, baseCurrent: 45, baseVoltage: 380 },
      digester: { baseTemp: 85, baseVibration: 2.2, basePressure: 2.5, baseRPM: 1200, baseCurrent: 65, baseVoltage: 380 },
      screen: { baseTemp: 70, baseVibration: 3.5, basePressure: 1.8, baseRPM: 2400, baseCurrent: 35, baseVoltage: 380 },
      dryer: { baseTemp: 95, baseVibration: 2.8, basePressure: 0.8, baseRPM: 900, baseCurrent: 55, baseVoltage: 380 },
      calender: { baseTemp: 60, baseVibration: 1.5, basePressure: 1.0, baseRPM: 1500, baseCurrent: 25, baseVoltage: 380 },
      paper_machine: { baseTemp: 75, baseVibration: 2.0, basePressure: 1.5, baseRPM: 2000, baseCurrent: 85, baseVoltage: 380 }
    };
    return baseValues[type];
  }

  private updateMachineState(machine: MachineState, reading: SensorReading) {
    // Update operational hours
    if (machine.operationalState !== 'idle') {
      machine.cumulativeOperatingHours += this.UPDATE_INTERVAL / 3600000; // Convert to hours
    }

    // Update health based on sensor readings
    const healthImpact = this.calculateHealthImpact(reading);
    machine.health = Math.max(0, Math.min(100, machine.health - healthImpact));

    // Update RUL based on health and operational state
    const rulDecayRate = this.getRULDecayRate(machine);
    machine.rul = Math.max(0, machine.rul - rulDecayRate);

    // Update operational state based on conditions
    machine.operationalState = this.determineOperationalState(machine, reading);

    // Update anomaly probability
    machine.anomalyProbability = this.calculateAnomalyProbability(machine, reading);

    // Store sensor reading (keep last 100 readings)
    machine.sensorHistory.push(reading);
    if (machine.sensorHistory.length > 100) {
      machine.sensorHistory.shift();
    }
  }

  private calculateHealthImpact(reading: SensorReading): number {
    let impact = 0;
    
    // Temperature impact
    if (reading.temperature > 90) impact += 0.02;
    else if (reading.temperature > 80) impact += 0.01;
    
    // Vibration impact
    if (reading.vibration > 5) impact += 0.03;
    else if (reading.vibration > 3) impact += 0.015;
    
    // Load impact
    if (reading.load > 85) impact += 0.01;
    
    return impact;
  }

  private getRULDecayRate(machine: MachineState): number {
    const baseDecay = 0.01; // Base decay rate per second
    
    let multiplier = 1;
    if (machine.operationalState === 'overload') multiplier = 3;
    else if (machine.operationalState === 'warning') multiplier = 2;
    else if (machine.operationalState === 'failure') multiplier = 5;
    else if (machine.operationalState === 'idle') multiplier = 0.1;
    
    const healthMultiplier = 2 - (machine.health / 100); // Faster decay when health is poor
    
    return baseDecay * multiplier * healthMultiplier;
  }

  private determineOperationalState(machine: MachineState, reading: SensorReading): MachineState['operationalState'] {
    // Check for failure conditions
    if (reading.vibration > 8 || reading.temperature > 110 || machine.health < 20) {
      return 'failure';
    }
    
    // Check for warning conditions
    if (reading.vibration > 4 || reading.temperature > 95 || machine.health < 50 || machine.rul < 10) {
      return 'warning';
    }
    
    // Check for overload
    if (reading.load > 90) {
      return 'overload';
    }
    
    // Normal operational states
    if (reading.load > 20) {
      return 'active';
    } else if (reading.load > 5) {
      return 'startup';
    } else {
      return 'idle';
    }
  }

  private calculateAnomalyProbability(machine: MachineState, reading: SensorReading): number {
    let probability = 0.05; // Base probability
    
    // Increase probability based on sensor deviations
    if (reading.vibration > 4) probability += 0.3;
    if (reading.temperature > 90) probability += 0.2;
    if (reading.pressure < 0.5 || reading.pressure > 3) probability += 0.15;
    
    // Consider recent trends
    if (machine.sensorHistory.length > 10) {
      const recent = machine.sensorHistory.slice(-10);
      const avgVibration = recent.reduce((sum, r) => sum + r.vibration, 0) / recent.length;
      if (Math.abs(reading.vibration - avgVibration) > 2) {
        probability += 0.2;
      }
    }
    
    return Math.min(1, probability);
  }

  public startSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    this.simulationInterval = setInterval(() => {
      this.machines.forEach(machine => {
        const reading = this.generateSensorReading(machine);
        this.updateMachineState(machine, reading);
      });
    }, this.UPDATE_INTERVAL);
  }

  public stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  public getMachineStates(): MachineState[] {
    return Array.from(this.machines.values());
  }

  public getMachineState(machineId: string): MachineState | undefined {
    return this.machines.get(machineId);
  }

  public getLatestSensorReading(machineId: string): SensorReading | undefined {
    const machine = this.machines.get(machineId);
    return machine?.sensorHistory[machine.sensorHistory.length - 1];
  }

  public getSensorHistory(machineId: string, limit: number = 50): SensorReading[] {
    const machine = this.machines.get(machineId);
    if (!machine) return [];
    return machine.sensorHistory.slice(-limit);
  }
}

// Global instance
export const sensorSimulator = new IndustrialSensorSimulator();
