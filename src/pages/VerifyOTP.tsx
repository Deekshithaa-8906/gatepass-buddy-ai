import React, { useState } from 'react';
import { KeyRound, GraduationCap, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import bgImage from '../assets/sns-campus-bg.png';
import { supabase } from '../lib/supabase';

export function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const role = location.state?.role || "student";
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setIsError(false);

    const { error: verifyError } = await supabase.functions.invoke('registration-otp', {
      body: {
        action: 'verify',
        email,
        otp,
        role,
      },
    });

    if (verifyError) {
      setMsg(verifyError.message);
      setIsError(true);
      setLoading(false);
      return;
    }

    navigate('/pending-approval');
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center z-0 scale-100"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/20 z-0" />

      <header className="relative z-10 w-full px-8 py-6 flex justify-between items-center bg-[#ffececab]">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-[#CD0000] p-1.5 rounded-lg shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">PassN<span className="text-[#CD0000]">Track</span></span>
        </Link>
      </header>

      <main className="relative z-10 flex-grow flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 text-center flex flex-col items-center p-8 sm:p-10">
          <h1 className="font-bold text-gray-900 text-3xl mb-4">Verify Email</h1>
          <p className="text-gray-800 font-medium mb-8">Enter the verification code sent to {email}</p>
          <form className="w-full space-y-5" onSubmit={handleVerify}>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-4 py-3 bg-white/50 border border-white/40 rounded-xl outline-none text-gray-900 text-center tracking-[0.5em]"
              placeholder="000000"
              maxLength={6}
              required
            />
            {msg && <p className={`text-sm font-semibold ${isError ? 'text-[#CD0000]' : 'text-green-600'}`}>{msg}</p>}
            <button type="submit" disabled={loading} className="w-full bg-[#CD0000] text-white py-4 rounded-xl font-bold shadow-md active:scale-95">
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
