// MQTT Client for Industrial Hardware Integration
// Handles real-time communication with industrial PLCs and IoT devices

import * as mqtt from 'paho-mqtt';

export interface MQTTConfig {
  host: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  topics: string[];
  keepAlive?: number;
  cleanSession?: boolean;
}

export interface MQTTMessage {
  topic: string;
  payload: string;
  qos: number;
  retain: boolean;
  timestamp: number;
}

export interface MQTTConnectionStatus {
  connected: boolean;
  message: string;
  timestamp: number;
}

export class MQTTClient {
  private client: mqtt.Client | null = null;
  private config: MQTTConfig;
  private connectionStatus: MQTTConnectionStatus;
  private messageHandlers: Map<string, (message: MQTTMessage) => void> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(config: MQTTConfig) {
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 1883,
      clientId: config.clientId || `industrial-ai-${Math.random().toString(36).substr(2, 9)}`,
      username: config.username,
      password: config.password,
      topics: config.topics || [
        'factory/machines/+/sensor-data',
        'factory/machines/+/status',
        'factory/machines/+/alerts',
        'factory/ai/predictions',
        'factory/system/health'
      ],
      keepAlive: config.keepAlive || 60,
      cleanSession: config.cleanSession !== false
    };

    this.connectionStatus = {
      connected: false,
      message: 'Disconnected',
      timestamp: Date.now()
    };
  }

  // Connect to MQTT broker
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔗 Connecting to MQTT broker at ${this.config.host}:${this.config.port}`);
        
        // Create MQTT client
        this.client = mqtt.connect(this.config.host, this.config.port, this.config.clientId);
        
        // Set connection options
        this.client.onConnectionLost = (responseObject) => {
          console.error(`❌ MQTT connection lost: ${responseObject.errorMessage}`);
          this.connectionStatus = {
            connected: false,
            message: `Connection lost: ${responseObject.errorMessage}`,
            timestamp: Date.now()
          };
          
          // Attempt reconnection
          this.attemptReconnection();
        };

        this.client.onMessageArrived = (message) => {
          this.handleIncomingMessage(message);
        };

        this.client.onConnect = (responseObject) => {
          if (responseObject.errorCode === 0) {
            console.log(`✅ Connected to MQTT broker successfully`);
            this.connectionStatus = {
              connected: true,
              message: 'Connected successfully',
              timestamp: Date.now()
            };
            this.reconnectAttempts = 0;
            
            // Subscribe to all topics
            this.config.topics.forEach(topic => {
              this.client?.subscribe(topic);
              console.log(`📡 Subscribed to topic: ${topic}`);
            });
            
            resolve();
          } else {
            console.error(`❌ MQTT connection failed: ${responseObject.errorMessage}`);
            this.connectionStatus = {
              connected: false,
              message: `Connection failed: ${responseObject.errorMessage}`,
              timestamp: Date.now()
            };
            reject(new Error(`MQTT connection failed: ${responseObject.errorMessage}`));
          }
        };

        // Connect with credentials if provided
        if (this.config.username && this.config.password) {
          this.client.connect({
            userName: this.config.username,
            password: this.config.password,
            onSuccess: this.client.onConnect,
            onFailure: this.client.onConnectionLost,
            useSSL: false,
            keepAliveInterval: this.config.keepAlive,
            cleanSession: this.config.cleanSession
          });
        } else {
          this.client.connect({
            onSuccess: this.client.onConnect,
            onFailure: this.client.onConnectionLost,
            useSSL: false,
            keepAliveInterval: this.config.keepAlive,
            cleanSession: this.config.cleanSession
          });
        }
      } catch (error) {
        console.error('❌ Error connecting to MQTT broker:', error);
        this.connectionStatus = {
          connected: false,
          message: `Connection error: ${error}`,
          timestamp: Date.now()
        };
        reject(error);
      }
    });
  }

  // Attempt reconnection
  private attemptReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error(`❌ Reconnection attempt ${this.reconnectAttempts} failed:`, error);
        });
      }, 5000 * this.reconnectAttempts); // Exponential backoff
    } else {
      console.error('❌ Maximum reconnection attempts reached');
      this.connectionStatus = {
        connected: false,
        message: 'Maximum reconnection attempts reached',
        timestamp: Date.now()
      };
    }
  }

  // Handle incoming MQTT messages
  private handleIncomingMessage(message: mqtt.Message): void {
    try {
      const topic = message.destinationName;
      const payload = message.payloadString;
      
      console.log(`📡 Received MQTT message on topic: ${topic}`);
      console.log(`📋 Payload: ${payload}`);

      // Parse and process different message types
      if (topic.includes('sensor-data')) {
        this.handleSensorData(topic, payload);
      } else if (topic.includes('status')) {
        this.handleMachineStatus(topic, payload);
      } else if (topic.includes('alerts')) {
        this.handleAlerts(topic, payload);
      } else if (topic.includes('predictions')) {
        this.handleAIPredictions(topic, payload);
      } else if (topic.includes('health')) {
        this.handleSystemHealth(topic, payload);
      }

      // Trigger registered message handlers
      const handlers = this.messageHandlers.get(topic);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler({
              topic,
              payload,
              qos: message.qos,
              retain: message.retained,
              timestamp: Date.now()
            });
          } catch (error) {
            console.error(`❌ Error in message handler for topic ${topic}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error processing MQTT message:', error);
    }
  }

  // Handle sensor data messages
  private handleSensorData(topic: string, payload: string): void {
    try {
      const sensorData = JSON.parse(payload);
      
      // Extract machine ID from topic
      const machineId = this.extractMachineId(topic);
      
      console.log(`📊 Received sensor data for machine: ${machineId}`);
      
      // Here you would integrate with your database service
      // await DatabaseService.writeSensorData(machineId, [sensorData]);
      
    } catch (error) {
      console.error('❌ Error handling sensor data:', error);
    }
  }

  // Handle machine status messages
  private handleMachineStatus(topic: string, payload: string): void {
    try {
      const statusData = JSON.parse(payload);
      const machineId = this.extractMachineId(topic);
      
      console.log(`🔧 Received machine status for: ${machineId}`);
      
      // Here you would update machine state in database
      // await DatabaseService.updateMachineState(machineId, statusData);
      
    } catch (error) {
      console.error('❌ Error handling machine status:', error);
    }
  }

  // Handle alert messages
  private handleAlerts(topic: string, payload: string): void {
    try {
      const alertData = JSON.parse(payload);
      const machineId = this.extractMachineId(topic);
      
      console.log(`🚨 Received alert for machine: ${machineId}`);
      
      // Here you would save alert to database and send notifications
      // await PostgresService.saveAlert(alertData);
      // await NotificationService.sendNotification(alertData);
      
    } catch (error) {
      console.error('❌ Error handling alert:', error);
    }
  }

  // Handle AI prediction messages
  private handleAIPredictions(topic: string, payload: string): void {
    try {
      const predictionData = JSON.parse(payload);
      const machineId = this.extractMachineId(topic);
      
      console.log(`🤖 Received AI prediction for machine: ${machineId}`);
      
      // Here you would save prediction to database
      // await DatabaseService.writePredictionData(predictionData);
      
    } catch (error) {
      console.error('❌ Error handling AI prediction:', error);
    }
  }

  // Handle system health messages
  private handleSystemHealth(topic: string, payload: string): void {
    try {
      const healthData = JSON.parse(payload);
      
      console.log(`🏥 Received system health data:`, healthData);
      
      // Here you would update system health status
      // await DatabaseService.updateSystemHealth(healthData);
      
    } catch (error) {
      console.error('❌ Error handling system health:', error);
    }
  }

  // Extract machine ID from MQTT topic
  private extractMachineId(topic: string): string {
    const match = topic.match(/machines\/([^\/]+)\//);
    return match ? match[1] : 'unknown';
  }

  // Register message handler for specific topic
  onMessage(topic: string, handler: (message: MQTTMessage) => void): void {
    this.messageHandlers.set(topic, handler);
    console.log(`📋 Registered message handler for topic: ${topic}`);
  }

  // Unregister message handler
  offMessage(topic: string): void {
    this.messageHandlers.delete(topic);
    console.log(`🗑️ Unregistered message handler for topic: ${topic}`);
  }

  // Publish message to MQTT topic
  publish(topic: string, payload: any, options: { qos?: number; retain?: boolean } = {}): void {
    if (this.client && this.connectionStatus.connected) {
      const messageStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
      
      const message = new mqtt.Message(messageStr);
      message.destinationName = topic;
      message.qos = options.qos || 1;
      message.retained = options.retain || false;
      
      this.client?.send(message);
      
      console.log(`📤 Published message to topic: ${topic}`);
    } else {
      console.warn(`⚠️ Cannot publish message - MQTT client not connected`);
    }
  }

  // Get current connection status
  getConnectionStatus(): MQTTConnectionStatus {
    return this.connectionStatus;
  }

  // Disconnect from MQTT broker
  disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      console.log('🔌 Disconnected from MQTT broker');
      
      this.connectionStatus = {
        connected: false,
        message: 'Disconnected',
        timestamp: Date.now()
      };
    }
  }

  // Subscribe to additional topics
  subscribeToTopic(topic: string): void {
    if (this.client && this.connectionStatus.connected) {
      this.client?.subscribe(topic);
      console.log(`📡 Subscribed to additional topic: ${topic}`);
    } else {
      console.warn(`⚠️ Cannot subscribe to topic - MQTT client not connected`);
    }
  }

  // Unsubscribe from topic
  unsubscribeFromTopic(topic: string): void {
    if (this.client) {
      this.client?.unsubscribe(topic);
      console.log(`📡 Unsubscribed from topic: ${topic}`);
    }
  }

  // Get connection statistics
  getStatistics(): { connected: boolean; subscribedTopics: string[]; reconnectAttempts: number } {
    return {
      connected: this.connectionStatus.connected,
      subscribedTopics: this.config.topics,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}
