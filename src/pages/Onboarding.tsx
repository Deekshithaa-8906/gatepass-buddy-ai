import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap } from 'lucide-react';
import { StudentForm } from '../components/onboarding/StudentForm';
import { StaffForm } from '../components/onboarding/StaffForm';
import { HodForm } from '../components/onboarding/HodForm';
import { WardenForm } from '../components/onboarding/WardenForm';
import { PrincipalForm } from '../components/onboarding/PrincipalForm';

export function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  
  // Wait for auth to load
  if (authLoading) return null;

  // Redirect if no user
  if (!user || !profile) {
    navigate('/');
    return null;
  }

  // If already onboarded, send them to dashboard
  if (profile.onboardingComplete) {
    const role = profile.role || 'student';
    if (role === 'principal') navigate('/principal-dashboard');
    else if (role === 'warden') navigate('/warden-dashboard');
    else if (['staff', 'mentor', 'advisor', 'hod'].includes(role)) navigate('/staff-dashboard');
    else navigate('/student-dashboard');
    return null;
  }

  const role = profile.role || 'student';
  const roleDisplay = role === 'hod' ? 'HOD' : role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <header className="relative w-full px-8 py-6 flex justify-between items-center bg-white border-b border-gray-200 sticky top-0 shadow-sm z-10">
        <div className="flex items-center gap-2 group">
          <div className="bg-[#CD0000] p-1.5 rounded-lg shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 drop-shadow-sm">
            PassN<span className="text-[#CD0000]">Track</span>
          </span>
        </div>
        <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Setup Mode
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-8 md:p-12">
        <div className="max-w-4xl w-full bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white flex flex-col relative overflow-hidden transition-all duration-300">
          
          <div className="p-8 sm:px-12 sm:pt-10 sm:pb-6 border-b border-gray-100 bg-white/50">
            <div className="inline-block px-3 py-1 bg-red-50 text-[#CD0000] text-xs font-bold uppercase tracking-wider rounded-full mb-3">
              {roleDisplay} Onboarding
            </div>
            <h1 className="font-bold text-gray-900 tracking-tight text-3xl drop-shadow-sm mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600 font-medium text-sm sm:text-base">
              Please provide the required details to set up your account. Some fields have been locked by the administrator.
            </p>
          </div>

          <div className="p-8 sm:p-12">
            {role === 'student' && <StudentForm />}
            {(role === 'mentor' || role === 'advisor' || role === 'staff') && <StaffForm role={role} />}
            {role === 'hod' && <HodForm />}
            {role === 'warden' && <WardenForm />}
            {role === 'principal' && <PrincipalForm />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 font-medium text-gray-600 text-[14px]">
        © {new Date().getFullYear()} SNS Institutions. All rights reserved.
      </footer>
    </div>
  );
}
