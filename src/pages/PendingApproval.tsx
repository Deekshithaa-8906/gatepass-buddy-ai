import React from 'react';
import { GraduationCap, Mail, ShieldCheck, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import bgImage from '../assets/sns-campus-bg.png';

export function PendingApproval() {
  return (
    <div className="min-h-screen relative flex flex-col font-sans overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-1000 scale-100"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-white/15 to-black/25 z-0" />

      <header className="relative z-10 w-full px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center bg-white/35 backdrop-blur-md border-b border-white/35">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-[#CD0000] p-1.5 rounded-lg shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">PassN<span className="text-[#CD0000]">Track</span></span>
        </Link>
        <Link to="/login" className="text-sm font-semibold text-gray-800 hover:text-[#CD0000] transition-colors">
          Sign Out
        </Link>
      </header>

      <main className="relative z-10 flex-grow flex items-center justify-center px-4 py-8 sm:p-12">
        <div className="w-full max-w-[460px] bg-white/20 backdrop-blur-2xl rounded-[28px] shadow-2xl border border-white/30 overflow-hidden p-6 sm:p-8 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-[#e8fff0] border border-[#b7f0c8] flex items-center justify-center shadow-sm relative">
            <Mail className="w-10 h-10 text-[#10b759]" />
            <div className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-[#dbe7dd]">
              <ShieldCheck className="w-4 h-4 text-[#10b759]" />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Verification Successful</h1>
            <p className="text-sm sm:text-base font-medium text-gray-800">Your email identity has been confirmed securely.</p>
          </div>

          <div className="mt-6 bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg text-left p-5 sm:p-6 space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <Clock3 className="w-5 h-5 text-[#CD0000]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pending Admin Approval</h2>
                <p className="mt-1 text-sm leading-6 text-gray-700">Your account request is currently under review by our administration team. This is a mandatory security step before gaining full system access.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-[#1f67ff]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">What happens next?</h2>
                <p className="mt-1 text-sm leading-6 text-gray-700">Upon approval, you will receive an automated email granting you access to set your secure password and finalize your onboarding workflow.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#ffe0b2] bg-[#fff6e7] px-4 py-4 text-left shadow-sm">
            <p className="text-sm font-semibold text-[#c26a00] leading-6">You may safely close this page. We&apos;ll handle the rest and notify you via email immediately upon approval!</p>
          </div>
        </div>
      </main>
    </div>
  );
}
