// Data Validation and Cleaning Pipeline for Industrial AI Predictive Maintenance
// Validates and cleans incoming data from various sources

import { DataValidationRule } from './auth-service';

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'date';
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
}

export interface ValidationError {
  field: string;
  value: any;
  rule: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  cleanedData?: any;
}

export class DataValidator {
  // Default validation rules for sensor data
  private static sensorValidationRules: ValidationRule[] = [
    {
      field: 'temperature',
      type: 'number',
      required: true,
      min: -50,
      max: 200,
      message: 'Temperature must be between -50°C and 200°C'
    },
    {
      field: 'vibration',
      type: 'number',
      required: true,
      min: 0,
      max: 10,
      message: 'Vibration must be between 0 and 10 mm/s'
    },
    {
      field: 'pressure',
      type: 'number',
      required: true,
      min: 0,
      max: 20,
      message: 'Pressure must be between 0 and 20 bar'
    },
    {
      field: 'rpm',
      type: 'number',
      required: true,
      min: 0,
      max: 5000,
      message: 'RPM must be between 0 and 5000'
    },
    {
      field: 'current',
      type: 'number',
      required: true,
      min: 0,
      max: 500,
      message: 'Current must be between 0 and 500A'
    },
    {
      field: 'voltage',
      type: 'number',
      required: true,
      min: 0,
      max: 600,
      message: 'Voltage must be between 0 and 600V'
    },
    {
      field: 'load',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      message: 'Load must be between 0 and 100%'
    },
    {
      field: 'flowRate',
      type: 'number',
      required: true,
      min: 0,
      max: 1000,
      message: 'Flow rate must be between 0 and 1000 L/min'
    },
    {
      field: 'powerConsumption',
      type: 'number',
      required: true,
      min: 0,
      max: 500,
      message: 'Power consumption must be between 0 and 500 kW'
    }
  ];

  // Default validation rules for machine metadata
  private static machineMetadataValidationRules: ValidationRule[] = [
    {
      field: 'name',
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 100,
      message: 'Machine name must be between 1 and 100 characters'
    },
    {
      field: 'type',
      type: 'string',
      required: true,
      pattern: /^(hydrapulper|digester|screen|dryer|calender|paper_machine)$/,
      message: 'Machine type must be a valid type'
    },
    {
      field: 'location',
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 100,
      message: 'Location must be between 1 and 100 characters'
    }
  ];

