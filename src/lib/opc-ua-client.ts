// OPC-UA Client for Industrial Hardware Integration
// Handles secure industrial communication with PLCs and industrial systems

export interface OPCUAConfig {
  endpoint: string;
  securityMode?: 'None' | 'Basic256Rsa15' | 'Basic256Sha256' | 'Sign' | 'SignAndEncrypt' | 'SignAndEncrypt';
  username?: string;
  password?: string;
  certificate?: string;
  privateKey?: string;
  applicationUri?: string;
  timeout?: number;
  reconnectInterval?: number;
}

export interface OPCUANode {
  nodeId: string;
  browseName: string;
  displayName: string;
  description?: string;
  dataVariables: OPCUAVariable[];
}

export interface OPCUAVariable {
  nodeId: string;
  browseName: string;
  displayName: string;
  description?: string;
  dataType: string;
  value: any;
  accessLevel: 'CurrentRead' | 'CurrentWrite' | 'HistoryRead' | 'HistoryWrite';
}

export interface OPCUAConnectionStatus {
  connected: boolean;
  message: string;
  timestamp: number;
  endpoint: string;
  securityMode: string;
}

export class OPCUAClient {
  private client: any = null;
  private config: OPCUAConfig;
  private connectionStatus: OPCUAConnectionStatus;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private subscribedNodes: Map<string, OPCUANode> = new Map();
  private dataChangeHandlers: Map<string, (nodeId: string, variable: OPCUAVariable) => void> = new Map();

  constructor(config: OPCUAConfig) {
    this.config = {
      endpoint: config.endpoint || 'opc.tcp://localhost:4840',
      securityMode: config.securityMode || 'None',
      username: config.username,
      password: config.password,
      certificate: config.certificate,
      privateKey: config.privateKey,
      applicationUri: config.applicationUri || 'urn:IndustrialAIClient',
      timeout: config.timeout || 10000,
      reconnectInterval: config.reconnectInterval || 5000
    };

    this.connectionStatus = {
      connected: false,
      message: 'Disconnected',
      timestamp: Date.now(),
      endpoint: this.config.endpoint,
      securityMode: this.config.securityMode || 'None'
    };
  }

  // Connect to OPC-UA server
  async connect(): Promise<void> {
    try {
      console.log(`🔗 Connecting to OPC-UA server at ${this.config.endpoint}`);
      
      // Import OPC-UA library
      const { OPCUAClient } = await import('opcua-asyncio');
      
      // Create client instance
      this.client = OPCUAClient({
        endpoint: this.config.endpoint,
        security_mode: this.config.securityMode,
        application_uri: this.config.applicationUri,
        timeout: this.config.timeout
      });
      
      // Set up event handlers
      this.client.on('connection_notification', this.handleConnectionNotification.bind(this));
      this.client.on('data_change_notification', this.handleDataChangeNotification.bind(this));
      this.client.on('disconnection', this.handleDisconnection.bind(this));
      this.client.on('error', this.handleError.bind(this));
      
      // Connect to server
      if (this.config.username && this.config.password) {
        await this.client.connect_user(
          this.config.username,
          this.config.password
        );
      } else {
        await this.client.connect_anonymous();
      }
      
      console.log(`✅ Connected to OPC-UA server: ${this.config.endpoint}`);
      this.connectionStatus = {
        connected: true,
        message: 'Connected successfully',
        timestamp: Date.now(),
        endpoint: this.config.endpoint,
        securityMode: this.config.securityMode || 'None'
      };
      
      // Browse and subscribe to nodes
      await this.discoverAndSubscribeNodes();
      
    } catch (error) {
      console.error('❌ Error connecting to OPC-UA server:', error);
      this.connectionStatus = {
        connected: false,
        message: `Connection failed: ${error}`,
        timestamp: Date.now(),
        endpoint: this.config.endpoint,
        securityMode: this.config.securityMode || 'None'
      };
      throw error;
    }
  }

