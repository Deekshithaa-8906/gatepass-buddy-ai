import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const email = identifier.trim().toLowerCase();
    if (!email) {
      setError('Enter the email address used for your account.');
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message || 'Unable to send reset link.');
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-neutral-900 to-black" />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(205,0,0,0.35), transparent 28%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.15), transparent 24%), radial-gradient(circle at 50% 80%, rgba(205,0,0,0.18), transparent 26%)' }} />

      <header className="relative z-10 w-full px-6 sm:px-8 py-5 flex justify-between items-center border-b border-white/10 bg-white/5 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-[#CD0000] p-1.5 rounded-lg shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">PassN<span className="text-[#CD0000]">Track</span></span>
        </Link>
        <Button variant="ghost" size="sm" className="gap-2 text-white/80 hover:text-white hover:bg-white/10" onClick={() => navigate('/login')}>
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Button>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-[520px] rounded-[30px] border border-white/15 bg-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="px-6 sm:px-8 pt-8 pb-6 text-center">
            <div className="mx-auto w-18 h-18 rounded-full bg-[#e8fff0] flex items-center justify-center shadow-sm relative">
              <ShieldCheck className="w-9 h-9 text-[#10b759]" />
              <div className="absolute -right-1 -bottom-1 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md">
                <Mail className="w-4 h-4 text-[#CD0000]" />
              </div>
            </div>
            <h1 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight text-white">Reset Password</h1>
            <p className="mt-2 text-sm sm:text-base text-white/80">Enter the email address linked to your account. We will send a reset link to that inbox.</p>
          </div>

          <div className="px-6 sm:px-8 pb-8">
          {submitted ? (
            <div className="text-center space-y-4 py-6 px-4 bg-white/85 rounded-3xl border border-white/60">
              <Mail className="w-12 h-12 mx-auto text-[#CD0000]" />
              <h2 className="text-lg font-semibold text-gray-900">Reset Link Sent</h2>
              <p className="text-sm text-gray-600">
                If an account exists with <strong>{identifier}</strong>, you will receive a password reset link shortly.
              </p>
              <Button variant="outline" className="mt-2" onClick={() => navigate('/login')}>
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-identifier" className="text-white/90">Email Address</Label>
                <Input
                  id="reset-identifier"
                  type="email"
                  placeholder="Enter your email address"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                  className="bg-white/90"
                />
              </div>
              {error && <p className="text-sm font-semibold text-red-200">{error}</p>}
              <Button type="submit" className="w-full bg-[#CD0000] hover:bg-[#a80000] text-white font-bold" disabled={loading}>
                {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
