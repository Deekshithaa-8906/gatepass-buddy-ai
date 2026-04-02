import React, { useEffect, useState } from 'react';
import { 
  GraduationCap, 
  Map, 
  FileText, 
  AlertTriangle, 
  Activity, 
  Inbox, 
  User, 
  LogOut,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Clock3,
  Bell,
  Building,
  DoorClosed,
  ChevronDown,
  Users,
  ShieldCheck,
  Building2,
  Mail
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import bgImage from '../assets/sns-campus-bg.png';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user, profile: accountProfile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('outing');

  // Profile State
  const [profile, setProfile] = useState({
    fullName: "John Doe",
    registerNumber: "710019104001",
    mobile: "9876543210",
    parentName: "Richard Doe",
    parentMobile: "9876543211",
    gender: "Male",
    institute: "SNS College of Technology",
    year: "3",
    department: "CSE",
    classDetails: "III Year CSE A",
    hostelBlock: "A",
    roomNumber: "205",
    mentor: "",
    advisor: "",
    hod: "Dr. K. Anderson",
    principal: "Dr. V. Ram"
  });

  useEffect(() => {
    if (!accountProfile) return;
    setProfile((current) => ({
      ...current,
      fullName: accountProfile.full_name || current.fullName,
      registerNumber: accountProfile.register_number || current.registerNumber,
      mobile: accountProfile.mobile_number || current.mobile,
      parentName: accountProfile.parent_name || current.parentName,
      parentMobile: accountProfile.parent_mobile || current.parentMobile,
      gender: accountProfile.gender || current.gender,
      institute: accountProfile.institute || current.institute,
      year: accountProfile.year_of_study || current.year,
      department: accountProfile.department || current.department,
      classDetails: accountProfile.class_details || current.classDetails,
      hostelBlock: accountProfile.hostel_block || current.hostelBlock,
      roomNumber: accountProfile.room_number || current.roomNumber,
      mentor: accountProfile.mentor || current.mentor,
      advisor: accountProfile.advisor || current.advisor,
      hod: accountProfile.hod || current.hod,
      principal: accountProfile.principal || current.principal,
    }));
  }, [accountProfile]);

  const mentors = ["Dr. A. Smith", "Prof. J. Doe", "Ms. S. Williams", "Mr. P. Kumar"];
  const advisors = ["Dr. B. Johnson", "Prof. R. Davis", "Mr. M. Taylor", "Ms. L. Rani"];

  // Mock Data for Status
  const [requests] = useState([
    { id: "REQ001", type: "Outing", date: "2023-10-25", reason: "Going home for weekend", status: "Approved" },
    { id: "REQ002", type: "Leave", date: "2023-11-02", reason: "Medical Leave", status: "Pending" },
    { id: "REQ003", type: "Complaint", date: "2023-11-10", reason: "Fan not working in room", status: "Resolved" },
  ]);

  // Mock Data for Inbox
  const [notifications] = useState([
    { id: 1, title: "Outing Pass Approved", message: "Your outing pass request REQ001 has been approved by your mentor.", time: "2 hours ago", read: false },
    { id: 2, title: "Complaint Resolved", message: "Maintenance has marked complaint REQ003 as resolved.", time: "1 day ago", read: true },
    { id: 3, title: "Leave Pass Submitted", message: "Your leave pass request REQ002 has been submitted and is pending approval.", time: "3 days ago", read: true },
  ]);

  const handleLogout = () => {
    navigate('/');
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    const { error } = await supabase
      .from('user_directory')
      .update({
        full_name: profile.fullName,
        register_number: profile.registerNumber,
        mobile_number: profile.mobile,
        parent_name: profile.parentName,
        parent_mobile: profile.parentMobile,
        gender: profile.gender,
        institute: profile.institute,
        year_of_study: profile.year,
        class_details: profile.classDetails,
        department: profile.department,
        hostel_block: profile.hostelBlock,
        room_number: profile.roomNumber,
        mentor: profile.mentor,
        advisor: profile.advisor,
        hod: profile.hod,
        principal: profile.principal,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq('email', user.email);

    if (error) {
      alert('Unable to save profile changes. Please try again.');
      return;
    }

    await refreshProfile();
    alert('Profile changes saved successfully!');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'outing':
      case 'leave':
        return (
          <div className="bg-white/40 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-8 sm:p-10 transition-all duration-300">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                {activeTab === 'outing' ? <Map className="w-6 h-6 text-[#CD0000]" /> : <FileText className="w-6 h-6 text-[#CD0000]" />}
                {activeTab === 'outing' ? 'Request Outing Pass' : 'Request Leave Pass'}
              </h2>
              <p className="text-gray-800 font-medium mt-1">Fill out the form below to submit your {activeTab} request.</p>
            </div>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Request submitted successfully!"); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Departure Date & Time</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-600" />
                    </div>
                    <input type="datetime-local" required className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Return Date & Time</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                    <input type="datetime-local" required className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md" />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Destination / Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-600" />
                    </div>
                    <input type="text" required placeholder="Where are you going?" className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md" />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-900 ml-1">Reason</label>
                  <textarea required rows={4} placeholder={`Detailed reason for ${activeTab}...`} className="w-full p-4 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md resize-none"></textarea>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-[#CD0000] hover:bg-[#a80000] text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 text-center">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        );
      case 'complaint':
        return (
          <div className="bg-white/40 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-8 sm:p-10 transition-all duration-300">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-[#CD0000]" />
                Register Complaint
              </h2>
              <p className="text-gray-800 font-medium mt-1">Report issues related to hostel, food, or maintenance.</p>
            </div>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Complaint registered!"); }}>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-900 ml-1">Category</label>
                <div className="relative">
                  <select required defaultValue="" className="w-full pl-4 pr-10 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md appearance-none">
                    <option value="" disabled>Select Category</option>
                    <option value="Maintenance">Maintenance & Repair</option>
                    <option value="Food">Food / Mess</option>
                    <option value="Cleanliness">Cleanliness & Hygiene</option>
                    <option value="Disciplinary">Disciplinary Issue</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-900 ml-1">Description</label>
                <textarea required rows={5} placeholder="Describe your issue in detail..." className="w-full p-4 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md resize-none"></textarea>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-[#CD0000] hover:bg-[#a80000] text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 text-center">
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        );
      case 'status':
        return (
          <div className="bg-white/40 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-8 sm:p-10 transition-all duration-300">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <Activity className="w-6 h-6 text-[#CD0000]" />
                Request Status
              </h2>
              <p className="text-gray-800 font-medium mt-1">Track the progress of your outings, leaves, and complaints.</p>
            </div>
            <div className="space-y-4">
              {requests.map((req, i) => (
                <div key={i} className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 text-lg">{req.type}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">{req.id}</span>
                    </div>
                    <span className="text-gray-800 text-sm font-medium">{req.reason}</span>
                    <span className="text-gray-500 text-xs mt-1">Submitted on: {req.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {req.status === 'Approved' || req.status === 'Resolved' ? (
                      <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold text-sm">{req.status}</span>
                      </div>
                    ) : req.status === 'Rejected' ? (
                      <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                        <XCircle className="w-5 h-5" />
                        <span className="font-bold text-sm">Rejected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                        <Clock3 className="w-5 h-5" />
                        <span className="font-bold text-sm">Pending</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'inbox':
        return (
          <div className="bg-white/40 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-8 sm:p-10 transition-all duration-300">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <Inbox className="w-6 h-6 text-[#CD0000]" />
                Inbox
              </h2>
              <p className="text-gray-800 font-medium mt-1">Notifications and updates regarding your requests.</p>
            </div>
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div key={notif.id} className={`bg-white/70 backdrop-blur-md rounded-2xl p-5 border ${notif.read ? 'border-white/60' : 'border-[#CD0000]/40 ring-1 ring-[#CD0000]/20'} shadow-sm hover:shadow-md transition-all flex gap-4`}>
                  <div className={`mt-1 rounded-full p-2 h-max ${notif.read ? 'bg-gray-100 text-gray-500' : 'bg-[#CD0000]/10 text-[#CD0000]'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-bold ${notif.read ? 'text-gray-800' : 'text-gray-900'} text-base`}>{notif.title}</h4>
                      <span className="text-xs font-semibold text-gray-500 whitespace-nowrap ml-2">{notif.time}</span>
                    </div>
                    <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{notif.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="bg-white/40 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-8 sm:p-10 transition-all duration-300">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <User className="w-6 h-6 text-[#CD0000]" />
                My Profile
              </h2>
              <p className="text-gray-800 font-medium mt-1">View your details and update hostel / faculty information.</p>
            </div>
            
            <form onSubmit={handleProfileSave} className="space-y-8">
              {/* Read-only Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Personal Details (Read-only)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-100/50 p-3 rounded-xl border border-gray-200/50">
                    <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Full Name</span>
                    <span className="font-semibold text-gray-900">{profile.fullName}</span>
                  </div>
                  <div className="bg-gray-100/50 p-3 rounded-xl border border-gray-200/50">
                    <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Register Number</span>
                    <span className="font-semibold text-gray-900">{profile.registerNumber}</span>
                  </div>
                  <div className="bg-gray-100/50 p-3 rounded-xl border border-gray-200/50">
                    <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Class & Dept</span>
                    <span className="font-semibold text-gray-900">{profile.classDetails} - {profile.department}</span>
                  </div>
                  <div className="bg-gray-100/50 p-3 rounded-xl border border-gray-200/50">
                    <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Mobile</span>
                    <span className="font-semibold text-gray-900">{profile.mobile}</span>
                  </div>
                </div>
              </div>

              {/* Editable Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Hostel Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-900 ml-1">Hostel Block</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-600" />
                      </div>
                      <input type="text" value={profile.hostelBlock} onChange={(e) => setProfile({...profile, hostelBlock: e.target.value})} required className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-900 ml-1">Room Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DoorClosed className="h-5 w-5 text-gray-600" />
                      </div>
                      <input type="text" value={profile.roomNumber} onChange={(e) => setProfile({...profile, roomNumber: e.target.value})} required className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Faculty Incharge Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-900 ml-1">Mentor</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <select value={profile.mentor} onChange={(e) => setProfile({...profile, mentor: e.target.value})} required className="w-full pl-10 pr-10 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md appearance-none">
                        <option value="" disabled>Select Mentor</option>
                        {mentors.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-900 ml-1">Advisor</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <select value={profile.advisor} onChange={(e) => setProfile({...profile, advisor: e.target.value})} required className="w-full pl-10 pr-10 py-3 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md appearance-none">
                        <option value="" disabled>Select Advisor</option>
                        {advisors.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-900 ml-1 flex items-center gap-1">HOD <ShieldCheck className="w-3 h-3 text-[#CD0000]" /></label>
                    <input type="text" readOnly value={profile.hod} className="w-full px-4 py-3 bg-gray-100/80 border border-gray-200/60 rounded-xl outline-none text-gray-700 font-bold shadow-sm backdrop-blur-md cursor-not-allowed select-none" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-900 ml-1 flex items-center gap-1">Principal <ShieldCheck className="w-3 h-3 text-[#CD0000]" /></label>
                    <input type="text" readOnly value={profile.principal} className="w-full px-4 py-3 bg-gray-100/80 border border-gray-200/60 rounded-xl outline-none text-gray-700 font-bold shadow-sm backdrop-blur-md cursor-not-allowed select-none" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" className="w-full sm:w-auto px-10 py-3.5 bg-[#CD0000] hover:bg-[#a80000] text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 text-center">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col md:flex-row font-sans overflow-hidden bg-gray-50">
      {/* Background Image Setup */}
      <div
        className="fixed inset-0 bg-cover bg-center z-0 transition-transform duration-1000 scale-100"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Subtle Color Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/70 via-white/50 to-black/20 z-0" />

      {/* Sidebar */}
      <aside className="relative z-20 w-full md:w-72 bg-white/70 backdrop-blur-xl border-r border-white/50 flex flex-col shadow-xl md:h-screen sticky top-0">
        <div className="p-6 border-b border-white/50 flex items-center gap-3">
          <div className="bg-[#CD0000] p-2 rounded-xl shadow-sm">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900 drop-shadow-sm">
            PassN<span className="text-[#CD0000]">Track</span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 flex md:flex-col overflow-x-auto md:overflow-x-visible hide-scrollbar">
          <button onClick={() => setActiveTab('outing')} className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'outing' ? 'bg-[#CD0000] text-white shadow-md' : 'text-gray-700 hover:bg-white/60 hover:text-[#CD0000]'}`}>
            <Map className="w-5 h-5" /> Outing Pass
          </button>
          <button onClick={() => setActiveTab('leave')} className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'leave' ? 'bg-[#CD0000] text-white shadow-md' : 'text-gray-700 hover:bg-white/60 hover:text-[#CD0000]'}`}>
            <FileText className="w-5 h-5" /> Leave Pass
          </button>
          <button onClick={() => setActiveTab('complaint')} className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'complaint' ? 'bg-[#CD0000] text-white shadow-md' : 'text-gray-700 hover:bg-white/60 hover:text-[#CD0000]'}`}>
            <AlertTriangle className="w-5 h-5" /> Complaints
          </button>
          <button onClick={() => setActiveTab('status')} className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'status' ? 'bg-[#CD0000] text-white shadow-md' : 'text-gray-700 hover:bg-white/60 hover:text-[#CD0000]'}`}>
            <Activity className="w-5 h-5" /> Request Status
          </button>
          <button onClick={() => setActiveTab('inbox')} className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'inbox' ? 'bg-[#CD0000] text-white shadow-md' : 'text-gray-700 hover:bg-white/60 hover:text-[#CD0000]'}`}>
            <Inbox className="w-5 h-5" /> Inbox
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{notifications.filter(n => !n.read).length}</span>
            )}
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-[#CD0000] text-white shadow-md' : 'text-gray-700 hover:bg-white/60 hover:text-[#CD0000]'}`}>
            <User className="w-5 h-5" /> Profile Settings
          </button>
        </div>

        <div className="p-4 border-t border-white/50 mt-auto">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full px-4 py-3 text-gray-700 hover:text-[#CD0000] hover:bg-red-50 font-bold rounded-xl transition-all">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 h-screen overflow-y-auto">
        {/* Top Navbar */}
        <header className="px-8 py-5 flex justify-between items-center bg-white/40 backdrop-blur-md border-b border-white/40 sticky top-0 z-20">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight capitalize">
            {activeTab === 'profile' ? 'Profile Settings' : 
             activeTab === 'status' ? 'Request Status' : 
             activeTab === 'complaint' ? 'Complaints' : 
             activeTab === 'inbox' ? 'Inbox' :
             `${activeTab} Request`}
          </h1>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('inbox')} className="relative p-2 rounded-full hover:bg-white/50 transition-colors text-gray-700">
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            <div className="flex items-center gap-3 bg-white/60 px-4 py-2 rounded-full shadow-sm border border-white/50 cursor-pointer hover:bg-white/80 transition-colors" onClick={() => setActiveTab('profile')}>
              <div className="w-8 h-8 rounded-full bg-[#CD0000] flex items-center justify-center text-white font-bold">
                {profile.fullName.charAt(0)}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-bold text-gray-900 leading-tight">{profile.fullName}</p>
                <p className="text-gray-600 font-medium text-xs leading-tight">Student</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard View Container */}
        <div className="p-4 sm:p-8 max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

