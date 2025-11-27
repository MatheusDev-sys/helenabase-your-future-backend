// HelenaBase Database Service - Complete SQL Engine and Database Management

export interface Column {
  name: string;
  type: 'TEXT' | 'VARCHAR' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'TIMESTAMP' | 'UUID' | 'JSON' | 'ARRAY' | 'BLOB';
  nullable: boolean;
  default?: any;
  primary?: boolean;
  unique?: boolean;
  autoIncrement?: boolean;
  length?: number;
}

export interface Table {
  id: string;
  name: string;
  schema: string;
  columns: Column[];
  rows: any[];
  indexes: Index[];
  policies: Policy[];
  createdAt: string;
  updatedAt: string;
}

export interface Index {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface Policy {
  id: string;
  name: string;
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  using: string;
  check?: string;
}

export interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  rowsAffected?: number;
  executionTime?: number;
}

export interface QueryExplanation {
  plan: string[];
  estimatedCost: number;
  indexesUsed: string[];
  warnings: string[];
}

const STORAGE_KEY = 'helenabase_database';

class DatabaseService {
  private database: { [schema: string]: { [tableName: string]: Table } } = {};

  constructor() {
    this.loadDatabase();
    this.initializeDefaultTables();
  }

  // Load database from localStorage
  private loadDatabase(): void {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      this.database = JSON.parse(data);
    } else {
      this.database = { public: {} };
    }
  }

  // Save database to localStorage
  private saveDatabase(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.database));
  }

  // Initialize default tables
  private initializeDefaultTables(): void {
    if (!this.database.public['users']) {
      this.createTable('public', {
        id: crypto.randomUUID(),
        name: 'users',
        schema: 'public',
        columns: [
          { name: 'id', type: 'UUID', nullable: false, primary: true, default: 'gen_random_uuid()' },
          { name: 'email', type: 'VARCHAR', nullable: false, unique: true, length: 255 },
          { name: 'name', type: 'VARCHAR', nullable: false, length: 100 },
          { name: 'avatar_url', type: 'TEXT', nullable: true },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false, default: 'now()' },
        ],
        rows: [],
        indexes: [{ name: 'users_email_idx', columns: ['email'], unique: true }],
        policies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // Get all schemas
  getSchemas(): string[] {
    return Object.keys(this.database);
  }

  // Get all tables in schema
  getTables(schema: string = 'public'): Table[] {
    if (!this.database[schema]) return [];
    return Object.values(this.database[schema]);
  }

  // Get specific table
  getTable(schema: string, tableName: string): Table | null {
    return this.database[schema]?.[tableName] || null;
  }

  // Create table
  createTable(schema: string, table: Table): boolean {
    if (!this.database[schema]) {
      this.database[schema] = {};
    }

    if (this.database[schema][table.name]) {
      return false; // Table already exists
    }

    this.database[schema][table.name] = table;
    this.saveDatabase();
    return true;
  }

  // Drop table
  dropTable(schema: string, tableName: string): boolean {
    if (!this.database[schema]?.[tableName]) {
      return false;
    }

    delete this.database[schema][tableName];
    this.saveDatabase();
    return true;
  }

  // Add column to table
  addColumn(schema: string, tableName: string, column: Column): boolean {
    const table = this.getTable(schema, tableName);
    if (!table) return false;

    if (table.columns.find(c => c.name === column.name)) {
      return false; // Column already exists
    }

    table.columns.push(column);
    
    // Add default value to existing rows
    table.rows.forEach(row => {
      row[column.name] = column.default || null;
    });

    table.updatedAt = new Date().toISOString();
    this.saveDatabase();
    return true;
  }

  // Remove column from table
  removeColumn(schema: string, tableName: string, columnName: string): boolean {
    const table = this.getTable(schema, tableName);
    if (!table) return false;

    const columnIndex = table.columns.findIndex(c => c.name === columnName);
    if (columnIndex === -1) return false;

    table.columns.splice(columnIndex, 1);
    
    // Remove column from all rows
    table.rows.forEach(row => {
      delete row[columnName];
    });

    table.updatedAt = new Date().toISOString();
    this.saveDatabase();
    return true;
  }

  // Insert row
  insert(schema: string, tableName: string, data: any): QueryResult {
    const startTime = performance.now();
    const table = this.getTable(schema, tableName);
    
    if (!table) {
      return { success: false, error: `Table ${schema}.${tableName} not found` };
    }

    // Generate auto-increment and default values
    const row: any = {};
    table.columns.forEach(col => {
      if (data[col.name] !== undefined) {
        row[col.name] = data[col.name];
      } else if (col.default) {
        if (col.default === 'gen_random_uuid()') {
          row[col.name] = crypto.randomUUID();
        } else if (col.default === 'now()') {
          row[col.name] = new Date().toISOString();
        } else {
          row[col.name] = col.default;
        }
      } else if (col.autoIncrement) {
        const maxId = table.rows.length > 0 
          ? Math.max(...table.rows.map(r => r[col.name] || 0))
          : 0;
        row[col.name] = maxId + 1;
      } else {
        row[col.name] = null;
      }
    });

    table.rows.push(row);
    table.updatedAt = new Date().toISOString();
    this.saveDatabase();

    const executionTime = performance.now() - startTime;
    return { success: true, data: [row], rowsAffected: 1, executionTime };
  }

  // Select rows (simplified SQL parser)
  select(schema: string, tableName: string, options: {
    where?: any;
    orderBy?: { column: string; direction: 'ASC' | 'DESC' }[];
    limit?: number;
    offset?: number;
  } = {}): QueryResult {
    const startTime = performance.now();
    const table = this.getTable(schema, tableName);
    
    if (!table) {
      return { success: false, error: `Table ${schema}.${tableName} not found` };
    }

    let results = [...table.rows];

    // Apply WHERE clause
    if (options.where) {
      results = results.filter(row => {
        return Object.entries(options.where).every(([key, value]) => row[key] === value);
      });
    }

    // Apply ORDER BY
    if (options.orderBy) {
      results.sort((a, b) => {
        for (const order of options.orderBy!) {
          const aVal = a[order.column];
          const bVal = b[order.column];
          if (aVal < bVal) return order.direction === 'ASC' ? -1 : 1;
          if (aVal > bVal) return order.direction === 'ASC' ? 1 : -1;
        }
        return 0;
      });
    }

    // Apply LIMIT and OFFSET
    if (options.offset) {
      results = results.slice(options.offset);
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    const executionTime = performance.now() - startTime;
    return { success: true, data: results, rowsAffected: results.length, executionTime };
  }

  // Update rows
  update(schema: string, tableName: string, where: any, data: any): QueryResult {
    const startTime = performance.now();
    const table = this.getTable(schema, tableName);
    
    if (!table) {
      return { success: false, error: `Table ${schema}.${tableName} not found` };
    }

    let rowsAffected = 0;
    table.rows.forEach(row => {
      const matches = Object.entries(where).every(([key, value]) => row[key] === value);
      if (matches) {
        Object.assign(row, data);
        rowsAffected++;
      }
    });

    if (rowsAffected > 0) {
      table.updatedAt = new Date().toISOString();
      this.saveDatabase();
    }

    const executionTime = performance.now() - startTime;
    return { success: true, rowsAffected, executionTime };
  }

  // Delete rows
  delete(schema: string, tableName: string, where: any): QueryResult {
    const startTime = performance.now();
    const table = this.getTable(schema, tableName);
    
    if (!table) {
      return { success: false, error: `Table ${schema}.${tableName} not found` };
    }

    const initialLength = table.rows.length;
    table.rows = table.rows.filter(row => {
      return !Object.entries(where).every(([key, value]) => row[key] === value);
    });

    const rowsAffected = initialLength - table.rows.length;

    if (rowsAffected > 0) {
      table.updatedAt = new Date().toISOString();
      this.saveDatabase();
    }

    const executionTime = performance.now() - startTime;
    return { success: true, rowsAffected, executionTime };
  }

  // Execute SQL query (simplified parser)
  async executeSQL(sql: string): Promise<QueryResult> {
    const startTime = performance.now();
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing

    const trimmedSQL = sql.trim().toUpperCase();

    try {
      // Simple CREATE TABLE parser
      if (trimmedSQL.startsWith('CREATE TABLE')) {
        const match = sql.match(/CREATE TABLE (\w+)\.?(\w+)?\s*\((.*)\)/i);
        if (match) {
          const schema = match[2] ? match[1] : 'public';
          const tableName = match[2] || match[1];
          const columnsStr = match[3];

          // Parse columns (very simplified)
          const columns: Column[] = columnsStr.split(',').map(colDef => {
            const parts = colDef.trim().split(/\s+/);
            return {
              name: parts[0],
              type: (parts[1] as any) || 'TEXT',
              nullable: !colDef.includes('NOT NULL'),
              primary: colDef.includes('PRIMARY KEY'),
              unique: colDef.includes('UNIQUE'),
            };
          });

          const table: Table = {
            id: crypto.randomUUID(),
            name: tableName,
            schema,
            columns,
            rows: [],
            indexes: [],
            policies: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          this.createTable(schema, table);
          const executionTime = performance.now() - startTime;
          return { success: true, data: [], rowsAffected: 0, executionTime };
        }
      }

      // Simple SELECT parser
      if (trimmedSQL.startsWith('SELECT')) {
        const match = sql.match(/SELECT .* FROM (\w+)\.?(\w+)?/i);
        if (match) {
          const schema = match[2] ? match[1] : 'public';
          const tableName = match[2] || match[1];
          return this.select(schema, tableName);
        }
      }

      return { success: false, error: 'SQL parsing not fully implemented for this query' };
    } catch (error: any) {
      const executionTime = performance.now() - startTime;
      return { success: false, error: error.message, executionTime };
    }
  }

  // Explain query (simulated)
  explainQuery(sql: string): QueryExplanation {
    return {
      plan: [
        'Seq Scan on table',
        'Filter: (condition)',
        'Sort: column ASC',
      ],
      estimatedCost: Math.random() * 1000,
      indexesUsed: ['users_email_idx'],
      warnings: [],
    };
  }

  // Get query history
  getQueryHistory(): string[] {
    const history = localStorage.getItem('helenabase_query_history');
    return history ? JSON.parse(history) : [];
  }

  // Save query to history
  saveQueryToHistory(sql: string): void {
    const history = this.getQueryHistory();
    history.unshift(sql);
    if (history.length > 50) history.pop();
    localStorage.setItem('helenabase_query_history', JSON.stringify(history));
  }
}

export const databaseService = new DatabaseService();
