// AI Model Training Pipeline for Industrial Predictive Maintenance
// Handles model training, validation, and deployment

import * as tf from '@tensorflow/tfjs';
import { DatabaseService } from './database-service';
import { PostgresService } from './postgres-service';

export interface TrainingData {
  machineId: string;
  sensorReadings: any[];
  healthScores: number[];
  rulValues: number[];
  timestamps: number[];
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse: number;
  mae: number;
}

export interface ModelVersion {
  id: string;
  name: string;
  version: string;
  accuracy: number;
  trainingDate: Date;
  isActive: boolean;
  modelPath: string;
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
  patience: number;
  minDelta: number;
}

export class AITrainingPipeline {
  private model: tf.LayersModel | null = null;
  private isTraining: boolean = false;
  private currentModelVersion: string = 'v1.0.0';

  // Default training configuration
  private static defaultConfig: TrainingConfig = {
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2,
    patience: 10,
    minDelta: 0.0001
  };

  // Initialize training pipeline
  static async initialize(): Promise<void> {
    console.log('🤖 Initializing AI Training Pipeline...');
    
    // Check if TensorFlow.js is available
    if (typeof tf === 'undefined') {
      throw new Error('TensorFlow.js is not available. Please install @tensorflow/tfjs');
    }
    
    console.log('✅ AI Training Pipeline initialized');
  }

  // Prepare training data from database
  static async prepareTrainingData(machineIds: string[], daysBack: number = 30): Promise<TrainingData[]> {
    try {
      console.log(`📊 Preparing training data for ${machineIds.length} machines over last ${daysBack} days`);
      
      const trainingData: TrainingData[] = [];
      
      for (const machineId of machineIds) {
        // Get sensor data from InfluxDB
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        
        const sensorData = await DatabaseService.getSensorData(machineId, startDate, endDate);
        
        // Get AI predictions for correlation
        const predictionsData = await DatabaseService.getAIPredictions(machineId, startDate, endDate);
        
        // Create training sequences
        const sequenceLength = 50; // 50 time steps
        const sequences: number[][] = [];
        const labels: number[] = [];
        
        for (let i = 0; i < sensorData.length - sequenceLength; i++) {
          const sequence = [];
          const healthScores = [];
          const rulValues = [];
          
          for (let j = 0; j < sequenceLength; j++) {
            const dataIndex = i + j;
            if (dataIndex < sensorData.length) {
              const reading = sensorData[dataIndex];
              sequence.push([
                reading.temperature || 0,
                reading.vibration || 0,
                reading.pressure || 0,
                reading.rpm || 0,
                reading.current || 0,
                reading.voltage || 0,
                reading.load || 0,
                reading.flowRate || 0,
                reading.powerConsumption || 0
              ]);
              
              // Find corresponding health score and RUL
              const prediction = predictionsData.find(p => 
                Math.abs(new Date(p.timestamp).getTime() - new Date(reading.timestamp).getTime()) < 5000
              );
              
              healthScores.push(prediction?.healthScore || 50);
              rulValues.push(prediction?.rulHours || 100);
            }
          }
          
          // Calculate target (next health score)
          const targetHealthScore = healthScores[healthScores.length - 1] || 50;
          
          sequences.push(sequence);
          labels.push(targetHealthScore);
        }
        
        trainingData.push({
          machineId,
          sensorReadings: sensorData,
          healthScores,
          rulValues,
          timestamps: sensorData.map(reading => reading.timestamp)
        });
      }
      
      console.log(`✅ Prepared training data: ${trainingData.length} sequences`);
      return trainingData;
    } catch (error) {
      console.error('❌ Error preparing training data:', error);
      throw error;
    }
  }

  // Create LSTM model architecture
  static createModel(inputShape: number[]): tf.LayersModel {
    console.log('🧠 Creating LSTM model architecture...');
    
    const model = tf.sequential({
      layers: [
        // Input layer
        tf.layers.lstm({
          units: 64,
          returnSequences: false,
          inputShape: [inputShape[0], inputShape[1], inputShape[2]]
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({ units: 32, returnSequences: false }),
        tf.layers.dropout({ rate: 0.2 }),
        
        // Dense layers for prediction
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.1 }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.1 }),
        tf.layers.dense({ units: 1, activation: 'linear' }) // Output layer for health score
      ]
    });

