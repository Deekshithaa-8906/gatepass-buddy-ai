import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setIsError(true);
      return;
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message || 'Unable to update your password.');
      setIsError(true);
      setLoading(false);
      return;
    }

    setMessage('Password updated successfully. Redirecting to login...');
    setTimeout(() => navigate('/login'), 1200);
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
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-[520px] rounded-[30px] border border-white/15 bg-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="px-6 sm:px-8 pt-8 pb-6 text-center">
            <div className="mx-auto w-18 h-18 rounded-full bg-[#e8fff0] flex items-center justify-center shadow-sm relative">
              <ShieldCheck className="w-9 h-9 text-[#10b759]" />
              <div className="absolute -right-1 -bottom-1 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md">
                <Lock className="w-4 h-4 text-[#CD0000]" />
              </div>
            </div>
            <h1 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight text-white">Create New Password</h1>
            <p className="mt-2 text-sm sm:text-base text-white/80">Choose a new password for your PassNTrack account and continue to login.</p>
          </div>

          <div className="px-6 sm:px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-white/85 border border-white/60 p-5 sm:p-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-gray-900 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20"
                  placeholder="Enter a new password"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-gray-900 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20"
                  placeholder="Re-enter the new password"
                  required
                />
              </div>
              {message && <p className={`text-sm font-semibold ${isError ? 'text-red-600' : 'text-green-700'}`}>{message}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#CD0000] hover:bg-[#a80000] disabled:bg-gray-400 text-white py-3.5 rounded-xl font-bold transition-all"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;