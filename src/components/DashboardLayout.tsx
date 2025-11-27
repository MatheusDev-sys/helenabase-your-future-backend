import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Cloud, 
  Activity, 
  Zap, 
  Shield,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Shield, label: 'Authentication', path: '/auth' },
    { icon: Database, label: 'Database', path: '/database' },
    { icon: Cloud, label: 'Storage', path: '/storage' },
    { icon: Activity, label: 'Realtime', path: '/realtime' },
    { icon: Zap, label: 'Edge Functions', path: '/functions' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full transition-all duration-300 border-r border-border bg-card',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center neon-glow">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              {sidebarOpen && (
                <span className="text-xl font-bold text-glow">HelenaBase</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-primary/10"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    isActive 
                      ? 'bg-primary text-primary-foreground neon-glow' 
                      : 'hover:bg-primary/10 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            {sidebarOpen ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {user?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full neon-border"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 w-4 h-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="w-full neon-border"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-20'
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
