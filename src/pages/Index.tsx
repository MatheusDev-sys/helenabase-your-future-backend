import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Database, Zap, Shield, Cloud, ArrowRight, Sparkles } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if already authenticated
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const features = [
    {
      icon: Database,
      title: 'SQL Database',
      description: 'Full-featured PostgreSQL with visual editor and real-time sync',
    },
    {
      icon: Shield,
      title: 'Authentication',
      description: 'Built-in auth with email, OAuth, MFA, and advanced security',
    },
    {
      icon: Cloud,
      title: 'Storage',
      description: 'Unlimited file storage with CDN, versioning, and previews',
    },
    {
      icon: Zap,
      title: 'Edge Functions',
      description: 'Serverless functions that scale automatically with your needs',
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 grid-background opacity-20" />
      <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <nav className={`flex justify-between items-center mb-20 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center neon-glow">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-glow">HelenaBase</h1>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/auth/login')}
              className="neon-border"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/auth/register')}
              className="liquid-button relative overflow-hidden"
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className={`text-center mb-32 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
            The Future of<br />Backend Development
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Build production-ready backends in minutes. Complete database, auth, storage, and serverless functions - all in one beautiful platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/auth/register')}
              className="liquid-button relative overflow-hidden text-lg px-8 py-6 pulse-glow"
            >
              Start Building Free
              <Sparkles className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="neon-border text-lg px-8 py-6"
            >
              View Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="card-elevated rounded-2xl p-6 border border-border hover:border-primary transition-all duration-300 hover:scale-105 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className={`card-elevated rounded-3xl p-12 border border-border holographic transition-all duration-1000 delay-600 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent mb-2">&lt;50ms</div>
              <div className="text-muted-foreground">Global Latency</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-success mb-2">1M+</div>
              <div className="text-muted-foreground">Requests/sec</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-warning mb-2">∞</div>
              <div className="text-muted-foreground">Scale</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-20 text-muted-foreground">
          <p>© 2024 HelenaBase. Built with passion for Helena.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
