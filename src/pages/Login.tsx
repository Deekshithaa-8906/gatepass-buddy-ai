import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(phone, password);
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
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <Shield className="w-8 h-8" />
            <span className="text-xl font-display font-bold">SNS Institutions</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Login</h1>
          <p className="text-muted-foreground">Enter your phone number and password</p>
        </div>

        <form onSubmit={handleSubmit} className="card-elevated space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" placeholder="Enter phone number" value={phone} onChange={e => setPhone(e.target.value)} required />
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
