import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import bgImage from '../assets/sns-campus-bg.png';

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
          
          <div className="space-y-2 mb-8 w-full">
            <h1 className="font-bold text-gray-900 tracking-tight text-3xl drop-shadow-sm">
              Reset Password
            </h1>
            <p className="text-gray-800 font-medium">Enter your email to receive a secure reset link</p>
          </div>

          <div className="w-full">
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <Mail className="w-12 h-12 mx-auto text-[#CD0000]" />
              <h2 className="text-lg font-bold text-gray-900">Reset Link Sent</h2>
              <p className="text-sm font-medium text-gray-800">
                If an account exists with <strong>{identifier}</strong>, you will receive a password reset link shortly.
              </p>
              <button onClick={() => navigate('/login')} className="w-full mt-4 flex items-center justify-center gap-2 bg-[#CD0000] hover:bg-[#a80000] text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 px-6 py-3.5">
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 w-full">
              <div className="space-y-1 text-left">
                <label className="text-sm font-semibold text-gray-900 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-600" />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/40 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 placeholder-gray-600 font-medium backdrop-blur-sm"
                  />
                </div>
              </div>
              
              {error && (
                <div className="flex items-start gap-3 bg-red-100/50 border border-red-300/50 rounded-xl p-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-red-700">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#CD0000] hover:bg-[#a80000] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 px-6 py-3.5 mt-2">
                {loading ? 'Sending Link...' : 'Send Reset Link'}
              </button>
            </form>
          )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 font-medium text-gray-800/70 drop-shadow-sm text-[14px] text-[#ffffff]">
        © {new Date().getFullYear()} SNS Institutions. All rights reserved.
      </footer>
    </div>
  );
};

export default ForgotPassword;
