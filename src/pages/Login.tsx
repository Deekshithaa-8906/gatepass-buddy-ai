import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(identifier, password);
    if (result.success) {
      const user = JSON.parse(localStorage.getItem('gatepass_current_user') || '{}');
      const dashMap: Record<string, string> = {
        student: '/student',
        mentor: '/staff',
        advisor: '/staff',
        hod: '/staff',
        warden: '/warden',
      };
      navigate(dashMap[user.role] || '/');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Button>
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <MapPin className="w-8 h-8" />
            <span className="text-xl font-display font-bold">PassNTrack</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Login</h1>
          <p className="text-muted-foreground">Enter your phone number or email and password</p>
        </div>

        <form onSubmit={handleSubmit} className="card-elevated space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="identifier">Phone Number or Email</Label>
            <Input id="identifier" placeholder="Enter phone number or email" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full btn-hero gap-2">
            <LogIn className="w-4 h-4" /> Login
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Create Account</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
