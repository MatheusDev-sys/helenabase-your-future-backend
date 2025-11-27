import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { databaseService } from '@/services/database.service';
import { storageService } from '@/services/storage.service';
import { realtimeService } from '@/services/realtime.service';
import { functionsService } from '@/services/functions.service';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Database, 
  Cloud, 
  Activity, 
  Zap, 
  Users,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/auth/login');
    }
  }, [navigate]);

  const user = authService.getCurrentUser();
  const dbStats = {
    tables: databaseService.getTables('public').length,
    schemas: databaseService.getSchemas().length,
  };
  const storageStats = storageService.getStorageStats();
  const realtimeStats = realtimeService.getStats();
  const functionsStats = functionsService.getStats();

  const stats = [
    {
      title: 'Database Tables',
      value: dbStats.tables,
      description: `${dbStats.schemas} schema(s)`,
      icon: Database,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Storage',
      value: storageStats.formattedSize,
      description: `${storageStats.totalFiles} files`,
      icon: Cloud,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Realtime Channels',
      value: realtimeStats.totalChannels,
      description: `${realtimeStats.totalEvents} events`,
      icon: Activity,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Edge Functions',
      value: functionsStats.totalFunctions,
      description: `${functionsStats.successRate}% success rate`,
      icon: Zap,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  const recentActivity = [
    { icon: Users, text: 'New user registered', time: '2 minutes ago', color: 'text-primary' },
    { icon: Database, text: 'Table "users" updated', time: '5 minutes ago', color: 'text-accent' },
    { icon: Cloud, text: 'File uploaded to storage', time: '10 minutes ago', color: 'text-success' },
    { icon: CheckCircle, text: 'Function executed successfully', time: '15 minutes ago', color: 'text-warning' },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-glow">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your HelenaBase project
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className="card-elevated neon-border hover:scale-105 transition-transform duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <Card className="card-elevated neon-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <CardTitle>Performance</CardTitle>
              </div>
              <CardDescription>
                API response times over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center neon-glow animate-pulse-glow">
                    <div className="text-4xl font-bold">99.9%</div>
                  </div>
                  <p className="text-muted-foreground">Average Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="card-elevated neon-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
              <CardDescription>
                Latest events in your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.text}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="card-elevated neon-border holographic">
          <CardHeader>
            <CardTitle className="text-2xl">Quick Actions</CardTitle>
            <CardDescription>
              Jump to common tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Create Table', path: '/database', icon: Database },
                { label: 'Upload File', path: '/storage', icon: Cloud },
                { label: 'Monitor Events', path: '/realtime', icon: Activity },
                { label: 'New Function', path: '/functions', icon: Zap },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="p-6 rounded-xl border border-border hover:border-primary bg-card hover:bg-primary/5 transition-all duration-200 group"
                  >
                    <Icon className="w-8 h-8 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium">{action.label}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
