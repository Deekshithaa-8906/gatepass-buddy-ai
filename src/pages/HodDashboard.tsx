import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Map, 
  FileText, 
  Activity, 
  LogOut, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock3, 
  MapPin, 
  AlertTriangle,
  Paperclip,
  User,
  Building,
  Calendar,
  Clock,
  ShieldCheck
} from 'lucide-react';
import bgImage from '../assets/sns-campus-bg.png';
import { Button } from '@/components/ui/button';

// Mock Data Types
type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

interface RequestData {
  id: string;
  studentName: string;
  studentEmail: string;
  department: string;
  roomNumber: string;
  campus: string;
  type: 'Outing' | 'Leave';
  destination: string;
  reasonTitle: string;
  reasonDescription: string;
  departure: string;
  returnTime: string;
  duration: string;
  status: LeaveStatus;
  isEmergency: boolean;
  hasAttachment: boolean;
  approvalFlow: { role: string; status: LeaveStatus; remarks?: string; approverName: string }[];
  dateSubmitted: string;
}

const mockRequests: RequestData[] = [
  {
    id: "REQ004",
    studentName: "Priya Sharma",
    studentEmail: "priya.s@snsct.edu.in",
    department: "Computer Science",
    roomNumber: "A-102",
    campus: "SNS College of Technology",
    type: "Leave",
    destination: "Madurai",
    reasonTitle: "Family Function",
    reasonDescription: "Attending my sister's wedding. Need 3 days of leave.",
    departure: "2023-11-20 06:00 AM",
    returnTime: "2023-11-23 08:00 PM",
    duration: "3 Days",
    status: "Pending",
    isEmergency: false,
    hasAttachment: true,
    approvalFlow: [
      { role: "Mentor", status: "Approved", remarks: "Invitation verified.", approverName: "Dr. Ananya" },
      { role: "Advisor", status: "Approved", remarks: "Attendance is above 85%, approved.", approverName: "Prof. Karthik" },
      { role: "HOD", status: "Pending", approverName: "Dr. Suresh (You)" }
    ],
    dateSubmitted: "2023-11-15 09:30 AM"
  },
  {
    id: "REQ005",
    studentName: "Arjun Reddy",
    studentEmail: "arjun.r@snsct.edu.in",
    department: "Computer Science",
    roomNumber: "B-205",
    campus: "SNS College of Technology",
    type: "Leave",
    destination: "Bangalore",
    reasonTitle: "Hackathon Participation",
    reasonDescription: "Selected for the final round of the National Hackathon in Christ University.",
    departure: "2023-11-18 05:00 AM",
    returnTime: "2023-11-20 10:00 PM",
    duration: "2 Days",
    status: "Pending",
    isEmergency: false,
    hasAttachment: true,
    approvalFlow: [
      { role: "Mentor", status: "Approved", remarks: "Good opportunity, On-Duty (OD) recommended.", approverName: "Dr. Ananya" },
      { role: "Advisor", status: "Approved", remarks: "Approved for OD.", approverName: "Prof. Karthik" },
      { role: "HOD", status: "Pending", approverName: "Dr. Suresh (You)" }
    ],
    dateSubmitted: "2023-11-16 11:15 AM"
  }
];

