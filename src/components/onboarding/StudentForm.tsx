import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, Hash, Phone, Users, ShieldCheck, Building2, GraduationCap, Calendar, Building, DoorClosed, Lock, ChevronDown } from 'lucide-react';
import { AvatarUpload } from '../common/AvatarUpload';

export function StudentForm() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  const routeByRole = (role?: string) => {
    if (role === 'principal') return '/principal-dashboard';
    if (role === 'warden') return '/warden-dashboard';
    if (role === 'staff' || role === 'mentor' || role === 'advisor' || role === 'hod') return '/staff-dashboard';
    return '/student-dashboard';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const studentPayload = {
      full_name: String(formData.get('full_name') || ''),
      class_details: String(formData.get('class_details') || ''),
      register_number: String(formData.get('register_number') || ''),
      mobile_number: String(formData.get('mobile_number') || ''),
      parent_name: String(formData.get('parent_name') || ''),
      parent_number: String(formData.get('parent_mobile') || ''),
      gender: String(formData.get('gender') || ''),
      institute: String(formData.get('institute') || ''),
      year: String(formData.get('year_of_study') || ''),
      hostel_block: String(formData.get('hostel_block') || ''),
      room_number: String(formData.get('room_number') || ''),
      department: selectedDepartment === 'Other' ? String(formData.get('department_other') || '') : selectedDepartment,
      updated_at: new Date().toISOString(),
    };

    const accountPayload = {
      onboarding_complete: true,
      status: 'active',
      account_status: 'active',
      updated_at: new Date().toISOString(),
    };

    const { data: accountRow, error: accountLookupError } = await supabase
      .from('user_directory')
      .select('id')
      .eq('email', user?.email ?? '')
      .maybeSingle();

    if (accountLookupError || !accountRow?.id) {
      alert('Failed to resolve account for onboarding. Please try again.');
      return;
    }

    const { error: studentError } = await supabase
      .from('students_details')
      .upsert({
        user_id: accountRow.id,
        ...studentPayload,
      }, { onConflict: 'user_id' });

    if (studentError) {
      alert('Failed to save student details. Please try again.');
      return;
    }

    const { error: accountError } = await supabase
      .from('user_directory')
      .update(accountPayload)
      .eq('email', user?.email ?? '');

    if (accountError) {
      alert('Failed to complete onboarding. Please try again.');
      return;
    }

    // Handled profile picture temporarily (not uploading yet as per instructions)
    if (profileImage) {
      console.log('Profile image selected for upload later:', profileImage.name);
    }

    await refreshProfile();
    const normalizedRole = (profile?.role || 'student').toLowerCase();
    navigate(routeByRole(normalizedRole));
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center mb-8">
        <AvatarUpload 
          name={profile?.full_name || 'Student'} 
          imageUrl={previewUrl}
          onImageChange={(file, url) => {
            setProfileImage(file);
            setPreviewUrl(url);
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email (readonly) */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-gray-900 ml-1 flex items-center gap-1.5">
            Email Address <Lock className="w-3 h-3 text-[#CD0000]" />
          </label>
          <div className="relative">
            <input type="email" readOnly value={user?.email || ''} 
              className="w-full px-4 py-3 bg-gray-100/80 border border-gray-200/60 rounded-xl outline-none text-gray-700 font-bold shadow-sm cursor-not-allowed select-none"
            />
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 ml-1">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" name="full_name" required placeholder="Enter your full name" defaultValue={profile?.full_name || ''}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm"
            />
          </div>
        </div>

        {/* Register Number */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 ml-1">Register Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Hash className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" name="register_number" required placeholder="e.g., 713324CS017" 
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm"
            />
          </div>
        </div>

        {/* Class Details */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 ml-1">Class Details</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" name="class_details" required placeholder="e.g., E1" 
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm"
            />
          </div>
        </div>

        {/* Mobile Number */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 ml-1">Mobile Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input type="tel" name="mobile_number" required placeholder="Enter mobile number" 
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm"
            />
          </div>
        </div>

        {/* Parent Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 ml-1">Parent/Guardian Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" name="parent_name" required placeholder="Enter parent name" 
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm"
            />
          </div>
        </div>

        {/* Parent Number */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 ml-1">Parent Mobile Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input type="tel" name="parent_mobile" required placeholder="Enter parent mobile number" 
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm"
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
              className="w-full pl-10 pr-4 py-3 bg-gray-100/80 border border-gray-200/60 rounded-xl outline-none text-gray-700 font-bold shadow-sm cursor-not-allowed select-none"
            />
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 ml-1">Gender</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <select name="gender" required defaultValue="" className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm appearance-none">
              <option value="" disabled>Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Institute */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 ml-1">Institute (Campus)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
            <select name="institute" required defaultValue="" className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm appearance-none">
              <option value="" disabled>Select Institute</option>
              {institutes.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Year */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 ml-1">Year of Study</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <select name="year_of_study" required defaultValue="" className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm appearance-none">
              <option value="" disabled>Select Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th Year</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Hostel Block */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 ml-1">Hostel Block</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" name="hostel_block" required placeholder="e.g., Block A" 
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm"
            />
          </div>
        </div>

        {/* Room Number */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 ml-1">Room Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DoorClosed className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" name="room_number" required placeholder="e.g., 205" 
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm"
            />
          </div>
        </div>

        {/* Department */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 ml-1">Department</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <GraduationCap className="h-5 w-5 text-gray-400" />
            </div>
            <select 
              required 
              defaultValue="" 
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm appearance-none"
            >
              <option value="" disabled>Select Department</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Custom Department Input */}
        {selectedDepartment === 'Other' && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-sm font-semibold text-gray-900 ml-1">Please Specify Department</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <GraduationCap className="h-5 w-5 text-gray-400" />
              </div>
              <input type="text" name="department_other" required placeholder="Enter your department" 
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm"
              />
            </div>
          </div>
        )}

      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
        <button type="submit" className="w-full sm:w-auto px-10 py-4 bg-[#CD0000] hover:bg-[#a80000] text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 text-center text-lg">
          Complete Onboarding
        </button>
      </div>
    </form>
  );
}
