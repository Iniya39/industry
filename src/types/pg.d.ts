// Type declarations for PostgreSQL module
declare module 'pg';

export interface PoolConfigType {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean;
}

export interface QueryResultType {
  rows: any[];
  rowCount: number;
  command: string;
}

export interface PoolType {
  connect: () => Promise<ClientType>;
  query: (text: string, values?: any[], callback?: (err: Error, result: QueryResultType) => void) => void;
  end: (callback: (err: Error) => void) => void;
}

export interface ClientType {
  query: (config: any, callback: (err: Error, result: QueryResultType) => void) => void;
  end: (callback: (err: Error) => void) => void;
}

declare const Pool: {
  new: (config: PoolConfigType) => PoolType;
};

declare const Client: {
  new: (config: any) => ClientType;
};
