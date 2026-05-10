// Authentication Service for Industrial AI Predictive Maintenance
// Handles JWT-based authentication and role-based access control

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PostgresService } from './postgres-service';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'manager' | 'viewer';
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  passwordHash?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface DataValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'date';
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class AuthService {
  private static jwtSecret: string = process.env.JWT_SECRET || 'your-jwt-secret-key-here';
  private static tokenExpiry: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Initialize authentication service
  static initialize(): void {
    console.log('🔐 Authentication service initialized');
    console.log(`🔑 JWT Secret configured: ${this.jwtSecret ? '✅' : '❌ Missing'}`);
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (error) {
      console.error('❌ Error hashing password:', error);
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      return isValid;
    } catch (error) {
      console.error('❌ Error verifying password:', error);
      return false;
    }
  }

  // Generate JWT token
  static generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      iat: Date.now(),
      exp: Date.now() + this.tokenExpiry
    };

    return jwt.sign(payload, this.jwtSecret);
  }

  // Verify JWT token
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('❌ Error verifying JWT token:', error);
      return null;
    }
  }

  // Authenticate user
  static async authenticateUser(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      console.log(`🔐 Authenticating user: ${credentials.username}`);
      
      // Get user from database
      const user = await PostgresService.getUserByUsername(credentials.username);
      
      if (!user) {
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(credentials.password, user.passwordHash || '');
      
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid password'
        };
      }

      // Generate JWT token
      const token = this.generateToken(user);
      
      // Update last login
      await PostgresService.updateLastLogin(user.id);
      
      console.log(`✅ User authenticated: ${user.username}`);
      
      return {
        success: true,
        user: {
          ...user,
          lastLogin: new Date()
        },
        token
      };
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return {
        success: false,
        message: 'Authentication failed'
      };
    }
  }

  // Register new user
  static async registerUser(userData: Omit<User, 'id', 'createdAt', 'lastLogin', 'isActive'>): Promise<AuthResult> {
    try {
      console.log(`📝 Registering new user: ${userData.username}`);
      
      // Check if user already exists
      const existingUser = await PostgresService.getUserByUsername(userData.username);
      
      if (existingUser) {
        return {
          success: false,
          message: 'Username already exists'
        };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);
      
      // Create user
      const userId = await PostgresService.createUser({
        ...userData,
        passwordHash: hashedPassword
      });

      console.log(`✅ User registered: ${userData.username}`);
      
      return {
        success: true,
        user: {
          id: userId,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          createdAt: new Date(),
          isActive: true,
          passwordHash: hashedPassword
        }
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return {
        success: false,
        message: 'Registration failed'
      };
    }
  }

  // Get current user from token
  static getCurrentUser(token: string): Promise<User | null> {
    try {
      const decoded = this.verifyToken(token);
      
      if (!decoded) {
        return null;
      }

      // Get user from database
      const user = await PostgresService.getUserByUsername(decoded.username);
      
      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  // Check user permissions
  static hasPermission(user: User, requiredRole: 'admin' | 'operator' | 'manager' | 'viewer'): boolean {
    const roleHierarchy = {
      'viewer': 0,
      'operator': 1,
      'manager': 2,
      'admin': 3
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  // Middleware for API authentication
  static requireAuth(requiredRole: 'admin' | 'operator' | 'manager' | 'viewer' = 'operator') {
    return async (req: any, res: any, next: any) => {
      try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Missing or invalid token' });
        }

        const token = authHeader.substring(7);
        const decoded = this.verifyToken(token);
        
        if (!decoded) {
          return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Get current user
        const user = await this.getCurrentUser(token);
        
        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        // Check permissions
        if (!this.hasPermission(user, requiredRole)) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Attach user to request
        req.user = user;
        next();
      } catch (error) {
        console.error('❌ Authentication middleware error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    };
  }
}
