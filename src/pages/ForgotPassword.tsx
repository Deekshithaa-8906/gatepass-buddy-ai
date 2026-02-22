import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulated reset — in production this would send an email/SMS
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => navigate('/login')}>
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Button>
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <MapPin className="w-8 h-8" />
            <span className="text-xl font-display font-bold">PassNTrack</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Reset Password</h1>
          <p className="text-muted-foreground">Enter your phone number or email to reset your password</p>
        </div>

        <div className="card-elevated space-y-4">
          {submitted ? (
            <div className="text-center space-y-3 py-4">
              <Mail className="w-12 h-12 mx-auto text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Reset Link Sent</h2>
              <p className="text-sm text-muted-foreground">
                If an account exists with <strong>{identifier}</strong>, you will receive a password reset link shortly.
              </p>
              <Button variant="outline" className="mt-2" onClick={() => navigate('/login')}>
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-identifier">Phone Number or Email</Label>
                <Input
                  id="reset-identifier"
                  placeholder="Enter phone number or email"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full btn-hero">
                Send Reset Link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
