// HelenaBase Edge Functions Service - Serverless Functions Management

export interface EdgeFunction {
  id: string;
  name: string;
  code: string;
  language: 'javascript' | 'typescript';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  executionCount: number;
  avgExecutionTime: number;
}

export interface FunctionExecution {
  id: string;
  functionId: string;
  status: 'success' | 'error';
  startTime: string;
  endTime: string;
  duration: number;
  input: any;
  output?: any;
  error?: string;
  logs: string[];
}

export interface FunctionTrigger {
  id: string;
  functionId: string;
  type: 'insert' | 'update' | 'delete' | 'cron' | 'http';
  table?: string;
  schedule?: string;
  enabled: boolean;
}

const STORAGE_KEY = 'helenabase_functions';

class FunctionsService {
  private functions: EdgeFunction[] = [];
  private executions: FunctionExecution[] = [];
  private triggers: FunctionTrigger[] = [];

  constructor() {
    this.loadFunctions();
    this.initializeExamples();
  }

  private loadFunctions(): void {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      this.functions = parsed.functions || [];
      this.executions = parsed.executions || [];
      this.triggers = parsed.triggers || [];
    }
  }

  private saveFunctions(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      functions: this.functions,
      executions: this.executions.slice(-200), // Keep last 200 executions
      triggers: this.triggers,
    }));
  }

  private initializeExamples(): void {
    if (this.functions.length === 0) {
      this.createFunction('hello-world', `// Welcome to HelenaBase Edge Functions!
// This function runs on the server (simulated)

export default async function handler(req) {
  const { name = 'World' } = req.body || {};
  
  return {
    message: \`Hello, \${name}! Welcome to HelenaBase.\`,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
}`, 'javascript');

      this.createFunction('send-email', `// Email sending function
export default async function handler(req) {
  const { to, subject, body } = req.body;
  
  // Simulate email sending
  console.log('Sending email to:', to);
  console.log('Subject:', subject);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    messageId: 'msg_' + Math.random().toString(36),
    timestamp: new Date().toISOString()
  };
}`, 'javascript');
    }
  }

  // Create function
  createFunction(name: string, code: string, language: 'javascript' | 'typescript' = 'javascript'): EdgeFunction {
    const func: EdgeFunction = {
      id: `func_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      code,
      language,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      avgExecutionTime: 0,
    };

    this.functions.push(func);
    this.saveFunctions();
    return func;
  }

  // Get all functions
  getFunctions(): EdgeFunction[] {
    return this.functions;
  }

  // Get function by ID
  getFunction(id: string): EdgeFunction | null {
    return this.functions.find(f => f.id === id) || null;
  }

  // Update function
  updateFunction(id: string, updates: Partial<EdgeFunction>): boolean {
    const func = this.getFunction(id);
    if (!func) return false;

    Object.assign(func, updates, { updatedAt: new Date().toISOString() });
    this.saveFunctions();
    return true;
  }

  // Delete function
  deleteFunction(id: string): boolean {
    const index = this.functions.findIndex(f => f.id === id);
    if (index === -1) return false;

    this.functions.splice(index, 1);
    // Delete associated executions and triggers
    this.executions = this.executions.filter(e => e.functionId !== id);
    this.triggers = this.triggers.filter(t => t.functionId !== id);
    this.saveFunctions();
    return true;
  }

  // Execute function
  async executeFunction(id: string, input: any = {}): Promise<FunctionExecution> {
    const func = this.getFunction(id);
    if (!func) {
      throw new Error('Function not found');
    }

    if (!func.enabled) {
      throw new Error('Function is disabled');
    }

    const startTime = new Date().toISOString();
    const logs: string[] = [];
    const startMs = performance.now();

    // Override console.log to capture logs
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      logs.push(args.map(a => String(a)).join(' '));
      originalLog(...args);
    };

    let status: 'success' | 'error' = 'success';
    let output: any;
    let error: string | undefined;

    try {
      // Simulate function execution (in real world, this would run in isolated environment)
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));

      // Try to parse and execute the function
      const funcBody = func.code.match(/export default async function handler\(req\) \{([\s\S]*)\}/)?.[1];
      if (funcBody) {
        // Very simplified execution - in real world would use vm or isolated context
        const req = { body: input, headers: {}, query: {} };
        
        // Simulate some common patterns
        if (func.name === 'hello-world') {
          const { name = 'World' } = input;
          output = {
            message: `Hello, ${name}! Welcome to HelenaBase.`,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          };
        } else if (func.name === 'send-email') {
          output = {
            success: true,
            messageId: `msg_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
          };
        } else {
          output = { success: true, result: 'Function executed' };
        }
      } else {
        output = { success: true, result: 'Function executed' };
      }
    } catch (err: any) {
      status = 'error';
      error = err.message;
      output = null;
    } finally {
      console.log = originalLog;
    }

    const endMs = performance.now();
    const duration = endMs - startMs;

    const execution: FunctionExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      functionId: id,
      status,
      startTime,
      endTime: new Date().toISOString(),
      duration,
      input,
      output,
      error,
      logs,
    };

    this.executions.push(execution);

    // Update function stats
    func.lastExecutedAt = execution.endTime;
    func.executionCount++;
    func.avgExecutionTime = (func.avgExecutionTime * (func.executionCount - 1) + duration) / func.executionCount;

    this.saveFunctions();
    return execution;
  }

  // Get function executions
  getExecutions(functionId?: string, limit: number = 50): FunctionExecution[] {
    let execs = this.executions;
    if (functionId) {
      execs = execs.filter(e => e.functionId === functionId);
    }
    return execs.slice(-limit).reverse();
  }

  // Create trigger
  createTrigger(trigger: Omit<FunctionTrigger, 'id'>): FunctionTrigger {
    const newTrigger: FunctionTrigger = {
      ...trigger,
      id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.triggers.push(newTrigger);
    this.saveFunctions();
    return newTrigger;
  }

  // Get triggers for function
  getTriggers(functionId: string): FunctionTrigger[] {
    return this.triggers.filter(t => t.functionId === functionId);
  }

  // Delete trigger
  deleteTrigger(id: string): boolean {
    const index = this.triggers.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.triggers.splice(index, 1);
    this.saveFunctions();
    return true;
  }

  // Get stats
  getStats() {
    const total = this.functions.length;
    const enabled = this.functions.filter(f => f.enabled).length;
    const totalExecutions = this.executions.length;
    const successRate = this.executions.length > 0
      ? (this.executions.filter(e => e.status === 'success').length / this.executions.length) * 100
      : 100;

    return {
      totalFunctions: total,
      enabledFunctions: enabled,
      totalExecutions,
      successRate: successRate.toFixed(1),
    };
  }
}

export const functionsService = new FunctionsService();
