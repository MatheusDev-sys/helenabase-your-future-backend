import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles, Mail, Lock, ArrowLeft } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        toast.success('Welcome back!', {
          description: 'Redirecting to dashboard...',
        });
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        toast.error('Login failed', {
          description: result.error,
        });
      }
    } catch (error: any) {
      toast.error('An error occurred', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-background opacity-20" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8 neon-border"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Home
        </Button>

        {/* Login Card */}
        <div className="card-elevated rounded-3xl p-8 border border-border animate-fade-in">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center neon-glow">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-glow">HelenaBase</h1>
          </div>

          <h2 className="text-2xl font-semibold text-center mb-2">Welcome Back</h2>
          <p className="text-muted-foreground text-center mb-8">
            Sign in to continue to your dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="neon-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="neon-border"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link
                to="/auth/forgot-password"
                className="text-primary hover:text-primary-glow transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full liquid-button pulse-glow"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link
              to="/auth/register"
              className="text-primary hover:text-primary-glow transition-colors font-semibold"
            >
              Sign up
            </Link>
          </div>

          {/* OAuth Section */}
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Or continue with
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="neon-border" onClick={() => toast.info('OAuth demo - Google')}>
                Google
              </Button>
              <Button variant="outline" className="neon-border" onClick={() => toast.info('OAuth demo - GitHub')}>
                GitHub
              </Button>
              <Button variant="outline" className="neon-border" onClick={() => toast.info('OAuth demo - Discord')}>
                Discord
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
