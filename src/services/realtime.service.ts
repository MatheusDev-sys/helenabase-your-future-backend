// HelenaBase Realtime Service - WebSocket Simulation for Realtime Features

export interface RealtimeEvent {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'PRESENCE';
  table?: string;
  schema?: string;
  payload: any;
  timestamp: string;
}

export interface RealtimeChannel {
  name: string;
  subscribers: number;
  events: RealtimeEvent[];
  createdAt: string;
}

export interface PresenceState {
  userId: string;
  userName: string;
  online: boolean;
  lastSeen: string;
}

type EventCallback = (event: RealtimeEvent) => void;

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, Set<EventCallback>> = new Map();
  private presenceStates: Map<string, PresenceState> = new Map();
  private eventHistory: RealtimeEvent[] = [];

  constructor() {
    this.loadHistory();
    // Simulate some activity
    this.startSimulation();
  }

  private loadHistory(): void {
    const history = localStorage.getItem('helenabase_realtime_history');
    if (history) {
      this.eventHistory = JSON.parse(history);
    }
  }

  private saveHistory(): void {
    // Keep only last 100 events
    if (this.eventHistory.length > 100) {
      this.eventHistory = this.eventHistory.slice(-100);
    }
    localStorage.setItem('helenabase_realtime_history', JSON.stringify(this.eventHistory));
  }

  // Create or get channel
  channel(channelName: string): {
    subscribe: (callback: EventCallback) => void;
    unsubscribe: (callback: EventCallback) => void;
    send: (event: Omit<RealtimeEvent, 'id' | 'timestamp'>) => void;
  } {
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, {
        name: channelName,
        subscribers: 0,
        events: [],
        createdAt: new Date().toISOString(),
      });
      this.subscriptions.set(channelName, new Set());
    }

    const channel = this.channels.get(channelName)!;
    const callbacks = this.subscriptions.get(channelName)!;

    return {
      subscribe: (callback: EventCallback) => {
        callbacks.add(callback);
        channel.subscribers++;
      },
      unsubscribe: (callback: EventCallback) => {
        callbacks.delete(callback);
        channel.subscribers--;
      },
      send: (event: Omit<RealtimeEvent, 'id' | 'timestamp'>) => {
        const fullEvent: RealtimeEvent = {
          ...event,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        };

        channel.events.push(fullEvent);
        this.eventHistory.push(fullEvent);
        this.saveHistory();

        // Notify all subscribers
        callbacks.forEach(cb => cb(fullEvent));
      },
    };
  }

  // Get all channels
  getChannels(): RealtimeChannel[] {
    return Array.from(this.channels.values());
  }

  // Get channel info
  getChannel(name: string): RealtimeChannel | null {
    return this.channels.get(name) || null;
  }

  // Track database changes
  trackTable(schema: string, table: string, callback: EventCallback): void {
    const channelName = `${schema}:${table}`;
    const ch = this.channel(channelName);
    ch.subscribe(callback);
  }

  // Simulate database event
  emitDatabaseEvent(schema: string, table: string, type: 'INSERT' | 'UPDATE' | 'DELETE', payload: any): void {
    const channelName = `${schema}:${table}`;
    const ch = this.channel(channelName);
    ch.send({
      type,
      schema,
      table,
      payload,
    });
  }

  // Presence management
  trackPresence(channelName: string, userId: string, userName: string): void {
    const state: PresenceState = {
      userId,
      userName,
      online: true,
      lastSeen: new Date().toISOString(),
    };

    this.presenceStates.set(`${channelName}:${userId}`, state);

    // Emit presence event
    const ch = this.channel(channelName);
    ch.send({
      type: 'PRESENCE',
      payload: { action: 'join', user: state },
    });
  }

  // Leave presence
  leavePresence(channelName: string, userId: string): void {
    const key = `${channelName}:${userId}`;
    const state = this.presenceStates.get(key);
    
    if (state) {
      state.online = false;
      state.lastSeen = new Date().toISOString();

      const ch = this.channel(channelName);
      ch.send({
        type: 'PRESENCE',
        payload: { action: 'leave', user: state },
      });

      this.presenceStates.delete(key);
    }
  }

  // Get presence in channel
  getPresence(channelName: string): PresenceState[] {
    const states: PresenceState[] = [];
    this.presenceStates.forEach((state, key) => {
      if (key.startsWith(`${channelName}:`)) {
        states.push(state);
      }
    });
    return states;
  }

  // Get event history
  getEventHistory(limit: number = 50): RealtimeEvent[] {
    return this.eventHistory.slice(-limit).reverse();
  }

  // Get stats
  getStats() {
    return {
      totalChannels: this.channels.size,
      totalSubscribers: Array.from(this.channels.values()).reduce((sum, ch) => sum + ch.subscribers, 0),
      totalEvents: this.eventHistory.length,
      activePresence: this.presenceStates.size,
    };
  }

  // Simulate activity for demo purposes
  private startSimulation(): void {
    // Simulate some events every few seconds
    setInterval(() => {
      if (Math.random() > 0.7) {
        this.emitDatabaseEvent('public', 'users', 'INSERT', {
          id: crypto.randomUUID(),
          email: `user${Date.now()}@example.com`,
          name: `User ${Math.floor(Math.random() * 1000)}`,
        });
      }
    }, 5000);
  }
}

export const realtimeService = new RealtimeService();