  // Discover and subscribe to OPC-UA nodes
  private async discoverAndSubscribeNodes(): Promise<void> {
    try {
      console.log('🔍 Discovering OPC-UA nodes...');
      
      // Browse for available nodes
      const rootNodes = await this.client.browse_nodes();
      
      for (const rootNode of rootNodes) {
        console.log(`📋 Found root node: ${rootNode.BrowseName.Name}`);
        
        // Browse child nodes
        const childNodes = await this.client.browse_node(rootNode.NodeId);
        
        for (const childNode of childNodes) {
          console.log(`📋 Found child node: ${childNode.BrowseName.Name}`);
          
          // Check if this is a machine node we want to monitor
          if (this.isMachineNode(childNode)) {
            const machineNode: OPCUANode = {
              nodeId: childNode.NodeId,
              browseName: childNode.BrowseName.Name,
              displayName: childNode.BrowseName.DisplayName || childNode.BrowseName.Name,
              description: childNode.BrowseName.Description || `Machine monitoring node: ${childNode.BrowseName.Name}`,
              dataVariables: []
            };
            
            // Get variables for this node
            const variables = await this.client.browse_variables(childNode.NodeId);
            
            for (const variable of variables) {
              machineNode.dataVariables.push({
                nodeId: variable.NodeId,
                browseName: variable.BrowseName.Name,
                displayName: variable.BrowseName.DisplayName || variable.BrowseName.Name,
                description: variable.BrowseName.Description || `Variable: ${variable.BrowseName.Name}`,
                dataType: variable.DataType,
                value: null,
                accessLevel: 'CurrentRead'
              });
            }
            
            // Subscribe to data changes
            await this.client.subscribe_data_change({
              nodeId: childNode.NodeId,
              subscription_type: 'DataChange'
            });
            
            this.subscribedNodes.set(childNode.NodeId, machineNode);
            console.log(`✅ Subscribed to machine node: ${childNode.BrowseName.Name}`);
          }
        }
      }
      
      console.log(`✅ OPC-UA discovery and subscription completed. Monitoring ${this.subscribedNodes.size} nodes.`);
    } catch (error) {
      console.error('❌ Error during OPC-UA discovery:', error);
    }
  }

  // Check if node represents a machine we want to monitor
  private isMachineNode(node: any): boolean {
    const machineKeywords = ['machine', 'sensor', 'temperature', 'vibration', 'pressure', 'rpm', 'current', 'voltage', 'load'];
    const nodeText = `${node.BrowseName.Name} ${node.BrowseName.DisplayName || ''} ${node.BrowseName.Description || ''}`.toLowerCase();
    
    return machineKeywords.some(keyword => nodeText.includes(keyword));
  }

  // Handle connection notifications
  private handleConnectionNotification(notification: any): void {
    console.log(`🔗 OPC-UA Connection notification:`, notification);
    
    if (notification.Status === 'Connected') {
      this.connectionStatus = {
        connected: true,
        message: 'Connected successfully',
        timestamp: Date.now(),
        endpoint: this.config.endpoint,
        securityMode: this.config.securityMode || 'None'
      };
    } else if (notification.Status === 'Disconnected') {
      this.connectionStatus = {
        connected: false,
        message: 'Disconnected',
        timestamp: Date.now(),
        endpoint: this.config.endpoint,
        securityMode: this.config.securityMode || 'None'
      };
      
      // Attempt reconnection
      this.attemptReconnection();
    }
  }

