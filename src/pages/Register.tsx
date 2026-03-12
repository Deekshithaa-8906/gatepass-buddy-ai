import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { MapPin, UserPlus, CheckCircle, ArrowLeft, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'advisor', label: 'Advisor' },
  { value: 'hod', label: 'HOD' },
  { value: 'warden', label: 'Warden' },
  { value: 'principal', label: 'Principal' },
  { value: 'management', label: 'Management' },
];

const Register = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      setError('Photo must be under 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone && !email) {
      setError('Please provide at least a phone number or email');
      return;
    }
    const result = register({ name, phone, email, password, role, profilePhoto: profilePhoto || undefined });
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card-elevated text-center space-y-4 max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-success mx-auto" />
          <h2 className="text-2xl font-display font-bold text-foreground">Account Created Successfully!</h2>
          <p className="text-muted-foreground">You can now login with your phone number or email on <strong>PassNTrack</strong>.</p>
          <Button className="btn-hero" onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-display font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground">Register for PassNTrack gatepass system</p>
        </div>

        <form onSubmit={handleSubmit} className="card-elevated space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">{error}</div>
          )}

          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center gap-2">
            <Label className="text-sm font-semibold">Profile Photo</Label>
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-primary/20">
                <AvatarImage src={profilePhoto} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                  {name ? name.charAt(0).toUpperCase() : '?'}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
            <span className="text-xs text-muted-foreground">Optional · Max 500KB</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Enter full name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" placeholder="Enter phone number" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter email address" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Create password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={v => setRole(v as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full btn-hero gap-2">
            <UserPlus className="w-4 h-4" /> Create Account
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
