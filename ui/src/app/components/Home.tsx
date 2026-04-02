import React from 'react';
import { LogIn, UserPlus, GraduationCap } from 'lucide-react';
import { Link } from 'react-router';
import bgImage from 'figma:asset/a1a8713c9cbe80eb57d250cc5209582cc0c4e756.png';

export function Home() {
  return (
    <div className="min-h-screen relative flex flex-col font-sans overflow-hidden">
      {/* Background Image Setup */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Subtle Color Overlay to ensure readability while keeping the image highly visible */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/20 z-0" />

      {/* Header - Top Application Name */}
      <header className="relative z-10 w-full px-8 py-6 flex justify-between items-center bg-[#ffececab]">
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-[#CD0000] p-1.5 rounded-lg shadow-sm transition-transform group-hover:scale-105">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 drop-shadow-sm">PassN<span className="text-[#CD0000]">Track&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-grow flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-2xl w-full bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 text-center flex flex-col items-center relative overflow-hidden transition-all duration-300 hover:bg-white/20 m-[2px] p-[30px]">
          
          <div className="space-y-3">
            <h1 className="font-bold text-[#CD0000] tracking-tight drop-shadow-sm text-[40px] px-[0px] py-[10px]">
              SNS Institutions
              <span className="block font-semibold text-gray-900 mt-1 text-[28px]">
                Hostel Management System
              </span>
            </h1>
          </div>

          <p 
            className="leading-relaxed max-w-lg px-[0px] py-[10px] text-[#030303] text-[17px]"
            style={{ 
              fontFamily: '"Caviar Dreams", "Quicksand", "Jost", sans-serif', 
              fontWeight: 400,
              letterSpacing: '0.5px'
            }}
          >
            Manage outing passes, leave requests, and complaints - streamlined for students, mentors, and administrators.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full pt-4">
            <Link 
              to="/login"
              className="group flex items-center justify-center gap-2 bg-[#CD0000] hover:bg-[#a80000] text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg w-full sm:w-48 active:scale-95 text-center text-[14px] px-[34px] py-[12px]"
            >
              <LogIn className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Login
            </Link>
            <Link 
              to="/create-account"
              className="group flex items-center justify-center gap-2 bg-white/50 hover:bg-white/70 text-gray-900 border border-gray-300 px-8 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md w-full sm:w-48 active:scale-95 backdrop-blur-sm text-[14px]"
            >
              <UserPlus className="w-4 h-4 transition-transform group-hover:scale-110" />
              Create Account
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
