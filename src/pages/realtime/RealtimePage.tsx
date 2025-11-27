import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { realtimeService, type RealtimeEvent } from '@/services/realtime.service';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Radio, Users, TrendingUp, Circle } from 'lucide-react';

const RealtimePage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/auth/login');
      return;
    }

    loadData();

    // Subscribe to global events
    const channel = realtimeService.channel('global');
    channel.subscribe((event) => {
      setEvents(prev => [event, ...prev].slice(0, 50));
    });

    // Refresh data periodically
    const interval = setInterval(loadData, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [navigate]);

  const loadData = () => {
    const history = realtimeService.getEventHistory(50);
    setEvents(history);
    setChannels(realtimeService.getChannels());
  };

  const stats = realtimeService.getStats();

  const getEventColor = (type: string) => {
    switch (type) {
      case 'INSERT': return 'text-success';
      case 'UPDATE': return 'text-accent';
      case 'DELETE': return 'text-destructive';
      case 'PRESENCE': return 'text-warning';
      default: return 'text-primary';
    }
  };

  const getEventBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'INSERT': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-glow flex items-center gap-3">
            <Activity className="w-10 h-10" />
            Realtime
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor live events and subscriptions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Channels</CardTitle>
              <Radio className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalChannels}</div>
              <p className="text-xs text-muted-foreground">broadcasting</p>
            </CardContent>
          </Card>

          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
              <Users className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalSubscribers}</div>
              <p className="text-xs text-muted-foreground">connected</p>
            </CardContent>
          </Card>

          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <TrendingUp className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">all time</p>
            </CardContent>
          </Card>

          <Card className="card-elevated neon-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presence</CardTitle>
              <Circle className="w-5 h-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activePresence}</div>
              <p className="text-xs text-muted-foreground">online now</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Stream */}
          <div className="lg:col-span-2">
            <Card className="card-elevated neon-border scan-line">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Circle className="w-4 h-4 text-success animate-pulse" />
                      Live Event Stream
                    </CardTitle>
                    <CardDescription>Real-time database events</CardDescription>
                  </div>
                  <Badge variant="outline" className="animate-pulse-glow">
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {events.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Waiting for events...</p>
                    </div>
                  ) : (
                    events.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all animate-fade-in"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Circle className={`w-2 h-2 ${getEventColor(event.type)} animate-pulse`} />
                            <Badge variant={getEventBadgeVariant(event.type)}>
                              {event.type}
                            </Badge>
                            {event.table && (
                              <Badge variant="outline" className="text-xs">
                                {event.schema}.{event.table}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="pl-4 border-l-2 border-primary/30">
                          <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={eventsEndRef} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Channels Sidebar */}
          <div>
            <Card className="card-elevated neon-border">
              <CardHeader>
                <CardTitle>Active Channels</CardTitle>
                <CardDescription>Broadcasting channels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {channels.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No active channels
                    </p>
                  ) : (
                    channels.map((channel) => (
                      <div
                        key={channel.name}
                        className="p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Circle className="w-2 h-2 text-success animate-pulse" />
                            <span className="font-medium text-sm">{channel.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {channel.subscribers}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {channel.events.length} events
                        </p>
                      </div>
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

export default RealtimePage;
