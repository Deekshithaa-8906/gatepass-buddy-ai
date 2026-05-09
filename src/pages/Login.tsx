import React, { useState } from 'react';
import { GraduationCap, ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import bgImage from '../assets/sns-campus-bg.png';
import { supabase } from '../lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const routeByRole = (role: string) => {
    if (role === 'admin') return '/admin';
    if (role === 'principal') return '/principal-dashboard';
    if (role === 'warden') return '/warden-dashboard';
    if (role === 'staff' || role === 'mentor' || role === 'advisor' || role === 'hod') return '/staff-dashboard';
    return '/student-dashboard';
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    const { error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (authError) {
      const { data: lookupUser } = await supabase
        .from('user_directory')
        .select('email, role, access_status, password_created')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (lookupUser && lookupUser.password_created === false) {
        setError('Password is not created for this account. Ask admin to click Resend Link from Recently Verified Users.');
      } else if (lookupUser && lookupUser.access_status === 'pending_approval') {
        setError('Your account is pending admin approval.');
      } else if (lookupUser && lookupUser.access_status === 'rejected') {
        setError('Your account request was rejected. Please contact admin.');
      } else {
        setError('Invalid login credentials');
      }

      setLoading(false);
      return;
    }

    const { data: directoryUser, error: dirError } = await supabase
      .from('user_directory')
      .select('email, role, access_status, account_status, password_created, onboarding_complete')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (dirError) {
      setError('Unable to verify account access. Please try again.');
      setLoading(false);
      return;
    }

    if (!directoryUser) {
      await supabase.auth.signOut();
      setError('Account does not exist. Please create an account first.');
      setLoading(false);
      return;
    }

    if (directoryUser.access_status === 'pending_approval') {
      await supabase.auth.signOut();
      setError('Your account is pending admin approval.');
      setLoading(false);
      return;
    }

    if (directoryUser.access_status === 'rejected') {
      await supabase.auth.signOut();
      setError('Your account request was rejected. Please contact admin.');
      setLoading(false);
      return;
    }

    if (!directoryUser.password_created) {
      setLoading(false);
      navigate('/create-password');
      return;
    }

    if (!directoryUser.onboarding_complete) {
      setLoading(false);
      navigate('/onboarding');
      return;
    }

    setLoading(false);
    navigate(routeByRole(directoryUser.role));
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans overflow-hidden">
      {/* Background Image Setup */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-1000 scale-100"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Subtle Color Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/20 z-0" />

      {/* Header */}
      <header className="relative z-10 w-full px-8 py-6 flex justify-between items-center bg-[#ffececab]">
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-[#CD0000] p-1.5 rounded-lg shadow-sm transition-transform group-hover:scale-105">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 drop-shadow-sm">PassN<span className="text-[#CD0000]">Track&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span>
        </Link>
        <Link to="/" className="flex items-center gap-1 text-gray-800 hover:text-[#CD0000] font-medium text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-grow flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 text-center flex flex-col items-center relative overflow-hidden transition-all duration-300 m-[2px] p-8 sm:p-10">
          
          

          <div className="space-y-2 mb-8 w-full">
            <h1 className="font-bold text-gray-900 tracking-tight text-3xl drop-shadow-sm">
              Welcome Back
            </h1>
            <p className="text-gray-800 font-medium">Sign in to your account</p>
          </div>

          <form className="w-full space-y-5" onSubmit={handleSignIn}>
            <div className="space-y-1 text-left">
              <label className="text-sm font-semibold text-gray-900 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-600" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/40 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 placeholder-gray-600 font-medium backdrop-blur-sm"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-gray-900">Password</label>
                <Link to="/forgot-password" className="text-xs font-bold text-[#CD0000] hover:underline">Forgot Password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-600" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/40 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 placeholder-gray-600 font-medium backdrop-blur-sm"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-100/50 border border-red-300/50 rounded-xl p-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            )}

            <div className="flex items-center ml-1 pl-[80px] pr-[0px] pt-[4px] pb-[8px]">
              <div className="text-sm font-medium text-gray-900">
                Admin?{' '}
                <Link to="/admin-login" className="font-bold text-[#CD0000] hover:underline">
                  Login to manage access
                </Link>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#CD0000] hover:bg-[#a80000] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 text-center px-6 py-3.5 mt-2">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-sm font-medium text-gray-900">
            Don't have an account yet?{' '}
            <Link to="/create-account" className="font-bold text-[#CD0000] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="relative z-10 text-center py-6 font-medium text-gray-800/70 drop-shadow-sm text-[14px] text-[#ffffff]">
        © {new Date().getFullYear()} SNS Institutions. All rights reserved.
      </footer>
    </div>
  );
}

