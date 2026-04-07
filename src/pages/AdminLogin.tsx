import React, { useState } from 'react';
import { ShieldCheck, GraduationCap, ArrowLeft, Mail, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import bgImage from '../assets/sns-campus-bg.png';
import { supabase } from '../lib/supabase';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setErrorMessage('');

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setErrorMessage(error.message || 'Unable to sign in as admin.');
      setLoading(false);
      return;
    }

    const signedInEmail = data.user?.email?.toLowerCase().trim();

    const { data: directoryUser, error: directoryError } = await supabase
      .from('user_directory')
      .select('email, role, access_status, status, account_status')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (directoryError) {
      await supabase.auth.signOut();
      setErrorMessage('Unable to verify admin access. Please try again.');
      setLoading(false);
      return;
    }

    const accessState = (directoryUser?.access_status || directoryUser?.status || directoryUser?.account_status || '').toLowerCase().trim();
    const role = (directoryUser?.role || '').toLowerCase().trim();
    const allowedAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();

    const isAdminAccount = role === 'admin' || (allowedAdminEmail && signedInEmail === allowedAdminEmail);
    const isApproved = accessState === 'approved' || accessState === 'active' || accessState === '';

    if (!signedInEmail || !directoryUser || !isAdminAccount || !isApproved) {
      await supabase.auth.signOut();
      setErrorMessage(!directoryUser ? 'Invalid account. Please contact admin.' : 'This account does not have admin access.');
      setLoading(false);
      return;
    }

    navigate('/admin');
    setLoading(false);
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
        <Link to="/login" className="flex items-center gap-1 text-gray-800 hover:text-[#CD0000] font-medium text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-grow flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 text-center flex flex-col items-center relative overflow-hidden transition-all duration-300 m-[2px] p-8 sm:p-10">
          
          <div className="bg-[#CD0000] p-3 rounded-2xl shadow-lg mb-6 transform -rotate-3 transition-transform hover:rotate-0">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2 mb-8 w-full">
            <h1 className="font-bold text-gray-900 tracking-tight text-3xl drop-shadow-sm">
              Admin Portal
            </h1>
            <p className="text-gray-800 font-medium">Sign in to manage the system</p>
          </div>

          <form className="w-full space-y-5" onSubmit={handleAdminLogin}>
            <div className="space-y-1 text-left">
              <label className="text-sm font-semibold text-gray-900 ml-1">Admin Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-600" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/40 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 placeholder-gray-600 font-medium backdrop-blur-sm"
                  placeholder="admin@snsgroups.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-gray-900">Password</label>
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
                  placeholder="Enter admin password"
                  required
                />
              </div>
            </div>

            {errorMessage && <p className="text-sm font-semibold text-[#CD0000]">{errorMessage}</p>}

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 text-center px-6 py-3.5 mt-4 disabled:opacity-60">
              {loading ? 'Signing In...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="relative z-10 text-center py-6 font-medium text-gray-800/70 drop-shadow-sm text-[14px] text-[#ffffff]">
        © {new Date().getFullYear()} SNS Institutions. All rights reserved.
      </footer>
    </div>
  );
}

