import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles, Mail, Lock, User, ArrowLeft, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['text-destructive', 'text-warning', 'text-warning', 'text-success', 'text-success'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authService.register(email, password, name);
      
      if (result.success) {
        toast.success('Account created!', {
          description: 'Please check your email to verify your account.',
        });
        
        // Simulate email verification
        setTimeout(() => {
          if (result.user) {
            authService.verifyEmail(result.user.id);
          }
        }, 2000);

        setTimeout(() => {
          navigate('/auth/login');
        }, 1000);
      } else {
        toast.error('Registration failed', {
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
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center py-12">
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

        {/* Register Card */}
        <div className="card-elevated rounded-3xl p-8 border border-border animate-fade-in">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center neon-glow">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-glow">HelenaBase</h1>
          </div>

          <h2 className="text-2xl font-semibold text-center mb-2">Create Account</h2>
          <p className="text-muted-foreground text-center mb-8">
            Start building your backend in seconds
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="neon-border"
              />
            </div>

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
              
              {password && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          strengthScore === 1 && 'w-1/5 bg-destructive',
                          strengthScore === 2 && 'w-2/5 bg-warning',
                          strengthScore === 3 && 'w-3/5 bg-warning',
                          strengthScore === 4 && 'w-4/5 bg-success',
                          strengthScore === 5 && 'w-full bg-success'
                        )}
                      />
                    </div>
                    <span className={cn('text-xs font-medium', strengthColors[strengthScore - 1])}>
                      {strengthLabels[strengthScore - 1]}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      {passwordStrength.length ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <X className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className={passwordStrength.length ? 'text-success' : 'text-muted-foreground'}>
                        8+ characters
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordStrength.uppercase ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <X className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className={passwordStrength.uppercase ? 'text-success' : 'text-muted-foreground'}>
                        Uppercase
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordStrength.lowercase ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <X className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className={passwordStrength.lowercase ? 'text-success' : 'text-muted-foreground'}>
                        Lowercase
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordStrength.number ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <X className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className={passwordStrength.number ? 'text-success' : 'text-muted-foreground'}>
                        Number
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full liquid-button pulse-glow"
              size="lg"
              disabled={loading || strengthScore < 3}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              to="/auth/login"
              className="text-primary hover:text-primary-glow transition-colors font-semibold"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
