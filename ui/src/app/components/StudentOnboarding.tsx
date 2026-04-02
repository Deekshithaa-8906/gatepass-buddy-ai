import React, { useState } from 'react';
import { 
  User, 
  Hash, 
  Phone, 
  Users, 
  ShieldCheck, 
  Building2, 
  GraduationCap, 
  Calendar, 
  Building, 
  DoorClosed,
  Lock,
  ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import bgImage from 'figma:asset/a1a8713c9cbe80eb57d250cc5209582cc0c4e756.png';

export function StudentOnboarding() {
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Proceed to student dashboard
    navigate('/student-dashboard');
  };

  const institutes = [
    "SNS College of Technology",
    "Dr.SNS Rajalakshmi College Arts and Science",
    "SNS College of Pharmacy and Health Sciences",
    "SNS College of Nursing",
    "SNS College of Physiotherapy",
    "SNS College of Allied Health Science"
  ];

  const departments = [
    "CSE", "CSD", "CST", "MECH", "MCT", "IT", "AIDS", "AIML", "Other"
  ];

  return (
    <div className="min-h-screen relative flex flex-col font-sans overflow-x-hidden">
      {/* Background Image Setup */}
      <div
        className="fixed inset-0 bg-cover bg-center z-0 transition-transform duration-1000 scale-100"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Subtle Color Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/60 via-white/40 to-black/20 z-0" />

      {/* Header */}
      <header className="relative z-10 w-full px-8 py-6 flex justify-between items-center bg-white/70 backdrop-blur-md border-b border-white/50 sticky top-0 shadow-sm">
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-[#CD0000] p-1.5 rounded-lg shadow-sm transition-transform group-hover:scale-105">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 drop-shadow-sm">
            PassN<span className="text-[#CD0000]">Track</span>
          </span>
        </Link>
        <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Setup Mode
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-grow flex items-center justify-center p-4 sm:p-8 md:p-12">
        <div className="max-w-4xl w-full bg-white/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 flex flex-col relative overflow-hidden transition-all duration-300">
          
          <div className="p-8 sm:px-12 sm:pt-10 sm:pb-6 border-b border-white/30 bg-white/40">
            <h1 className="font-bold text-gray-900 tracking-tight text-3xl drop-shadow-sm mb-2">
              Student Onboarding
            </h1>
            <p className="text-gray-800 font-medium text-sm sm:text-base">
              Please complete your profile details. Some fields have been locked by the administrator.
            </p>
          </div>

          <div className="p-8 sm:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <input type="text" required placeholder="Enter your full name" 
                      className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md"
                    />
                  </div>
                </div>

                {/* Class Details */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Class Details</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <input type="text" required placeholder="e.g., E1" 
                      className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md"
                    />
                  </div>
                </div>

                {/* Register Number */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Register Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-gray-600" />
                    </div>
                    <input type="text" required placeholder="e.g., 713324CS017" 
                      className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Mobile Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-600" />
                    </div>
                    <input type="tel" required placeholder="Enter mobile number" 
                      className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md"
                    />
                  </div>
                </div>

                {/* Parent Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Parent/Guardian Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <input type="text" required placeholder="Enter parent name" 
                      className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md"
                    />
                  </div>
                </div>

                {/* Parent Number */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Parent Mobile Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-600" />
                    </div>
                    <input type="tel" required placeholder="Enter parent mobile number" 
                      className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md"
                    />
                  </div>
                </div>

                {/* Role (Fixed) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1 flex items-center gap-1.5">
                    Assigned Role <Lock className="w-3 h-3 text-[#CD0000]" />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ShieldCheck className="h-5 w-5 text-[#CD0000]" />
                    </div>
                    <input type="text" readOnly value="Student" 
                      className="w-full pl-10 pr-4 py-3 bg-gray-100/80 border border-gray-200/60 rounded-xl outline-none text-gray-700 font-bold shadow-sm backdrop-blur-md cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Gender</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <select required defaultValue="" className="w-full pl-10 pr-10 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md appearance-none">
                      <option value="" disabled>Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Institute */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Institute</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-600" />
                    </div>
                    <select required defaultValue="" className="w-full pl-10 pr-10 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md appearance-none">
                      <option value="" disabled>Select Institute</option>
                      {institutes.map(inst => (
                        <option key={inst} value={inst}>{inst}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Year */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Year of Study</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-600" />
                    </div>
                    <select required defaultValue="" className="w-full pl-10 pr-10 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md appearance-none">
                      <option value="" disabled>Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Hostel Block */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Hostel Block</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-600" />
                    </div>
                    <input type="text" required placeholder="e.g., Block A" 
                      className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md"
                    />
                  </div>
                </div>

                {/* Room Number */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Room Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DoorClosed className="h-5 w-5 text-gray-600" />
                    </div>
                    <input type="text" required placeholder="e.g., 205" 
                      className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md"
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Department</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <GraduationCap className="h-5 w-5 text-gray-600" />
                    </div>
                    <select 
                      required 
                      defaultValue="" 
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md appearance-none"
                    >
                      <option value="" disabled>Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Custom Department Input (shows when 'Other' is selected) */}
                {selectedDepartment === 'Other' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-sm font-semibold text-gray-900 ml-1">Please Specify Department</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <GraduationCap className="h-5 w-5 text-gray-600" />
                      </div>
                      <input type="text" required placeholder="Enter your department" 
                        className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md"
                      />
                    </div>
                  </div>
                )}

              </div>

              <div className="mt-4 border-t border-white/30 flex justify-end pl-[0px] pr-[270px] pt-[24px] pb-[0px]">
                <button type="submit" className="w-full sm:w-auto px-10 py-4 bg-[#CD0000] hover:bg-[#a80000] text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 text-center text-lg">
                  Complete Onboarding
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 font-medium text-gray-900 drop-shadow-sm text-[14px]">
        © {new Date().getFullYear()} SNS Institutions. All rights reserved.
      </footer>
    </div>
  );
}
