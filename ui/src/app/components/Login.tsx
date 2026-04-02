import React from 'react';
import { LogIn, GraduationCap, ArrowLeft, Mail, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import bgImage from 'figma:asset/a1a8713c9cbe80eb57d250cc5209582cc0c4e756.png';

export function Login() {
  const navigate = useNavigate();
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

          <form className="w-full space-y-5" onSubmit={(e) => { e.preventDefault(); navigate('/student-dashboard'); }}>
            <div className="space-y-1 text-left">
              <label className="text-sm font-semibold text-gray-900 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-600" />
                </div>
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/40 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 placeholder-gray-600 font-medium backdrop-blur-sm"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-gray-900">Password</label>
                <a href="#" className="text-xs font-bold text-[#CD0000] hover:underline">Forgot Password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-600" />
                </div>
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/40 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 placeholder-gray-600 font-medium backdrop-blur-sm"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <div className="flex items-center ml-1 pl-[80px] pr-[0px] pt-[4px] pb-[8px]">
              <div className="text-sm font-medium text-gray-900">
                Admin?{' '}
                <Link to="/admin-login" className="font-bold text-[#CD0000] hover:underline">
                  Login to manage access
                </Link>
              </div>
            </div>

            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#CD0000] hover:bg-[#a80000] text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 text-center px-6 py-3.5 mt-2">
              Sign In
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
