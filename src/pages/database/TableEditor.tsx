import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { databaseService } from '@/services/database.service';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, Plus, Edit, Trash2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const TableEditor = () => {
  const { tableName } = useParams<{ tableName: string }>();
  const navigate = useNavigate();
  const [table, setTable] = useState<any>(null);
  const [editingRow, setEditingRow] = useState<any>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/auth/login');
      return;
    }

    loadTable();
  }, [tableName, navigate]);

  const loadTable = () => {
    if (!tableName) return;
    const loadedTable = databaseService.getTable('public', tableName);
    setTable(loadedTable);
  };

  const handleAddRow = () => {
    if (!table) return;
    
    const newRow: any = {};
    table.columns.forEach((col: any) => {
      if (col.default === 'gen_random_uuid()') {
        newRow[col.name] = crypto.randomUUID();
      } else if (col.default === 'now()') {
        newRow[col.name] = new Date().toISOString();
      } else {
        newRow[col.name] = '';
      }
    });
    
    setEditingRow(newRow);
  };

  const handleSaveRow = () => {
    if (!table || !editingRow) return;

    const result = databaseService.insert('public', table.name, editingRow);
    if (result.success) {
      toast.success('Row added successfully');
      setEditingRow(null);
      loadTable();
    } else {
      toast.error('Failed to add row', { description: result.error });
    }
  };

  const handleDeleteRow = (row: any) => {
    if (!table) return;

    const primaryKey = table.columns.find((c: any) => c.primary);
    if (!primaryKey) {
      toast.error('Cannot delete row without primary key');
      return;
    }

    if (confirm('Delete this row?')) {
      const result = databaseService.delete('public', table.name, {
        [primaryKey.name]: row[primaryKey.name],
      });
      
      if (result.success) {
        toast.success('Row deleted');
        loadTable();
      } else {
        toast.error('Failed to delete row');
      }
    }
  };

  if (!table) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Table not found</p>
            <Button 
              className="mt-4"
              onClick={() => navigate('/database')}
            >
              Back to Database
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
              <h1 className="text-4xl font-bold text-glow flex items-center gap-3">
                <Table className="w-10 h-10" />
                {table.name}
              </h1>
              <p className="text-muted-foreground mt-2">
                {table.columns.length} columns • {table.rows.length} rows
              </p>
            </div>
          </div>
          <Button 
            className="liquid-button pulse-glow"
            onClick={handleAddRow}
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Row
          </Button>
        </div>

        {/* Table Structure */}
        <Card className="card-elevated neon-border">
          <CardHeader>
            <CardTitle>Structure</CardTitle>
            <CardDescription>Table columns and constraints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {table.columns.map((col: any) => (
                <div
                  key={col.name}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{col.name}</span>
                    <Badge variant="outline">{col.type}</Badge>
                    {col.primary && <Badge className="bg-primary">PRIMARY KEY</Badge>}
                    {col.unique && <Badge variant="secondary">UNIQUE</Badge>}
                    {col.nullable === false && <Badge variant="secondary">NOT NULL</Badge>}
                  </div>
                  {col.default && (
                    <span className="text-sm text-muted-foreground">
                      default: {col.default}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="card-elevated neon-border">
          <CardHeader>
            <CardTitle>Data</CardTitle>
            <CardDescription>Rows in this table</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      {table.columns.map((col: any) => (
                        <th key={col.name} className="px-4 py-3 text-left text-sm font-medium">
                          {col.name}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-sm font-medium w-24">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Editing Row */}
                    {editingRow && (
                      <tr className="border-t border-primary bg-primary/5">
                        {table.columns.map((col: any) => (
                          <td key={col.name} className="px-4 py-2">
                            <Input
                              value={editingRow[col.name] || ''}
                              onChange={(e) =>
                                setEditingRow({ ...editingRow, [col.name]: e.target.value })
                              }
                              placeholder={col.type}
                              className="h-8"
                              disabled={col.primary || col.default === 'gen_random_uuid()' || col.default === 'now()'}
                            />
                          </td>
                        ))}
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingRow(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="liquid-button"
                              onClick={handleSaveRow}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Existing Rows */}
                    {table.rows.map((row: any, index: number) => (
                      <tr key={index} className="border-t border-border hover:bg-muted/50">
                        {table.columns.map((col: any) => (
                          <td key={col.name} className="px-4 py-3 text-sm">
                            {typeof row[col.name] === 'object'
                              ? JSON.stringify(row[col.name])
                              : String(row[col.name] || '')}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteRow(row)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {table.rows.length === 0 && !editingRow && (
                      <tr>
                        <td
                          colSpan={table.columns.length + 1}
                          className="px-4 py-12 text-center text-muted-foreground"
                        >
                          No rows yet. Click "Add Row" to insert data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TableEditor;
