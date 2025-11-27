import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { databaseService } from '@/services/database.service';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, ArrowLeft, Clock, CheckCircle, XCircle, History } from 'lucide-react';
import { toast } from 'sonner';

const SQLEditor = () => {
  const navigate = useNavigate();
  const [sql, setSql] = useState('SELECT * FROM users;');
  const [result, setResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/auth/login');
      return;
    }

    const loadedHistory = databaseService.getQueryHistory();
    setHistory(loadedHistory);
  }, [navigate]);

  const handleExecute = async () => {
    if (!sql.trim()) {
      toast.error('Please enter a SQL query');
      return;
    }

    setExecuting(true);
    setResult(null);

    try {
      const queryResult = await databaseService.executeSQL(sql);
      setResult(queryResult);

      if (queryResult.success) {
        toast.success('Query executed successfully', {
          description: `${queryResult.rowsAffected} row(s) affected in ${queryResult.executionTime?.toFixed(2)}ms`,
        });
        databaseService.saveQueryToHistory(sql);
        setHistory(databaseService.getQueryHistory());
      } else {
        toast.error('Query failed', {
          description: queryResult.error,
        });
      }
    } catch (error: any) {
      toast.error('Execution error', {
        description: error.message,
      });
    } finally {
      setExecuting(false);
    }
  };

  const snippets = [
    { label: 'Select All', sql: 'SELECT * FROM users;' },
    { label: 'Create Table', sql: 'CREATE TABLE products (\n  id UUID PRIMARY KEY,\n  name VARCHAR NOT NULL,\n  price INTEGER\n);' },
    { label: 'Insert Row', sql: "INSERT INTO users (email, name) VALUES ('user@example.com', 'John Doe');" },
    { label: 'Update Row', sql: "UPDATE users SET name = 'Jane Doe' WHERE email = 'user@example.com';" },
    { label: 'Delete Row', sql: "DELETE FROM users WHERE email = 'user@example.com';" },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/database')}
              className="neon-border"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-glow">SQL Editor</h1>
              <p className="text-muted-foreground mt-2">
                Execute SQL queries on your database
              </p>
            </div>
          </div>
          <Button 
            className="liquid-button pulse-glow"
            onClick={handleExecute}
            disabled={executing}
          >
            <Play className="mr-2 w-4 h-4" />
            {executing ? 'Executing...' : 'Run Query'}
          </Button>
        </div>

        {/* Main Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* SQL Editor */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="card-elevated neon-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Query Editor</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      PostgreSQL
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <textarea
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  className="w-full h-64 p-4 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-sm resize-none"
                  placeholder="Enter your SQL query here..."
                  spellCheck={false}
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Lines: {sql.split('\n').length} • Characters: {sql.length}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSql('')}
                    className="neon-border"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {result && (
              <Card className="card-elevated neon-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {result.success ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-success" />
                          Query Results
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-destructive" />
                          Query Error
                        </>
                      )}
                    </CardTitle>
                    {result.executionTime && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {result.executionTime.toFixed(2)}ms
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {result.success ? (
                    result.data && result.data.length > 0 ? (
                      <div className="rounded-lg border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-muted/50">
                              <tr>
                                {Object.keys(result.data[0]).map((key) => (
                                  <th key={key} className="px-4 py-3 text-left text-sm font-medium">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {result.data.map((row: any, index: number) => (
                                <tr key={index} className="border-t border-border hover:bg-muted/50">
                                  {Object.values(row).map((value: any, i: number) => (
                                    <td key={i} className="px-4 py-3 text-sm">
                                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Query executed successfully. {result.rowsAffected} row(s) affected.
                      </p>
                    )
                  ) : (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-destructive font-mono text-sm">{result.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Snippets */}
            <Card className="card-elevated neon-border">
              <CardHeader>
                <CardTitle className="text-lg">Quick Snippets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {snippets.map((snippet) => (
                    <button
                      key={snippet.label}
                      onClick={() => setSql(snippet.sql)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-sm"
                    >
                      {snippet.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* History */}
            <Card className="card-elevated neon-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Query History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No history yet
                    </p>
                  ) : (
                    history.map((query, index) => (
                      <button
                        key={index}
                        onClick={() => setSql(query)}
                        className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        <p className="text-xs font-mono text-muted-foreground truncate">
                          {query}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SQLEditor;
