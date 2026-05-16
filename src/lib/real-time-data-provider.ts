// Real-time Data Provider for React Components
// Provides live data integration between sensor simulator, AI pipeline, and UI components

"use client";

import { useState, useEffect, useCallback } from 'react';
import { MachineState, sensorSimulator } from './industrial-sensor-simulator';
import { AIPrediction, aiPredictionPipeline } from './ai-prediction-pipeline';

export interface RealtimeData {
  machines: MachineState[];
  predictions: AIPrediction[];
  criticalAlerts: AIPrediction[];
  highPriorityAlerts: AIPrediction[];
  isConnected: boolean;
  lastUpdate: number;
}

export interface UseRealtimeDataOptions {
  updateInterval?: number;
  autoStart?: boolean;
}

export function useRealtimeData(options: UseRealtimeDataOptions = {}) {
  const { updateInterval = 1000, autoStart = true } = options;

  const [data, setData] = useState<RealtimeData>({
    machines: [],
    predictions: [],
    criticalAlerts: [],
    highPriorityAlerts: [],
    isConnected: false,
    lastUpdate: Date.now()
  });

  const updateData = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/machines");
      const apiData = await res.json();

      const machines = apiData.machines || [];

      // TEMPORARY empty predictions
      const predictions = [];

      const criticalAlerts = [];
      const highPriorityAlerts = [];

      setData(prev => ({
        ...prev,
        machines,
        predictions,
        criticalAlerts,
        highPriorityAlerts,
        isConnected: true,
        lastUpdate: Date.now()
      }));
    } catch (error) {
      console.error('Error updating real-time data:', error);
      setData(prev => ({
        ...prev,
        isConnected: false
      }));
    }
  }, []);

  useEffect(() => {
    if (autoStart) {
      // Start the simulation and prediction pipeline
      sensorSimulator.startSimulation();
      aiPredictionPipeline.startPredictionPipeline();

      // Initial data fetch
      updateData();

      // Set up periodic updates
      const interval = setInterval(updateData, updateInterval);

      return () => {
        clearInterval(interval);
        sensorSimulator.stopSimulation();
        aiPredictionPipeline.stopPredictionPipeline();
      };
    }
  }, [autoStart, updateInterval, updateData]);

  const startSimulation = useCallback(() => {
    sensorSimulator.startSimulation();
    aiPredictionPipeline.startPredictionPipeline();
    updateData();
  }, [updateData]); const machines = sensorSimulator.getMachineStates();

  const stopSimulation = useCallback(() => {
    sensorSimulator.stopSimulation();
    aiPredictionPipeline.stopPredictionPipeline();
  }, []);

  const forceUpdate = useCallback(() => {
    updateData();
  }, [updateData]);

  return {
    ...data,
    startSimulation,
    stopSimulation,
    forceUpdate
  };
}

export function useMachineData(machineId: string) {
  const realtimeData = useRealtimeData();

  const machine = realtimeData.machines.find(m => m.id === machineId);
  const prediction = realtimeData.predictions.find(p => p.machineId === machineId);
  const sensorHistory = machine ? sensorSimulator.getSensorHistory(machineId, 50) : [];
  const latestReading = machine ? sensorSimulator.getLatestSensorReading(machineId) : null;

  return {
    machine,
    prediction,
    sensorHistory,
    latestReading,
    ...realtimeData
  };
}

export function useAggregatedStats() {
  const realtimeData = useRealtimeData();

  const stats = {
    totalMachines: realtimeData.machines.length,
    healthyMachines: realtimeData.machines.filter(m => m.health > 70).length,
    warningMachines: realtimeData.machines.filter(m => m.health > 40 && m.health <= 70).length,
    criticalMachines: realtimeData.machines.filter(m => m.health <= 40).length,
    averageRUL: realtimeData.predictions.reduce((sum, p) => sum + p.rulHours, 0) / (realtimeData.predictions.length || 1),
    averageHealth: realtimeData.machines.reduce((sum, m) => sum + m.health, 0) / (realtimeData.machines.length || 1),
    averageEfficiency: realtimeData.predictions.reduce((sum, p) => sum + p.efficiency, 0) / (realtimeData.predictions.length || 1),
    totalAnomalies: realtimeData.predictions.reduce((sum, p) => sum + (p.anomalyScore > 0.5 ? 1 : 0), 0),
    criticalAlertsCount: realtimeData.criticalAlerts.length,
    highPriorityAlertsCount: realtimeData.highPriorityAlerts.length,
    activeMachines: realtimeData.machines.filter(m => m.operationalState !== 'idle').length,
    overloadMachines: realtimeData.machines.filter(m => m.operationalState === 'overload').length,
    failureMachines: realtimeData.machines.filter(m => m.operationalState === 'failure').length
  };

  return {
    ...realtimeData,
    stats
  };
}

// Utility functions for data transformation
export function transformMachineToLegacyFormat(machine: MachineState, prediction?: AIPrediction) {
  const latestReading = sensorSimulator.getLatestSensorReading(machine.id);

  return {
    id: machine.id,
    name: machine.name,
    area: getMachineArea(machine.type),
    health: Math.round(machine.health),
    status: getMachineStatus(machine.health, machine.operationalState),
    rul: `${Math.round(prediction?.rulHours || machine.rul)} h`,
    load: `${latestReading?.load || 0}%`,
    vibration: `${(latestReading?.vibration || 0).toFixed(1)} mm/s`,
    engineer: getMachineEngineer(machine.id),
    operationalState: machine.operationalState,
    efficiency: prediction?.efficiency || 0,
    performanceScore: prediction?.performanceScore || 0,
    anomalyScore: prediction?.anomalyScore || 0,
    maintenanceUrgency: prediction?.maintenanceUrgency || 'low'
  };
}

export function transformPredictionToAlertFormat(prediction: AIPrediction) {
  const machine = sensorSimulator.getMachineState(prediction.machineId);

  return {
    machine: machine?.name || prediction.machineId,
    severity: prediction.maintenanceUrgency === 'critical' ? 'Critical' :
      prediction.maintenanceUrgency === 'high' ? 'High' :
        prediction.maintenanceUrgency === 'medium' ? 'Medium' : 'Low',
    description: prediction.predictedFailures[0]?.description || 'Performance degradation detected',
    time: formatTimeAgo(prediction.timestamp),
    confidence: prediction.predictedFailures[0]?.confidence || 0,
    estimatedTime: prediction.predictedFailures[0]?.estimatedTime || 0,
    component: prediction.predictedFailures[0]?.component || 'system'
  };
}

// Helper functions
function getMachineArea(type: MachineState['type']): string {
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

function getMachineStatus(health: number, operationalState: MachineState['operationalState']): 'Good' | 'Warning' | 'Critical' | 'Moderate' {
  if (operationalState === 'failure') return 'Critical';
  if (health > 70) return 'Good';
  if (health > 40) return 'Warning';
  return 'Critical';
}

function getMachineEngineer(machineId: string): string {
  const engineers: Record<string, string> = {
    'MACHINE_01': 'Priya Shah',
    'MACHINE_02': 'Rohan Iyer',
    'MACHINE_03': 'Neha Rao',
    'MACHINE_07': 'Karan Gill',
    'MACHINE_12': 'Arjun Mehta',
    'MACHINE_14': 'Sara Khan'
  };
  return engineers[machineId] || 'Unassigned';
}

function formatTimeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} days ago`;
}