export default function HodDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requests');
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(mockRequests[0]);
  const [remarks, setRemarks] = useState('');

  const handleLogout = () => {
    navigate('/');
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-200 text-xs font-bold w-max">
            <CheckCircle className="w-3 h-3" /> Approved
          </div>
        );
      case 'Rejected':
        return (
          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200 text-xs font-bold w-max">
            <XCircle className="w-3 h-3" /> Rejected
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-1 rounded-md border border-orange-200 text-xs font-bold w-max">
            <Clock3 className="w-3 h-3" /> Pending
          </div>
        );
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

      {/* Sidebar - Matching Student Dashboard Design */}
      <aside className="relative z-20 w-full md:w-72 bg-white/70 backdrop-blur-xl border-r border-white/50 flex flex-col shadow-xl md:h-screen sticky top-0">
        <div className="p-6 border-b border-white/50 flex items-center gap-3">
          <div className="bg-[#CD0000] p-2 rounded-xl shadow-sm">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900 drop-shadow-sm">
            PassN<span className="text-[#CD0000]">Track</span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 flex md:flex-col overflow-x-auto md:overflow-x-visible hide-scrollbar">
          <button onClick={() => setActiveTab('requests')} className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'requests' ? 'bg-[#CD0000] text-white shadow-md' : 'text-gray-700 hover:bg-white/60 hover:text-[#CD0000]'}`}>
            <Activity className="w-5 h-5" /> Pending Actions
            <span className="ml-auto bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{mockRequests.filter(r => r.status === 'Pending').length}</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-[#CD0000] text-white shadow-md' : 'text-gray-700 hover:bg-white/60 hover:text-[#CD0000]'}`}>
            <FileText className="w-5 h-5" /> Department Log
          </button>
        </div>

        <div className="p-4 border-t border-white/50 mt-auto">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full px-4 py-3 text-gray-700 hover:text-[#CD0000] hover:bg-red-50 font-bold rounded-xl transition-all">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 h-screen flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="px-8 py-5 flex justify-between items-center bg-white/40 backdrop-blur-md border-b border-white/40 sticky top-0 z-20 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">HOD Dashboard</h1>
            <p className="text-sm font-medium text-gray-600">Department Oversight</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-white/50 transition-colors text-gray-700">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 bg-white/60 px-4 py-2 rounded-full shadow-sm border border-white/50 cursor-pointer hover:bg-white/80 transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#CD0000] flex items-center justify-center text-white font-bold">
                S
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-bold text-gray-900 leading-tight">Dr. Suresh</p>
                <p className="text-gray-600 font-medium text-xs leading-tight">Head of Department (CSE)</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Layout Container */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            
            {/* Left Panel - Scrollable List */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto hide-scrollbar h-full pr-2">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Needs Your Approval</h2>
              {mockRequests.map((req) => (
                <div 
                  key={req.id} 
                  onClick={() => setSelectedRequest(req)}
                  className={`bg-white/60 backdrop-blur-md rounded-2xl p-5 border cursor-pointer transition-all shadow-sm flex flex-col gap-3 group
                    ${selectedRequest?.id === req.id 
                      ? 'border-[#CD0000] ring-1 ring-[#CD0000]/20 shadow-md' 
                      : 'border-white/60 hover:shadow-md hover:bg-white/80'}`
                  }
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-900 text-lg group-hover:text-[#CD0000] transition-colors">{req.studentName}</span>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-gray-600 font-medium">
                      <span>{req.department}</span>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-200 text-gray-700">
                          {req.type} Pass
                        </span>
                        <div className="flex gap-2">
                          {req.hasAttachment && <Paperclip className="w-4 h-4 text-blue-500" />}
                          {req.isEmergency && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Panel - Request Details Form */}
            <div className="w-full lg:w-2/3 h-full overflow-y-auto hide-scrollbar pb-6 rounded-3xl">
              {selectedRequest ? (
                <div className="bg-white/40 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-6 sm:p-8 transition-all">
                  <div className="flex justify-between items-start mb-6 pb-6 border-b border-white/40">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        {selectedRequest.type === 'Outing' ? <Map className="w-6 h-6 text-[#CD0000]" /> : <FileText className="w-6 h-6 text-[#CD0000]" />}
                        HOD Review Actions
                      </h2>
                      <p className="text-sm font-semibold text-gray-500 mt-1">ID: {selectedRequest.id} &bull; Submitted on {selectedRequest.dateSubmitted}</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="hidden sm:block">
                        {getStatusBadge(selectedRequest.status)}
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Student info and leave info side-by-side on large screens */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Student Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/50 p-3 rounded-xl border border-white/60 col-span-2">
                          <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Name & Department</span>
                          <span className="font-bold text-gray-900">{selectedRequest.studentName} ({selectedRequest.department})</span>
                        </div>
                        <div className="bg-white/50 p-3 rounded-xl border border-white/60 flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase block mb-0.5">Room</span>
                            <span className="font-bold text-gray-900">{selectedRequest.roomNumber}</span>
                          </div>
                        </div>
                        <div className="bg-white/50 p-3 rounded-xl border border-white/60">
                          <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Campus</span>
                          <span className="font-bold text-gray-900 text-xs">{selectedRequest.campus}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Leave Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1 bg-white/50 p-3 rounded-xl border border-white/60">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-3.5 h-3.5 text-[#CD0000]" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Departure</span>
                          </div>
                          <span className="font-bold text-gray-900 text-sm">{selectedRequest.departure}</span>
                        </div>
                        <div className="col-span-2 md:col-span-1 bg-white/50 p-3 rounded-xl border border-white/60">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock3 className="w-3.5 h-3.5 text-[#CD0000]" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Return Time</span>
                          </div>
                          <span className="font-bold text-gray-900 text-sm">{selectedRequest.returnTime}</span>
                        </div>
                        <div className="col-span-2 bg-white/50 p-3 rounded-xl border border-white/60">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-[#CD0000]" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Destination</span>
                          </div>
                          <span className="font-bold text-gray-900 text-sm">{selectedRequest.destination}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mb-6 bg-white/50 p-5 rounded-2xl border border-white/60 flex flex-col gap-2 relative overflow-hidden">
                    {selectedRequest.isEmergency && (
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl">Emergency</div>
                    )}
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Stated Reason</h3>
                    <h4 className="font-bold text-gray-900 text-lg">{selectedRequest.reasonTitle}</h4>
                    <p className="text-gray-700 font-medium leading-relaxed text-sm">{selectedRequest.reasonDescription}</p>
                    {selectedRequest.hasAttachment && (
                      <div className="mt-2 flex items-center gap-2 text-blue-600 bg-blue-50 w-max px-3 py-1.5 rounded-lg text-sm font-bold border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
                        <Paperclip className="w-4 h-4" /> View Attachment
                      </div>
                    )}
                  </div>

                  {/* Section 3: History */}
                  <div className="mb-8">
                     <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Prior Approval History</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {selectedRequest.approvalFlow.filter(step => step.role !== 'HOD').map((step, idx) => (
                         <div key={idx} className="bg-white/60 border border-white p-4 rounded-xl shadow-sm">
                           <div className="flex justify-between items-start mb-2">
                             <div>
                               <p className="font-black text-gray-900">{step.role}</p>
                               <p className="text-xs text-gray-500 font-semibold">{step.approverName}</p>
                             </div>
                             {getStatusBadge(step.status)}
                           </div>
                           <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100 italic">
                             {step.remarks || "No remarks provided."}
                           </p>
                         </div>
                       ))}
                     </div>
                  </div>

                  {/* Section 4: Actions */}
                  <div className="border-t border-white/50 pt-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">HOD Final Approval</h3>
                    <textarea 
                      rows={2} 
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add official remarks..."
                      className="w-full p-4 mb-4 bg-white/70 border border-white/60 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md resize-none"
                    ></textarea>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <Button className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-bold shadow-md shadow-green-600/20 text-md gap-2 transform active:scale-95 transition-transform">
                        <CheckCircle className="w-5 h-5" /> Approve Forward to Warden
                      </Button>
                      <Button className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white py-6 rounded-xl font-bold shadow-md shadow-red-600/20 text-md gap-2 transform active:scale-95 transition-transform" variant="destructive">
                        <XCircle className="w-5 h-5" /> Reject Request
                      </Button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-white/40 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-6 flex items-center justify-center h-full min-h-[400px]">
                   <p className="text-gray-500 font-bold flex items-center gap-2"><Activity className="w-5 h-5" /> Select a request to view details</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
