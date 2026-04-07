import React, { useState } from 'react';
import { LogIn, GraduationCap, ArrowLeft, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import bgImage from '../assets/sns-campus-bg.png';
import { supabase } from '../lib/supabase';

export function CreateAccount() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'staff' | 'hod' | 'warden' | 'principal'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (value: string) => {
    return value.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Check if user already exists in user_directory
      const { data: existingUser, error: checkError } = await supabase
        .from('user_directory')
        .select('status, email, role')
        .eq('email', email)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        setError('Error checking registration. Please try again.');
        setLoading(false);
        return;
      }

      if (existingUser) {
        if (existingUser.status === 'pending') {
          setError('This email is already registered. Your account is pending admin approval. Please check your email or contact support.');
        } else if (existingUser.status === 'approved') {
          setError('This email is already registered and approved. Please log in instead.');
        } else {
          setError('This email is already registered. Please try another email or contact support.');
        }
        setLoading(false);
        return;
      }

      const { error: otpError } = await supabase.functions.invoke('registration-otp', {
        body: {
          action: 'send',
          email: email.trim().toLowerCase(),
          role: selectedRole,
        },
      });

      if (otpError) {
        setError(otpError.message || 'Failed to send OTP. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess('Verification code sent successfully! Check your email.');
      setLoading(false);

      // Navigate to OTP verification page after a short delay
      setTimeout(() => {
        navigate('/verify-otp', { state: { email: email.trim().toLowerCase(), role: selectedRole } });
      }, 1500);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
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
              Create Account
            </h1>
            <p className="text-gray-800 font-medium">Verify your email to continue</p>
          </div>

          <form className="w-full space-y-6" onSubmit={handleVerifyEmail}>
            <div className="space-y-1 text-left">
              <label className="text-sm font-semibold text-gray-900 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-600" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/40 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 placeholder-gray-600 font-medium backdrop-blur-sm"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-sm font-semibold text-gray-900 ml-1">Role</label>
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'student' | 'staff' | 'hod' | 'warden' | 'principal')}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/50 border border-white/40 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none appearance-none transition-all text-gray-900 font-medium backdrop-blur-sm cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="hod">HOD</option>
                  <option value="warden">Warden</option>
                  <option value="principal">Principal</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-100/50 border border-red-300/50 rounded-xl p-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 bg-green-100/50 border border-green-300/50 rounded-xl p-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-green-700">{success}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#CD0000] hover:bg-[#a80000] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 text-center px-6 py-3.5 mt-4"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          <div className="mt-8 text-sm font-medium text-gray-900">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#CD0000] hover:underline">
              Sign in
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

