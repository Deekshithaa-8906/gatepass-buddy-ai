import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setAdminSession } from '@/lib/access-control';

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@passntrack.local').trim().toLowerCase();
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Admin@123';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      setError('Invalid admin credentials');
      return;
    }

    setAdminSession(true);
    navigate('/admin/access');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <ShieldCheck className="w-8 h-8" />
            <span className="text-xl font-display font-bold">Admin Panel</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Admin Login</h1>
          <p className="text-muted-foreground">Sign in to manage approved users and roles.</p>
        </div>

        <form onSubmit={handleSubmit} className="card-elevated space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin Email</Label>
            <Input
              id="adminEmail"
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword">Admin Password</Label>
            <Input
              id="adminPassword"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full btn-hero gap-2">
            <LogIn className="w-4 h-4" /> Login as Admin
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
