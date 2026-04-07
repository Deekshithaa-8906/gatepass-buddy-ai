import React, { useState, useEffect } from 'react';
import { Lock, GraduationCap, Eye, EyeOff, Check, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import bgImage from '../assets/sns-campus-bg.png';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type AppRole = 'student' | 'staff' | 'mentor' | 'advisor' | 'hod' | 'warden' | 'principal' | 'admin';

const getPasswordChecks = (value: string) => ({
  minLength: value.length >= 8,
  uppercase: /[A-Z]/.test(value),
  lowercase: /[a-z]/.test(value),
  number: /\d/.test(value),
  special: /[^A-Za-z0-9]/.test(value),
});

export function CreatePassword() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resolvedRole: AppRole = (profile?.role as AppRole) ?? 'student';
  const checks = getPasswordChecks(password);
  const checksPassed = Object.values(checks).filter(Boolean).length;

  let strengthLabel: 'Weak' | 'Medium' | 'Strong' = 'Weak';
  let strengthColor = 'bg-red-500';
  if (checksPassed === 5) {
    strengthLabel = 'Strong';
    strengthColor = 'bg-green-500';
  } else if (checksPassed >= 3) {
    strengthLabel = 'Medium';
    strengthColor = 'bg-orange-500';
  }
  const strengthPercent = Math.max(10, (checksPassed / 5) * 100);

  // If already created, send to onboarding
  useEffect(() => {
    if (profile?.password_created) {
      if (profile.role === 'student' && !profile.onboarding_complete) {
        navigate('/student-onboarding');
      } else if (profile.role === 'staff' || profile.role === 'mentor' || profile.role === 'hod' || profile.role === 'advisor') {
        navigate('/staff-dashboard');
      } else if (profile.role === 'principal') {
        navigate('/principal-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    }
  }, [profile, navigate]);

  const routeByRole = (value: string) => {
    if (value === 'admin') return '/admin';
    if (value === 'principal') return '/principal-dashboard';
    if (value === 'staff' || value === 'mentor' || value === 'hod' || value === 'advisor' || value === 'warden') return '/staff-dashboard';
    return '/student-onboarding';
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setMsg("Passwords do not match"); setIsError(true); return; }
    if (checksPassed < 5) {
      setMsg('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      setIsError(true);
      return;
    }

    setLoading(true);
    setMsg('');
    setIsError(false);

    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) { setMsg(authError.message); setIsError(true); setLoading(false); return; }

    // Update Directory
    await supabase
      .from('user_directory')
      .update({
        password_created: true,
        role: resolvedRole,
        status: resolvedRole === 'student' ? 'approved' : 'active',
        account_status: resolvedRole === 'student' ? 'inactive' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('email', user?.email ?? '');
    
    await refreshProfile();
    setMsg('Password created successfully! Redirecting...');
    setTimeout(() => navigate(routeByRole(resolvedRole)), 1200);
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans overflow-hidden bg-gray-50">
      <div
        className="absolute inset-0 bg-cover bg-center z-0 scale-1 scale-100"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-black/20 z-0" />

      <header className="relative z-20 w-full px-8 py-6 flex justify-between items-center bg-white/40 backdrop-blur-md border-b border-white/40">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-[#CD0000] p-1.5 rounded-lg shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">PassN<span className="text-[#CD0000]">Track</span></span>
        </Link>
      </header>

      <main className="relative z-20 flex-grow flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full bg-white/30 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 text-center flex flex-col items-center p-8 sm:p-10 transition-all duration-300 transform hover:scale-[1.01]">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Create Password</h1>
          <p className="text-gray-800 font-medium mb-8 leading-relaxed">Secure your new account to continue!</p>
          <form className="w-full space-y-5" onSubmit={handleCreate}>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 pr-12 py-3.5 bg-white/90 border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none text-gray-900 placeholder:text-gray-500 shadow-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-gray-600 hover:text-gray-900"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {password && (
              <div className="rounded-xl bg-white/85 border border-gray-200 p-3 text-left shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Password strength</span>
                  <span className={`text-sm font-bold ${strengthLabel === 'Strong' ? 'text-green-700' : strengthLabel === 'Medium' ? 'text-orange-700' : 'text-red-700'}`}>
                    {strengthLabel}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full ${strengthColor} transition-all duration-300`}
                    style={{ width: `${strengthPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-gray-700">
                    {checks.minLength ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                    At least 8 characters
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    {checks.uppercase ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                    One uppercase letter
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    {checks.lowercase ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                    One lowercase letter
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    {checks.number ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                    One number
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
                    {checks.special ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                    One special character
                  </div>
                </div>
              </div>
            )}

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 pr-12 py-3.5 bg-white/90 border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none text-gray-900 placeholder:text-gray-500 shadow-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-gray-600 hover:text-gray-900"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {msg && <p className={`text-sm font-semibold ${isError ? 'text-[#CD0000]' : 'text-green-600'}`}>{msg}</p>}
            <button type="submit" disabled={loading} className="w-full bg-[#CD0000] text-white py-4 rounded-xl font-bold shadow-md active:scale-95">
              {loading ? 'Creating...' : 'Create Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
