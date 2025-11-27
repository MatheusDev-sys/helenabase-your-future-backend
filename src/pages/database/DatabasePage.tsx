import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { databaseService } from '@/services/database.service';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Plus, Table, FileCode, Eye, Edit, Trash2, Code } from 'lucide-react';

const DatabasePage = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<any[]>([]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/auth/login');
      return;
    }

    loadTables();
  }, [navigate]);

  const loadTables = () => {
    const loadedTables = databaseService.getTables('public');
    setTables(loadedTables);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-glow">Database</h1>
            <p className="text-muted-foreground mt-2">
              Manage your database tables, schemas, and data
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="neon-border"
              onClick={() => navigate('/database/sql')}
            >
              <Code className="mr-2 w-4 h-4" />
              SQL Editor
            </Button>
            <Button className="liquid-button pulse-glow">
              <Plus className="mr-2 w-4 h-4" />
              New Table
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tables</CardTitle>
              <Table className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{tables.length}</div>
              <p className="text-xs text-muted-foreground">in public schema</p>
            </CardContent>
          </Card>

          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
              <Database className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {tables.reduce((sum, t) => sum + t.rows.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">across all tables</p>
            </CardContent>
          </Card>

          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Indexes</CardTitle>
              <FileCode className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {tables.reduce((sum, t) => sum + t.indexes.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">optimizing queries</p>
            </CardContent>
          </Card>

          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Policies</CardTitle>
              <Eye className="w-5 h-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {tables.reduce((sum, t) => sum + t.policies.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">security rules</p>
            </CardContent>
          </Card>
        </div>

        {/* Tables List */}
        <Card className="card-elevated neon-border">
          <CardHeader>
            <CardTitle>Tables</CardTitle>
            <CardDescription>
              Click on a table to view and edit its structure and data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="group p-6 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                  onClick={() => navigate(`/database/tables/${table.name}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Table className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/database/tables/${table.name}`);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete table "${table.name}"?`)) {
                            databaseService.dropTable('public', table.name);
                            loadTables();
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                    {table.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {table.columns.length} columns • {table.rows.length} rows
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {table.columns.slice(0, 3).map((col: any) => (
                      <Badge key={col.name} variant="outline" className="text-xs">
                        {col.name}: {col.type}
                      </Badge>
                    ))}
                    {table.columns.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{table.columns.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              {/* Create New Table Card */}
              <div
                className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[200px] group"
                onClick={() => {
                  // In real app, would open a modal or navigate to create page
                  const tableName = prompt('Enter table name:');
                  if (tableName) {
                    databaseService.createTable('public', {
                      id: crypto.randomUUID(),
                      name: tableName,
                      schema: 'public',
                      columns: [
                        {
                          name: 'id',
                          type: 'UUID',
                          nullable: false,
                          primary: true,
                          default: 'gen_random_uuid()',
                        },
                        {
                          name: 'created_at',
                          type: 'TIMESTAMP',
                          nullable: false,
                          default: 'now()',
                        },
                      ],
                      rows: [],
                      indexes: [],
                      policies: [],
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                    loadTables();
                  }
                }}
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <p className="font-medium group-hover:text-primary transition-colors">
                  Create New Table
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DatabasePage;
