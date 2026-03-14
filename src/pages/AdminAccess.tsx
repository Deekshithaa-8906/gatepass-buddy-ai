import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Trash2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserRole } from '@/types';
import {
  getAllowedUsers,
  hasAdminSession,
  removeAllowedUser,
  setAdminSession,
  upsertAllowedUser,
} from '@/lib/access-control';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'advisor', label: 'Advisor' },
  { value: 'hod', label: 'HOD' },
  { value: 'warden', label: 'Warden' },
  { value: 'principal', label: 'Principal' },
];

const AdminAccess = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [canLogin, setCanLogin] = useState(true);
  const [canRegister, setCanRegister] = useState(true);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!hasAdminSession()) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const allowedUsers = useMemo(() => getAllowedUsers(), [refresh]);

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSavedMessage('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    upsertAllowedUser({
      email,
      role,
      canLogin,
      canRegister,
    });

    setSavedMessage('Access rule saved successfully.');
    setEmail('');
    setRole('student');
    setCanLogin(true);
    setCanRegister(true);
    setRefresh(v => v + 1);
  };

  const handleDelete = (id: string) => {
    removeAllowedUser(id);
    setRefresh(v => v + 1);
  };

  const handleLogout = () => {
    setAdminSession(false);
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Admin Logout
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <ShieldCheck className="w-8 h-8" />
            <span className="text-xl font-display font-bold">Access Control</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Manage Approved Users</h1>
          <p className="text-muted-foreground">
            Add user email + role and decide whether that email can create an account and log in.
          </p>
        </div>

        <form onSubmit={handleAddOrUpdate} className="card-elevated space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}
          {savedMessage && (
            <div className="bg-green-100 text-green-700 text-sm p-3 rounded-lg border border-green-200">
              {savedMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allowedEmail">User Email</Label>
              <Input
                id="allowedEmail"
                type="email"
                placeholder="Enter approved email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={v => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox id="canRegister" checked={canRegister} onCheckedChange={v => setCanRegister(v === true)} />
              <Label htmlFor="canRegister" className="text-sm font-normal cursor-pointer select-none">Allow Create Account</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="canLogin" checked={canLogin} onCheckedChange={v => setCanLogin(v === true)} />
              <Label htmlFor="canLogin" className="text-sm font-normal cursor-pointer select-none">Allow Login</Label>
            </div>
          </div>

          <Button type="submit" className="btn-hero">Save Access Rule</Button>
        </form>

        <div className="card-elevated space-y-4">
          <h2 className="text-xl font-display font-bold text-foreground">Approved Users</h2>

          {allowedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approved users added yet.</p>
          ) : (
            <div className="space-y-3">
              {allowedUsers.map(user => (
                <div key={user.id} className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground">Role: {user.role}</p>
                    <p className="text-xs text-muted-foreground">
                      Create Account: {user.canRegister ? 'Yes' : 'No'} | Login: {user.canLogin ? 'Yes' : 'No'}
                    </p>
                  </div>

                  <Button variant="destructive" size="sm" className="gap-2 w-fit" onClick={() => handleDelete(user.id)}>
                    <Trash2 className="w-4 h-4" /> Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAccess;