  // Handle data change notifications
  private handleDataChangeNotification(notification: any): void {
    try {
      console.log(`📊 OPC-UA Data change notification:`, notification);
      
      if (notification.MonitoredItems && notification.MonitoredItems.length > 0) {
        for (const item of notification.MonitoredItems) {
          const nodeId = item.NodeId;
          const node = this.subscribedNodes.get(nodeId);
          
          if (node) {
            // Update variable values
            for (const variable of node.dataVariables) {
              const changedVariable = item.Value?.find((v: any) => v.NodeId === variable.nodeId);
              
              if (changedVariable) {
                const oldValue = variable.value;
                variable.value = changedVariable.Value;
                
                console.log(`📊 Variable ${variable.displayName} changed: ${oldValue} → ${variable.value}`);
                
                // Trigger data change handlers
                const handlers = this.dataChangeHandlers.get(nodeId);
                if (handlers) {
                  handlers.forEach(handler => {
                    handler(nodeId, variable);
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error handling OPC-UA data change:', error);
    }
  }

  // Handle disconnection
  private handleDisconnection(disconnection: any): void {
    console.log(`🔌 OPC-UA Disconnected:`, disconnection);
    
    this.connectionStatus = {
      connected: false,
      message: 'Disconnected',
      timestamp: Date.now(),
      endpoint: this.config.endpoint,
      securityMode: this.config.securityMode || 'None'
    };
    
    // Attempt reconnection
    this.attemptReconnection();
  }

  // Handle errors
  private handleError(error: any): void {
    console.error(`❌ OPC-UA Error:`, error);
    
    this.connectionStatus = {
      connected: false,
      message: `Error: ${error}`,
      timestamp: Date.now(),
      endpoint: this.config.endpoint,
      securityMode: this.config.securityMode || 'None'
    };
    
    // Attempt reconnection
    this.attemptReconnection();
  }

  // Attempt reconnection
  private attemptReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting OPC-UA reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(async () => {
        try {
          await this.connect();
        } catch (error) {
          console.error(`❌ OPC-UA Reconnection attempt ${this.reconnectAttempts} failed:`, error);
        }
      }, 5000 * this.reconnectAttempts); // Exponential backoff
    } else {
      console.error('❌ Maximum OPC-UA reconnection attempts reached');
    }
  }

  // Register data change handler
  onDataChange(nodeId: string, handler: (nodeId: string, variable: OPCUAVariable) => void): void {
    this.dataChangeHandlers.set(nodeId, handler);
    console.log(`📋 Registered data change handler for node: ${nodeId}`);
  }

  // Unregister data change handler
  offDataChange(nodeId: string): void {
    this.dataChangeHandlers.delete(nodeId);
    console.log(`🗑️ Unregistered data change handler for node: ${nodeId}`);
  }

  // Read variable value
  async readVariable(nodeId: string, variableNodeId: string): Promise<any> {
    try {
      if (this.connectionStatus.connected && this.client) {
        const node = this.subscribedNodes.get(nodeId);
        
        if (node) {
          const variable = node.dataVariables.find(v => v.nodeId === variableNodeId);
          
          if (variable) {
            const value = await this.client.read_variable_value(variable.NodeId);
            console.log(`📖 Read variable ${variable.displayName}: ${value}`);
            return value;
          }
        }
      }
      
      throw new Error(`Node ${nodeId} not found or not connected`);
    } catch (error) {
      console.error(`❌ Error reading OPC-UA variable:`, error);
      throw error;
    }
  }

  // Write variable value
  async writeVariable(nodeId: string, variableNodeId: string, value: any): Promise<boolean> {
    try {
      if (this.connectionStatus.connected && this.client) {
        const node = this.subscribedNodes.get(nodeId);
        
        if (node) {
          const variable = node.dataVariables.find(v => v.nodeId === variableNodeId);
          
          if (variable) {
            await this.client.write_value(variable.NodeId, value);
            console.log(`📝 Wrote variable ${variable.displayName}: ${value}`);
            return true;
          }
        }
      }
      
      throw new Error(`Node ${nodeId} not found or not connected`);
    } catch (error) {
      console.error(`❌ Error writing OPC-UA variable:`, error);
      return false;
    }
  }

  // Get connection status
  getConnectionStatus(): OPCUAConnectionStatus {
    return this.connectionStatus;
  }

  // Get subscribed nodes
  getSubscribedNodes(): Map<string, OPCUANode> {
    return new Map(this.subscribedNodes);
  }

  // Get node variables
  getNodeVariables(nodeId: string): OPCUAVariable[] {
    const node = this.subscribedNodes.get(nodeId);
    return node ? node.dataVariables : [];
  }

  // Disconnect from OPC-UA server
  async disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      console.log('🔌 Disconnected from OPC-UA server');
      
      this.connectionStatus = {
        connected: false,
        message: 'Disconnected',
        timestamp: Date.now(),
        endpoint: this.config.endpoint,
        securityMode: this.config.securityMode || 'None'
      };
    }
  }

  // Get connection statistics
  getStatistics(): { connected: boolean; subscribedNodes: number; reconnectAttempts: number } {
    return {
      connected: this.connectionStatus.connected,
      subscribedNodes: this.subscribedNodes.size,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}
