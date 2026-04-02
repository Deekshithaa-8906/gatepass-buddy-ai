import React, { useState, useEffect } from 'react';
import { Lock, GraduationCap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import bgImage from '../assets/sns-campus-bg.png';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function CreatePassword() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [role, setRole] = useState<'student' | 'mentor' | 'hod' | 'principal'>('student');

  // If already created, send to onboarding
  useEffect(() => {
    if (profile?.role) {
      setRole(profile.role as 'student' | 'mentor' | 'hod' | 'principal');
    }
    if (profile?.password_created) {
      if (profile.role === 'student' && !profile.onboarding_complete) {
        navigate('/student-onboarding');
      } else if (profile.role === 'mentor' || profile.role === 'hod' || profile.role === 'advisor') {
        navigate('/staff-dashboard');
      } else if (profile.role === 'principal') {
        navigate('/principal-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    }
  }, [profile, navigate]);

  const routeByRole = (value: string) => {
    if (value === 'principal') return '/principal-dashboard';
    if (value === 'mentor' || value === 'hod') return '/staff-dashboard';
    return '/student-onboarding';
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setMsg("Passwords do not match"); setIsError(true); return; }
    if (password.length < 6) { setMsg("Password must be at least 6 characters"); setIsError(true); return; }

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
        role,
        status: role === 'student' ? 'approved' : 'active',
        account_status: role === 'student' ? 'inactive' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('email', user?.email ?? '');
    
    await refreshProfile();
    setMsg('Password created successfully! Redirecting...');
    setTimeout(() => navigate(routeByRole(role)), 1200);
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
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'student' | 'mentor' | 'hod' | 'principal')}
                className="w-full px-4 py-3 bg-white/50 border border-white/40 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none appearance-none text-gray-900 font-medium backdrop-blur-sm cursor-pointer hover:border-white/60 transition-all"
              >
                <option value="student">Student</option>
                <option value="mentor">Teacher</option>
                <option value="hod">HOD</option>
                <option value="principal">Principal</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              </div>
            </div>
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-xl outline-none text-gray-900"
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-xl outline-none text-gray-900"
              required
            />
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