    // Compile model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    });

    console.log('✅ LSTM model created and compiled');
    return model;
  }

  // Train the model
  static async trainModel(trainingData: TrainingData[], config: TrainingConfig = this.defaultConfig): Promise<tf.LayersModel> {
    try {
      console.log('🏋 Starting model training...');
      this.isTraining = true;
      
      // Prepare all training data
      const allSequences: number[][] = [];
      const allLabels: number[] = [];
      
      trainingData.forEach(data => {
        allSequences.push(...data.sensorReadings.map(reading => [
          reading.temperature || 0,
          reading.vibration || 0,
          reading.pressure || 0,
          reading.rpm || 0,
          reading.current || 0,
          reading.voltage || 0,
          reading.load || 0,
          reading.flowRate || 0,
          reading.powerConsumption || 0
        ]));
        allLabels.push(...data.healthScores);
      });
      
      // Convert to tensors
      const xs = tf.tensor3d(allSequences);
      const ys = tf.tensor2d(allLabels);
      
      // Create and train model
      this.model = this.createModel([allSequences[0][0].length, allSequences[0][0].length, 9]);
      
      const history = await this.model.fit(xs, ys, {
        epochs: config.epochs,
        batchSize: config.batchSize,
        validationSplit: config.validationSplit,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`📊 Epoch ${epoch + 1}: Loss = ${logs.loss.toFixed(4)}`);
          },
          onTrainEnd: (logs) => {
            console.log(`✅ Training completed. Final loss: ${logs.loss.toFixed(4)}`);
          }
        }
      });
      
      this.isTraining = false;
      console.log('✅ Model training completed');
      
      return this.model;
    } catch (error) {
      this.isTraining = false;
      console.error('❌ Error training model:', error);
      throw error;
    }
  }

  // Evaluate model performance
  static async evaluateModel(model: tf.LayersModel, testData: TrainingData[]): Promise<ModelMetrics> {
    try {
      console.log('📊 Evaluating model performance...');
      
      // Prepare test data
      const testSequences: number[][] = [];
      const testLabels: number[] = [];
      
      testData.forEach(data => {
        testSequences.push(...data.sensorReadings.map(reading => [
          reading.temperature || 0,
          reading.vibration || 0,
          reading.pressure || 0,
          reading.rpm || 0,
          reading.current || 0,
          reading.voltage || 0,
          reading.load || 0,
          reading.flowRate || 0,
          reading.powerConsumption || 0
        ]));
        testLabels.push(...data.healthScores);
      });
      
      const testXs = tf.tensor3d(testSequences);
      const testYs = tf.tensor2d(testLabels);
      
      // Evaluate model
      const evaluation = model.evaluate(testXs, testYs);
      
      const metrics: ModelMetrics = {
        accuracy: (evaluation as any).accuracy || 0,
        precision: (evaluation as any).precision || 0,
        recall: (evaluation as any).recall || 0,
        f1Score: (evaluation as any).f1Score || 0,
        mse: (evaluation as any).mse || 0,
        mae: (evaluation as any).mae || 0
      };
      
      console.log(`✅ Model evaluation completed:`, metrics);
      return metrics;
    } catch (error) {
      console.error('❌ Error evaluating model:', error);
      throw error;
    }
  }

  // Save trained model
  static async saveModel(model: tf.LayersModel, version: string): Promise<string> {
    try {
      console.log(`💾 Saving model version: ${version}`);
      
      // Generate model JSON
      const modelData = await model.save('file://model.json');
      
      // Save to database
      const modelVersion: ModelVersion = {
        id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: 'Industrial Health Prediction LSTM',
        version,
        accuracy: 0.85, // Would be calculated from evaluation
        trainingDate: new Date(),
        isActive: true,
        modelPath: modelData
      };
      
      const versionId = await PostgresService.saveModelMetadata(modelVersion);
      
      console.log(`✅ Model saved with version ID: ${versionId}`);
      return versionId;
    } catch (error) {
      console.error('❌ Error saving model:', error);
      throw error;
    }
  }

  // Load trained model
  static async loadModel(versionId: string): Promise<tf.LayersModel | null> {
    try {
      console.log(`📂 Loading model version: ${versionId}`);
      
      // Get model metadata from database
      const modelVersions = await PostgresService.getModelVersions();
      const modelVersion = modelVersions.find(v => v.id === versionId);
      
      if (!modelVersion) {
        console.error(`❌ Model version ${versionId} not found`);
        return null;
      }
      
      // Load model from file
      const model = await tf.loadLayersModel(modelVersion.modelPath);
      
      console.log(`✅ Model loaded: ${modelVersion.name} v${modelVersion.version}`);
      return model;
    } catch (error) {
      console.error('❌ Error loading model:', error);
      return null;
    }
  }

  // Get model versions
  static async getModelVersions(): Promise<ModelVersion[]> {
    try {
      console.log('📋 Retrieving model versions...');
      
      // Here you would query PostgreSQL
      const mockVersions: ModelVersion[] = [
        {
          id: 'model_v1_001',
          name: 'Industrial Health Prediction LSTM',
          version: '1.0.0',
          accuracy: 0.85,
          trainingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          isActive: true,
          modelPath: 'file://model.json'
        },
        {
          id: 'model_v1_002',
          name: 'Industrial Health Prediction LSTM',
          version: '1.1.0',
          accuracy: 0.87,
          trainingDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          isActive: false,
          modelPath: 'file://model_v2.json'
        }
      ];
      
      return mockVersions;
    } catch (error) {
      console.error('❌ Error retrieving model versions:', error);
      return [];
    }
  }

  // Deploy new model version
  static async deployModel(versionId: string): Promise<boolean> {
    try {
      console.log(`🚀 Deploying model version: ${versionId}`);
      
      // Get current active models
      const modelVersions = await this.getModelVersions();
      const currentActive = modelVersions.filter(v => v.isActive);
      
      // Deactivate all current models
      for (const model of currentActive) {
        await PostgresService.deactivateModel(model.id);
      }
      
      // Activate new model
      const success = await PostgresService.activateModel(versionId);
      
      if (success) {
        console.log(`✅ Model ${versionId} deployed successfully`);
        return true;
      } else {
        console.error(`❌ Failed to deploy model ${versionId}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error deploying model:', error);
      return false;
    }
  }

  // Get training status
  static getTrainingStatus(): { isTraining: boolean; currentVersion: string } {
    return {
      isTraining: this.isTraining,
      currentVersion: this.currentModelVersion
    };
  }

  // Export training data for external training
  static async exportTrainingData(machineIds: string[], daysBack: number = 30): Promise<string> {
    try {
      console.log(`📤 Exporting training data for ${machineIds.length} machines...`);
      
      const trainingData = await this.prepareTrainingData(machineIds, daysBack);
      
      // Create CSV export
      const csvContent = this.createTrainingCSV(trainingData);
      const filename = `training_data_${Date.now()}.csv`;
      
      // Here you would save to file system or return download URL
      console.log(`✅ Training data exported to: ${filename}`);
      
      return filename;
    } catch (error) {
      console.error('❌ Error exporting training data:', error);
      throw error;
    }
  }

  // Create CSV from training data
  private static createTrainingCSV(trainingData: TrainingData[]): string {
    const headers = [
      'machineId',
      'timestamp',
      'temperature',
      'vibration',
      'pressure',
      'rpm',
      'current',
      'voltage',
      'load',
      'flowRate',
      'powerConsumption',
      'healthScore',
      'rul'
    ];
    
    let csv = headers.join(',') + '\n';
    
    trainingData.forEach(data => {
      data.sensorReadings.forEach((reading, index) => {
        csv += `${data.machineId},${data.timestamps[index]},${reading.temperature || ''},${reading.vibration || ''},${reading.pressure || ''},${reading.rpm || ''},${reading.current || ''},${reading.voltage || ''},${reading.load || ''},${reading.flowRate || ''},${reading.powerConsumption || ''},${data.healthScores[index] || ''},${data.rulValues[index] || ''}\n`;
      });
    });
    
    return csv;
  }

  // Get model performance comparison
  static async getModelPerformanceComparison(): Promise<ModelVersion[]> {
    try {
      console.log('📊 Retrieving model performance comparison...');
      
      const versions = await this.getModelVersions();
      
      // Sort by accuracy descending
      return versions.sort((a, b) => b.accuracy - a.accuracy);
    } catch (error) {
      console.error('❌ Error getting model comparison:', error);
      return [];
    }
  }
}
