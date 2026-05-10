// PostgreSQL Service for Industrial AI Predictive Maintenance
// Handles structured data: alerts, metadata, users

import { Pool, Client } from 'pg';

interface PoolConfigType {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

interface QueryResultType {
  rows: any[];
  rowCount: number;
}

interface PoolType {
  query: (text: string, params?: any[]) => Promise<QueryResultType>;
  end: () => Promise<void>;
}

interface ClientType {
  query: (text: string, params?: any[]) => Promise<QueryResultType>;
  end: () => Promise<void>;
}
import { AlertRecord, MachineMetadata } from './database-service';

// PostgreSQL Configuration
const poolConfig: PoolConfigType = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'industrial_maintenance',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 2000, // 2 seconds
};

// Create connection pool
const pool = new Pool(poolConfig);

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'manager' | 'viewer';
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface AlertConfiguration {
  id: string;
  name: string;
  machineId?: string;
  thresholdType: 'temperature' | 'vibration' | 'pressure' | 'anomaly_score';
  maxValue: number;
  minValue: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export class PostgresService {
  // Initialize database connection
  static async initialize(): Promise<void> {
    try {
      const client = await pool.connect();
      console.log('✅ PostgreSQL connected successfully');
      client.release();
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error);
      throw error;
    }
  }

  // User Management
  static async createUser(user: Omit<User, 'id' | 'createdAt' | 'lastLogin' | 'isActive'>): Promise<string> {
    try {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fullUser: User = {
        ...user,
        id: userId,
        createdAt: new Date(),
        isActive: true
      };

      const query = `
        INSERT INTO users (id, username, email, role, created_at, is_active)
        VALUES ($1, $2, $3, $4, $5, NOW(), true)
        RETURNING id
      `;

      const result = await pool.query(query, [
        userId,
        fullUser.username,
        fullUser.email,
        fullUser.role,
        fullUser.createdAt,
        fullUser.isActive
      ]);

      console.log(`✅ Created user: ${fullUser.username}`);
      return result.rows[0].id;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  static async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, username, email, role, created_at, is_active 
        FROM users 
        WHERE username = $1 AND is_active = true
      `;

      const result = await pool.query(query, [username]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      
      // Update last login
      await pool.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      console.log(`✅ User authenticated: ${user.username}`);
      return user;
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return null;
    }
  }

  static async getUsers(limit: number = 50): Promise<User[]> {
    try {
      const query = `
        SELECT id, username, email, role, created_at, last_login, is_active 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);
      console.log(`📋 Retrieved ${result.rows.length} users`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error retrieving users:', error);
      return [];
    }
  }

  // Alert Management
  static async saveAlert(alert: AlertRecord): Promise<string> {
    try {
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const query = `
        INSERT INTO alerts (id, machine_id, type, severity, message, timestamp, acknowledged, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;

      const result = await pool.query(query, [
        alertId,
        alert.machineId,
        alert.type,
        alert.severity,
        alert.message,
        alert.timestamp,
        alert.acknowledged,
        alert.userId || null
      ]);

      console.log(`✅ Saved alert to PostgreSQL: ${alert.message}`);
      return alertId;
    } catch (error) {
      console.error('❌ Error saving alert to PostgreSQL:', error);
      throw error;
    }
  }

  static async getAlerts(machineId?: string, limit: number = 50, acknowledged?: boolean): Promise<AlertRecord[]> {
    try {
      let query = `
        SELECT id, machine_id, type, severity, message, timestamp, acknowledged, user_id
        FROM alerts
      `;

      const params: any[] = [limit];

      if (machineId) {
        query += ` WHERE machine_id = $${params.length + 1}`;
        params.push(machineId);
      }

      if (acknowledged !== undefined) {
        query += ` AND acknowledged = $${params.length + 1}`;
        params.push(acknowledged);
      }

      query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;

      const result = await pool.query(query, params);
      console.log(`📋 Retrieved ${result.rows.length} alerts from PostgreSQL`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error reading alerts from PostgreSQL:', error);
      return [];
    }
  }

  static async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE alerts 
        SET acknowledged = true, acknowledged_at = NOW()
        WHERE id = $1
      `;

      await pool.query(query, [alertId, userId]);
      console.log(`✅ Alert ${alertId} acknowledged by user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error acknowledging alert:', error);
      return false;
    }
  }

  // Machine Metadata Management
  static async saveMachineMetadata(metadata: Omit<MachineMetadata, 'id'>): Promise<string> {
    try {
      const metadataId = `meta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const query = `
        INSERT INTO machine_metadata (id, name, type, location, installed_date, last_maintenance_date, specifications)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const result = await pool.query(query, [
        metadataId,
        metadata.name,
        metadata.type,
        metadata.location,
        metadata.installedDate,
        metadata.lastMaintenanceDate,
        JSON.stringify(metadata.specifications)
      ]);

      console.log(`✅ Saved machine metadata to PostgreSQL: ${metadata.name}`);
      return metadataId;
    } catch (error) {
      console.error('❌ Error saving machine metadata to PostgreSQL:', error);
      throw error;
    }
  }

  static async getMachineMetadata(machineId?: string): Promise<MachineMetadata[]> {
    try {
      let query = `
        SELECT id, name, type, location, installed_date, last_maintenance_date, specifications
        FROM machine_metadata
      `;

      const params: any[] = [];

      if (machineId) {
        query += ` WHERE id = $${params.length + 1}`;
        params.push(machineId);
      }

      query += ` ORDER BY installed_date DESC`;

      const result = await pool.query(query, params);
      console.log(`📋 Retrieved machine metadata from PostgreSQL`);
      
      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        location: row.location,
        installedDate: row.installed_date,
        lastMaintenanceDate: row.last_maintenance_date,
        specifications: JSON.parse(row.specifications)
      }));
    } catch (error) {
      console.error('❌ Error reading machine metadata from PostgreSQL:', error);
      return [];
    }
  }

  // Alert Configuration Management
  static async saveAlertConfiguration(config: AlertConfiguration): Promise<string> {
    try {
      const configId = `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const query = `
        INSERT INTO alert_configurations (id, name, machine_id, threshold_type, max_value, min_value, severity, is_active, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;

      const result = await pool.query(query, [
        configId,
        config.name,
        config.machineId,
        config.thresholdType,
        config.maxValue,
        config.minValue,
        config.severity,
        config.isActive,
        config.createdBy,
        new Date()
      ]);

      console.log(`✅ Saved alert configuration: ${config.name}`);
      return configId;
    } catch (error) {
      console.error('❌ Error saving alert configuration:', error);
      throw error;
    }
  }

  static async getAlertConfigurations(machineId?: string): Promise<AlertConfiguration[]> {
    try {
      let query = `
        SELECT id, name, machine_id, threshold_type, max_value, min_value, severity, is_active, created_by, created_at
        FROM alert_configurations
      `;

      const params: any[] = [];

      if (machineId) {
        query += ` WHERE machine_id = $${params.length + 1}`;
        params.push(machineId);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await pool.query(query, params);
      console.log(`📋 Retrieved alert configurations from PostgreSQL`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error reading alert configurations from PostgreSQL:', error);
      return [];
    }
  }

  // Health check
  static async checkHealth(): Promise<boolean> {
    try {
      const client = await pool.connect();
      console.log('✅ PostgreSQL health check successful');
      client.release();
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL health check failed:', error);
      return false;
    }
  }

  // Close all connections
  static async close(): Promise<void> {
    try {
      await pool.end();
      console.log('✅ PostgreSQL connection pool closed');
    } catch (error) {
      console.error('❌ Error closing PostgreSQL pool:', error);
    }
  }
}
