import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { functionsService } from '@/services/functions.service';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Zap, 
  Play, 
  Plus, 
  Code, 
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const FunctionsPage = () => {
  const navigate = useNavigate();
  const [functions, setFunctions] = useState<any[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<any>(null);
  const [executions, setExecutions] = useState<any[]>([]);
  const [testInput, setTestInput] = useState('{}');
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/auth/login');
      return;
    }

    loadFunctions();
  }, [navigate]);

  useEffect(() => {
    if (selectedFunction) {
      loadExecutions();
    }
  }, [selectedFunction]);

  const loadFunctions = () => {
    const loadedFunctions = functionsService.getFunctions();
    setFunctions(loadedFunctions);
    if (loadedFunctions.length > 0 && !selectedFunction) {
      setSelectedFunction(loadedFunctions[0]);
    }
  };

  const loadExecutions = () => {
    if (!selectedFunction) return;
    const loadedExecutions = functionsService.getExecutions(selectedFunction.id, 20);
    setExecutions(loadedExecutions);
  };

  const handleExecute = async () => {
    if (!selectedFunction) return;

    let input: any;
    try {
      input = JSON.parse(testInput);
    } catch (error) {
      toast.error('Invalid JSON input');
      return;
    }

    setExecuting(true);
    try {
      const result = await functionsService.executeFunction(selectedFunction.id, input);
      
      if (result.status === 'success') {
        toast.success('Function executed successfully', {
          description: `Completed in ${result.duration.toFixed(2)}ms`,
        });
      } else {
        toast.error('Function failed', {
          description: result.error,
        });
      }
      
      loadExecutions();
      loadFunctions();
    } catch (error: any) {
      toast.error('Execution error', { description: error.message });
    } finally {
      setExecuting(false);
    }
  };

  const handleCreateFunction = () => {
    const name = prompt('Enter function name:');
    if (name) {
      functionsService.createFunction(
        name,
        `// New function
export default async function handler(req) {
  const { message = 'Hello' } = req.body || {};
  
  return {
    success: true,
    message: message,
    timestamp: new Date().toISOString()
  };
}`,
        'javascript'
      );
      loadFunctions();
      toast.success('Function created');
    }
  };

  const handleDeleteFunction = (id: string) => {
    if (confirm('Delete this function?')) {
      functionsService.deleteFunction(id);
      if (selectedFunction?.id === id) {
        setSelectedFunction(null);
      }
      loadFunctions();
      toast.success('Function deleted');
    }
  };

  const stats = functionsService.getStats();

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-glow flex items-center gap-3">
              <Zap className="w-10 h-10" />
              Edge Functions
            </h1>
            <p className="text-muted-foreground mt-2">
              Serverless functions that scale automatically
            </p>
          </div>
          <Button 
            className="liquid-button pulse-glow"
            onClick={handleCreateFunction}
          >
            <Plus className="mr-2 w-4 h-4" />
            New Function
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Functions</CardTitle>
              <Zap className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalFunctions}</div>
              <p className="text-xs text-muted-foreground">{stats.enabledFunctions} enabled</p>
            </CardContent>
          </Card>

          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Executions</CardTitle>
              <Play className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalExecutions}</div>
              <p className="text-xs text-muted-foreground">all time</p>
            </CardContent>
          </Card>

          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.successRate}%</div>
              <p className="text-xs text-muted-foreground">reliability</p>
            </CardContent>
          </Card>

          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="w-5 h-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {selectedFunction?.avgExecutionTime.toFixed(0) || 0}ms
              </div>
              <p className="text-xs text-muted-foreground">execution time</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Functions List */}
          <Card className="card-elevated neon-border">
            <CardHeader>
              <CardTitle>Functions</CardTitle>
              <CardDescription>Select to view & test</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {functions.map((func) => (
                  <button
                    key={func.id}
                    onClick={() => setSelectedFunction(func)}
                    className={`w-full text-left p-3 rounded-lg border transition-all group ${
                      selectedFunction?.id === func.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{func.name}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFunction(func.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={func.enabled ? "default" : "secondary"} className="text-xs">
                        {func.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <span>{func.executionCount} runs</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Function Editor & Testing */}
          <div className="lg:col-span-3 space-y-6">
            {!selectedFunction ? (
              <Card className="card-elevated neon-border">
                <CardContent className="pt-12 pb-12 text-center">
                  <Code className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Select a function to view and test</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Code Editor */}
                <Card className="card-elevated neon-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedFunction.name}</CardTitle>
                        <CardDescription>
                          Last executed: {selectedFunction.lastExecutedAt 
                            ? new Date(selectedFunction.lastExecutedAt).toLocaleString()
                            : 'Never'}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{selectedFunction.language}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 rounded-lg bg-muted border border-border font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
                      {selectedFunction.code}
                    </pre>
                  </CardContent>
                </Card>

                {/* Test Input */}
                <Card className="card-elevated neon-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Test Function</CardTitle>
                      <Button 
                        className="liquid-button"
                        onClick={handleExecute}
                        disabled={executing}
                      >
                        <Play className="mr-2 w-4 h-4" />
                        {executing ? 'Running...' : 'Run'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Request Body (JSON)
                        </label>
                        <Textarea
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          className="font-mono text-sm h-32"
                          placeholder='{ "key": "value" }'
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Execution History */}
                <Card className="card-elevated neon-border">
                  <CardHeader>
                    <CardTitle>Execution History</CardTitle>
                    <CardDescription>Recent function runs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {executions.length === 0 ? (
                        <p className="text-center py-6 text-muted-foreground text-sm">
                          No executions yet
                        </p>
                      ) : (
                        executions.map((exec) => (
                          <div
                            key={exec.id}
                            className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {exec.status === 'success' ? (
                                  <CheckCircle className="w-5 h-5 text-success" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-destructive" />
                                )}
                                <Badge variant={exec.status === 'success' ? 'default' : 'destructive'}>
                                  {exec.status}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="text-xs flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {exec.duration.toFixed(2)}ms
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(exec.startTime).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            {exec.logs.length > 0 && (
                              <div className="mt-2 p-2 rounded bg-muted/50 text-xs font-mono">
                                {exec.logs.map((log, i) => (
                                  <div key={i}>{log}</div>
                                ))}
                              </div>
                            )}
                            {exec.error && (
                              <div className="mt-2 p-2 rounded bg-destructive/10 text-xs text-destructive font-mono">
                                {exec.error}
                              </div>
                            )}
                            {exec.output && (
                              <details className="mt-2">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                  View output
                                </summary>
                                <pre className="mt-2 p-2 rounded bg-muted/50 text-xs font-mono overflow-x-auto">
                                  {JSON.stringify(exec.output, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FunctionsPage;