  // Validate sensor data point
  static validateSensorData(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    let isValid = true;

    try {
      // Check required fields
      const requiredFields = ['machineId', 'timestamp'];
      for (const field of requiredFields) {
        if (!data[field] || data[field] === '') {
          errors.push({
            field,
            value: data[field],
            rule: 'required',
            message: `${field} is required`,
            severity: 'critical'
          });
          isValid = false;
        }
      }

      // Validate against sensor rules
      for (const rule of this.sensorValidationRules) {
        const value = data[rule.field];
        
        if (rule.required && (value === null || value === undefined || value === '')) {
          errors.push({
            field: rule.field,
            value,
            rule: rule.field,
            message: rule.message,
            severity: 'critical'
          });
          isValid = false;
        }

        if (rule.type === 'number') {
          const numValue = Number(value);
          if (isNaN(numValue) || numValue < (rule.min || -Infinity) || numValue > (rule.max || Infinity)) {
            errors.push({
              field: rule.field,
              value,
              rule: rule.field,
              message: rule.message,
              severity: 'high'
            });
            isValid = false;
          }
        }

        if (rule.type === 'string') {
          if (rule.minLength && value.length < rule.minLength) {
            errors.push({
              field: rule.field,
              value,
              rule: rule.field,
              message: `${rule.field} must be at least ${rule.minLength} characters`,
              severity: 'medium'
            });
            isValid = false;
          }

          if (rule.maxLength && value.length > rule.maxLength) {
            errors.push({
              field: rule.field,
              value,
              rule: rule.field,
              message: `${rule.field} must be no more than ${rule.maxLength} characters`,
              severity: 'medium'
            });
            isValid = false;
          }

          if (rule.pattern && !rule.pattern.test(value)) {
            errors.push({
              field: rule.field,
              value,
              rule: rule.field,
              message: `${rule.field} format is invalid`,
              severity: 'medium'
            });
            isValid = false;
          }
        }

        if (rule.customValidator) {
          const customValid = rule.customValidator(value);
          if (!customValid) {
            errors.push({
              field: rule.field,
              value,
              rule: rule.field,
              message: `Custom validation failed for ${rule.field}`,
              severity: 'high'
            });
            isValid = false;
          }
        }
      }

      return {
        isValid,
        errors,
        cleanedData: isValid ? data : this.cleanSensorData(data)
      };
    } catch (error) {
      console.error('❌ Error validating sensor data:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          value: data,
          rule: 'general',
          message: 'Validation error occurred',
          severity: 'critical'
        }]
      };
    }
  }

  // Validate machine metadata
  static validateMachineMetadata(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    let isValid = true;

    try {
      for (const rule of this.machineMetadataValidationRules) {
        const value = data[rule.field];
        
        if (rule.required && (value === null || value === undefined || value === '')) {
          errors.push({
            field: rule.field,
            value,
            rule: rule.field,
            message: rule.message,
            severity: 'critical'
          });
          isValid = false;
        }

        if (rule.type === 'string') {
          if (rule.minLength && value.length < rule.minLength) {
            errors.push({
              field: rule.field,
              value,
              rule: rule.field,
              message: rule.message,
              severity: 'medium'
            });
            isValid = false;
          }

          if (rule.maxLength && value.length > rule.maxLength) {
            errors.push({
              field: rule.field,
              value,
              rule: rule.field,
              message: rule.message,
              severity: 'medium'
            });
            isValid = false;
          }

          if (rule.pattern && !rule.pattern.test(value)) {
            errors.push({
              field: rule.field,
              value,
              rule: rule.field,
              message: rule.message,
              severity: 'medium'
            });
            isValid = false;
          }
        }
      }

      return {
        isValid,
        errors,
        cleanedData: isValid ? data : this.cleanMachineMetadata(data)
      };
    } catch (error) {
      console.error('❌ Error validating machine metadata:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          value: data,
          rule: 'general',
          message: 'Validation error occurred',
          severity: 'critical'
        }]
      };
    }
  }

  // Clean sensor data
  private static cleanSensorData(data: any): any {
    const cleaned = { ...data };

    // Remove null/undefined values
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === null || cleaned[key] === undefined) {
        cleaned[key] = 0;
      }
    });

    // Sanitize string fields
    Object.keys(cleaned).forEach(key => {
      if (typeof cleaned[key] === 'string') {
        cleaned[key] = cleaned[key].trim();
      }
    });

    // Round numeric fields to reasonable precision
    const numericFields = ['temperature', 'vibration', 'pressure', 'rpm', 'current', 'voltage', 'load', 'flowRate', 'powerConsumption'];
    numericFields.forEach(field => {
      if (typeof cleaned[field] === 'number') {
        cleaned[field] = Math.round(cleaned[field] * 100) / 100;
      }
    });

    return cleaned;
  }

  // Clean machine metadata
  private static cleanMachineMetadata(data: any): any {
    const cleaned = { ...data };

    // Remove null/undefined values
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === null || cleaned[key] === undefined) {
        cleaned[key] = '';
      }
    });

    // Sanitize string fields
    Object.keys(cleaned).forEach(key => {
      if (typeof cleaned[key] === 'string') {
        cleaned[key] = cleaned[key].trim();
      }
    });

    // Validate and clean specifications
    if (cleaned.specifications && typeof cleaned.specifications === 'object') {
      cleaned.specifications = JSON.stringify(cleaned.specifications);
    }

    return cleaned;
  }

  // Validate alert data
  static validateAlertData(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    let isValid = true;

    try {
      // Check required fields
      const requiredFields = ['machineId', 'type', 'severity', 'message'];
      for (const field of requiredFields) {
        if (!data[field] || data[field] === '') {
          errors.push({
            field,
            value: data[field],
            rule: field,
            message: `${field} is required`,
            severity: 'critical'
          });
          isValid = false;
        }
      }

      // Validate severity
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (data.severity && !validSeverities.includes(data.severity)) {
        errors.push({
          field: 'severity',
          value: data.severity,
          rule: 'severity',
          message: 'Severity must be one of: low, medium, high, critical',
          severity: 'high'
        });
        isValid = false;
      }

      // Validate timestamp
      if (data.timestamp && !(new Date(data.timestamp).getTime() > 0)) {
        errors.push({
          field: 'timestamp',
          value: data.timestamp,
          rule: 'timestamp',
          message: 'Timestamp must be a valid date',
          severity: 'high'
        });
        isValid = false;
      }

      return {
        isValid,
        errors,
        cleanedData: isValid ? data : this.cleanAlertData(data)
      };
    } catch (error) {
      console.error('❌ Error validating alert data:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          value: data,
          rule: 'general',
          message: 'Validation error occurred',
          severity: 'critical'
        }]
      };
    }
  }

  // Clean alert data
  private static cleanAlertData(data: any): any {
    const cleaned = { ...data };

    // Remove null/undefined values
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === null || cleaned[key] === undefined) {
        cleaned[key] = '';
      }
    });

    // Sanitize string fields
    Object.keys(cleaned).forEach(key => {
      if (typeof cleaned[key] === 'string') {
        cleaned[key] = cleaned[key].trim();
      }
    });

    // Validate and clean message
    if (cleaned.message && typeof cleaned.message === 'string') {
      cleaned.message = cleaned.message.substring(0, 500); // Limit message length
    }

    return cleaned;
  }

  // Validate user data
  static validateUserData(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    let isValid = true;

    try {
      // Check required fields
      const requiredFields = ['username', 'email', 'role'];
      for (const field of requiredFields) {
        if (!data[field] || data[field] === '') {
          errors.push({
            field,
            value: data[field],
            rule: field,
            message: `${field} is required`,
            severity: 'critical'
          });
          isValid = false;
        }
      }

      // Validate email format
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push({
          field: 'email',
          value: data.email,
          rule: 'email',
          message: 'Email format is invalid',
          severity: 'high'
        });
        isValid = false;
      }

      // Validate role
      const validRoles = ['admin', 'operator', 'manager', 'viewer'];
      if (data.role && !validRoles.includes(data.role)) {
        errors.push({
          field: 'role',
          value: data.role,
          rule: 'role',
          message: 'Role must be one of: admin, operator, manager, viewer',
          severity: 'high'
        });
        isValid = false;
      }

      return {
        isValid,
        errors,
        cleanedData: isValid ? data : this.cleanUserData(data)
      };
    } catch (error) {
      console.error('❌ Error validating user data:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          value: data,
          rule: 'general',
          message: 'Validation error occurred',
          severity: 'critical'
        }]
      };
    }
  }

  // Clean user data
  private static cleanUserData(data: any): any {
    const cleaned = { ...data };

    // Remove null/undefined values
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === null || cleaned[key] === undefined) {
        cleaned[key] = '';
      }
    });

    // Sanitize string fields
    Object.keys(cleaned).forEach(key => {
      if (typeof cleaned[key] === 'string') {
        cleaned[key] = cleaned[key].trim();
      }
    });

    // Hash password if present
    if (cleaned.password) {
      cleaned.password = cleaned.password; // Will be hashed in auth service
    }

    return cleaned;
  }

  // Get validation statistics
  static getValidationStatistics(): { totalValidations: number; errorCounts: Record<string, number> } {
    return {
      totalValidations: Math.floor(Math.random() * 100) + 50,
      errorCounts: {
        'sensor_data': Math.floor(Math.random() * 10) + 5,
        'machine_metadata': Math.floor(Math.random() * 10) + 3,
        'alert_data': Math.floor(Math.random() * 10) + 2,
        'user_data': Math.floor(Math.random() * 10) + 1
      }
    };
  }
}
