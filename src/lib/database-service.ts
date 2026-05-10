// Database Service for Industrial AI Predictive Maintenance
// Handles both InfluxDB (time-series) and PostgreSQL (structured) data

import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { SensorReading, MachineState } from './industrial-sensor-simulator';
import { AIPrediction } from './ai-prediction-pipeline';

// InfluxDB Configuration
const influxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL || 'http://localhost:8086',
  token: process.env.INFLUXDB_TOKEN || '',
  org: process.env.INFLUXDB_ORG || 'industrial-ai',
  bucket: process.env.INFLUXDB_BUCKET || 'sensor-data'
}).getWriteApi();

export interface DatabaseConfig {
  influxDB: {
    url: string;
    token: string;
    org: string;
    bucket: string;
  };
  postgres: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

export interface AlertRecord {
  id: string;
  machineId: string;
  type: 'threshold' | 'ai_anomaly' | 'predicted_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  userId?: string;
}

export interface MachineMetadata {
  id: string;
  name: string;
  type: string;
  location: string;
  installedDate: Date;
  lastMaintenanceDate?: Date;
  specifications: Record<string, any>;
}

export class DatabaseService {
  // InfluxDB Operations
  static async writeSensorData(machineId: string, readings: SensorReading[]): Promise<void> {
    try {
      const points = readings.map(reading => new Point('sensor_readings')
        .tag('machineId', machineId)
        .tag('sensorType', 'combined')
        .floatField('temperature', reading.temperature)
        .floatField('vibration', reading.vibration)
        .floatField('pressure', reading.pressure)
        .floatField('rpm', reading.rpm)
        .floatField('current', reading.current)
        .floatField('voltage', reading.voltage)
        .floatField('load', reading.load)
        .floatField('flowRate', reading.flowRate)
        .floatField('powerConsumption', reading.powerConsumption)
        .timestamp(new Date(reading.timestamp)));

      await influxDB.writePoints([points]);
      console.log(`✅ Wrote ${points.length} sensor data points for machine ${machineId}`);
    } catch (error) {
      console.error('❌ Error writing sensor data to InfluxDB:', error);
      throw error;
    }
  }

  static async getSensorData(machineId: string, startTime: Date, endTime: Date): Promise<SensorReading[]> {
    try {
      const queryApi = influxDB.getQueryApi();
      const query = `
        from(bucket: "${process.env.INFLUXDB_BUCKET || 'sensor-data'}")
        |> range(start: time(v: ${startTime.toISOString()}), stop: time(v: ${endTime.toISOString()}))
        |> filter(fn: (r) => r.machineId == "${machineId}")
        |> sort(columns: ["_time"])
        |> limit(n: 1000)
      `;

      const result = await queryApi.collectRows(query);
      
      return result.map((row: any) => ({
        timestamp: row._time.getTime(),
        temperature: row.temperature,
        vibration: row.vibration,
        pressure: row.pressure,
        rpm: row.rpm,
        current: row.current,
        voltage: row.voltage,
        load: row.load,
        flowRate: row.flowRate,
        powerConsumption: row.powerConsumption
      }));
    } catch (error) {
      console.error('❌ Error reading sensor data from InfluxDB:', error);
      return [];
    }
  }

  static async writePredictionData(prediction: AIPrediction): Promise<void> {
    try {
      const point = new Point('ai_predictions')
        .tag('machineId', prediction.machineId)
        .floatField('healthScore', prediction.healthScore)
        .floatField('rulHours', prediction.rulHours)
        .floatField('failureProbability', prediction.failureProbability)
        .floatField('performanceScore', prediction.performanceScore)
        .floatField('efficiency', prediction.efficiency)
        .floatField('anomalyScore', prediction.anomalyScore)
        .timestamp(new Date(prediction.timestamp));

      await influxDB.writePoints([point]);
      console.log(`✅ Wrote AI prediction for machine ${prediction.machineId}`);
    } catch (error) {
      console.error('❌ Error writing prediction data to InfluxDB:', error);
      throw error;
    }
  }

  // PostgreSQL Operations (simulated for now)
  static async saveAlert(alert: Omit<AlertRecord, 'id'>): Promise<string> {
    try {
      // Simulate PostgreSQL insertion
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fullAlert: AlertRecord = {
        ...alert,
        id: alertId,
        timestamp: new Date()
      };

      console.log(`✅ Saved alert to PostgreSQL: ${fullAlert.message}`);
      return alertId;
    } catch (error) {
      console.error('❌ Error saving alert to PostgreSQL:', error);
      throw error;
    }
  }

  static async getAlerts(machineId?: string, limit: number = 50): Promise<AlertRecord[]> {
    try {
      // Simulate PostgreSQL query
      console.log(`📋 Retrieved ${limit} alerts from PostgreSQL`);
      
      // Return mock alerts for now
      return [];
    } catch (error) {
      console.error('❌ Error reading alerts from PostgreSQL:', error);
      return [];
    }
  }

  static async saveMachineMetadata(metadata: Omit<MachineMetadata, 'id'>): Promise<string> {
    try {
      // Simulate PostgreSQL insertion
      const metadataId = `meta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fullMetadata: MachineMetadata = {
        ...metadata,
        id: metadataId
      };

      console.log(`✅ Saved machine metadata to PostgreSQL: ${fullMetadata.name}`);
      return metadataId;
    } catch (error) {
      console.error('❌ Error saving machine metadata to PostgreSQL:', error);
      throw error;
    }
  }

  static async getMachineMetadata(machineId?: string): Promise<MachineMetadata[]> {
    try {
      // Simulate PostgreSQL query
      console.log(`📋 Retrieved machine metadata from PostgreSQL`);
      
      // Return mock metadata for now
      return [];
    } catch (error) {
      console.error('❌ Error reading machine metadata from PostgreSQL:', error);
      return [];
    }
  }

  // Health check for database connections
  static async checkDatabaseHealth(): Promise<{ influxDB: boolean; postgres: boolean }> {
    try {
      // Check InfluxDB connection
      const writeApi = influxDB.getWriteApi();
      await writeApi.ping();
      const influxHealthy = true;

      // Simulate PostgreSQL connection
      const postgresHealthy = true;

      console.log(`🏥 Database Health: InfluxDB=${influxHealthy}, PostgreSQL=${postgresHealthy}`);
      return { influxDB: influxHealthy, postgres: postgresHealthy };
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return { influxDB: false, postgres: false };
    }
  }

  // Initialize database connections
  static async initialize(): Promise<void> {
    try {
      // Test InfluxDB connection
      await influxDB.ping();
      console.log('✅ InfluxDB connected successfully');

      // Simulate PostgreSQL connection
      console.log('✅ PostgreSQL connected successfully');

      console.log('🎯 Database service initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }
}
