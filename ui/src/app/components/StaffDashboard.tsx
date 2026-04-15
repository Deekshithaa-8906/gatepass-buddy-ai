import React, { useState } from 'react';
import { 
  GraduationCap, 
  Inbox, 
  User, 
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  FileText,
  Map,
  Users,
  Phone,
  Mail,
  Building2,
  DoorClosed,
  Plane,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router';

// Mock Data
interface Request {
  id: string;
  studentName: string;
  studentAvatar?: string;
  registerNumber: string;
  email: string;
  type: 'Outing' | 'Leave';
  requestType: string;
  reason: string;
  fullReason: string;
  departureDate: string;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  destination: string;
  mobile: string;
  parentMobile: string;
  department: string;
  year: string;
  hostelBlock: string;
  roomNumber: string;
  campus: string;
  submittedAt: string;
  appliedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  roleLabel: string;
  isEmergency?: boolean;
  approvalStage: 'Submitted' | 'Mentor' | 'Advisor' | 'HOD' | 'Final';
  previousRemarks?: { role: string; remark: string; action: 'Approved' | 'Rejected' }[];
  rejectionReason?: string;
}

const mockRequests: Request[] = [
  {
    id: "LVP-2023-0041",
    studentName: "Jane Smith",
    registerNumber: "710019104001",
    email: "jane.smith@sns.edu.in",
    type: "Leave",
    requestType: "Weekend Leave",
    reason: "Visiting home for my sister's wedding, and requesting more nooooomel the reason...",
    fullReason: "I am requesting a leave of absence to travel home for my sister's wedding ceremony. The event is scheduled for Saturday, and I will need to be present for the family rituals. I have already informed my subject teachers and will catch up on assignments over the weekend.",
    departureDate: "Oct 27, 2023",
    departureTime: "04:00 PM",
    returnDate: "Oct 30, 2023",
    returnTime: "08:00 AM",
    destination: "Springfield, OH",
    mobile: "9876543210",
    parentMobile: "9876543211",
    department: "Computer Science",
    year: "3",
    hostelBlock: "Block A",
    roomNumber: "302-B",
    campus: "Main North Campus",
    submittedAt: "Oct 24, 10:45 AM",
    appliedDate: "Oct 24, 2023 | 10:45 AM",
    status: "Pending",
    roleLabel: "Mentor Request",
    approvalStage: "Mentor",
    previousRemarks: []
  },
  {
    id: "LVP-2023-0042",
    studentName: "Alex Johnson",
    registerNumber: "710019104025",
    email: "alex.j@sns.edu.in",
    type: "Leave",
    requestType: "Medical Leave",
    reason: "Appointment with specialist to wedding ceremony. No more reason...",
    fullReason: "I have a scheduled medical appointment with a specialist regarding an ongoing health issue. The appointment has been confirmed and requires my presence.",
    departureDate: "Oct 27, 2023",
    departureTime: "09:30 AM",
    returnDate: "Oct 27, 2023",
    returnTime: "06:00 PM",
    destination: "City Hospital, Coimbatore",
    mobile: "9876543220",
    parentMobile: "9876543221",
    department: "Electronics & Communication",
    year: "2",
    hostelBlock: "Block B",
    roomNumber: "215",
    campus: "Main North Campus",
    submittedAt: "Oct 24, 09:30 AM",
    appliedDate: "Oct 24, 2023 | 09:30 AM",
    status: "Approved",
    roleLabel: "Mentor Request",
    approvalStage: "Advisor",
    previousRemarks: [
      { role: "Mentor", remark: "Medical documentation verified. Approved.", action: "Approved" }
    ]
  },
  {
    id: "OTP-2023-0043",
    studentName: "Michael Chen",
    registerNumber: "710019104050",
    email: "michael.c@sns.edu.in",
    type: "Outing",
    requestType: "Emergency Outing",
    reason: "Urgent family matter to counting family during in an emergency components of the weekend...",
    fullReason: "There is an urgent family matter that requires my immediate attention. My father has been hospitalized and my family needs me to be present.",
    departureDate: "Oct 23, 2023",
    departureTime: "05:15 PM",
    returnDate: "Oct 23, 2023",
    returnTime: "11:00 PM",
    destination: "Home - Chennai",
    mobile: "9876543230",
    parentMobile: "9876543231",
    department: "Computer Science",
    year: "3",
    hostelBlock: "Block A",
    roomNumber: "301",
    campus: "Main North Campus",
    submittedAt: "Oct 23, 17:15 PM",
    appliedDate: "Oct 23, 2023 | 05:15 PM",
    status: "Pending",
    roleLabel: "Mentor Request",
    isEmergency: true,
    approvalStage: "Mentor"
  },
  {
    id: "OTP-2023-0044",
    studentName: "Sarah Williams",
    registerNumber: "710019104072",
    email: "sarah.w@sns.edu.in",
    type: "Outing",
    requestType: "Outing Pass",
    reason: "Going to city mall to devnirt ponment now ...",
    fullReason: "I need to visit the city mall to purchase essential items and complete some personal errands that cannot be postponed.",
    departureDate: "Oct 23, 2023",
    departureTime: "02:00 PM",
    returnDate: "Oct 23, 2023",
    returnTime: "07:00 PM",
    destination: "City Mall, Coimbatore",
    mobile: "9876543240",
    parentMobile: "9876543241",
    department: "Information Technology",
    year: "4",
    hostelBlock: "Block C",
    roomNumber: "205",
    campus: "Main North Campus",
    submittedAt: "Oct 23, 14:00 PM",
    appliedDate: "Oct 23, 2023 | 02:00 PM",
    status: "Rejected",
    roleLabel: "Mentor Request",
    approvalStage: "Mentor",
    rejectionReason: "Insufficient justification for outing during academic hours."
  },
  {
    id: "LVP-2023-0045",
    studentName: "David Miller",
    registerNumber: "710019104088",
    email: "david.m@sns.edu.in",
    type: "Leave",
    requestType: "Special Leave",
    reason: "National level sports to national till sport...",
    fullReason: "I have been selected to represent the state in the National Level Sports Championship. This is a significant achievement and the event runs for 3 days.",
    departureDate: "Oct 22, 2023",
    departureTime: "11:50 AM",
    returnDate: "Oct 25, 2023",
    returnTime: "08:00 PM",
    destination: "Bangalore Sports Complex",
    mobile: "9876543250",
    parentMobile: "9876543251",
    department: "Mechanical Engineering",
    year: "2",
    hostelBlock: "Block D",
    roomNumber: "115",
    campus: "Main North Campus",
    submittedAt: "Oct 22, 11:50 AM",
    appliedDate: "Oct 22, 2023 | 11:50 AM",
    status: "Pending",
    roleLabel: "Advisor Request",
    approvalStage: "Mentor"
  }
];

const mockNotifications = [
  { id: 1, title: "New Request Submitted", message: "Jane Smith has submitted a new leave pass request.", time: "2 hours ago", read: false },
  { id: 2, title: "Request Approved", message: "You approved request for Alex Johnson.", time: "1 day ago", read: true },
  { id: 3, title: "Request Rejected", message: "You rejected request for Sarah Williams.", time: "2 days ago", read: true },
];

export function StaffDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requests');
  const [selectedRequest, setSelectedRequest] = useState<Request>(mockRequests[0]);
  const [requests, setRequests] = useState<Request[]>(mockRequests);
  const [remarks, setRemarks] = useState('');

  const handleLogout = () => {
    navigate('/');
  };

  const handleApprove = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'Approved' } : req
    ));
    if (selectedRequest?.id === requestId) {
      setSelectedRequest({ ...selectedRequest, status: 'Approved' });
    }
    setRemarks('');
  };

  const handleReject = (requestId: string) => {
    if (!remarks.trim()) {
      alert('Please provide remarks for rejection');
      return;
    }
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'Rejected', rejectionReason: remarks } : req
    ));
    if (selectedRequest?.id === requestId) {
      setSelectedRequest({ ...selectedRequest, status: 'Rejected', rejectionReason: remarks });
    }
    setRemarks('');
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'requests':
        return (
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* LEFT PANEL - Request List (30%) */}
            <div className="lg:w-[30%] bg-white rounded-xl shadow-sm border p-6 overflow-y-auto max-h-[calc(100vh-180px)]">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Mentor Requests
              </h2>
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-4 rounded-lg cursor-pointer transition-all border ${
                      selectedRequest?.id === req.id
                        ? 'border-[#CD0000] bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700 flex-shrink-0">
                        {req.studentName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-sm">{req.studentName}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${getStatusBadgeClass(req.status)}`}>
                            {req.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">{req.requestType}</p>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{req.reason}</p>
                        <p className="text-xs text-gray-500">Submitted: {req.submittedAt}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT PANEL - Request Details (70%) */}
            <div className="lg:w-[70%] bg-white rounded-xl shadow-sm border p-8 overflow-y-auto max-h-[calc(100vh-180px)]">
              {selectedRequest ? (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between pb-4 border-b">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedRequest.type} Request</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-semibold">Ref ID: {selectedRequest.id}</span>
                        <span>•</span>
                        <span>Applied {selectedRequest.appliedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Info</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Name</label>
                        <p className="text-sm text-gray-900 font-semibold">{selectedRequest.studentName}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Department</label>
                        <p className="text-sm text-gray-900 font-semibold">{selectedRequest.department}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Room/Block</label>
                        <p className="text-sm text-gray-900 font-semibold">{selectedRequest.roomNumber} / {selectedRequest.hostelBlock}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Campus</label>
                        <p className="text-sm text-gray-900 font-semibold">{selectedRequest.campus}</p>
                      </div>
                    </div>
                  </div>

                  {/* Leave/Outing Details */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">{selectedRequest.type} Details</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Plane className="w-4 h-4 text-gray-600" />
                          <label className="text-xs text-gray-600 font-semibold">Departure</label>
                        </div>
                        <p className="text-sm text-gray-900 font-bold">{selectedRequest.departureDate}</p>
                        <p className="text-xs text-gray-600">{selectedRequest.departureTime}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Plane className="w-4 h-4 text-gray-600 transform rotate-180" />
                          <label className="text-xs text-gray-600 font-semibold">Return</label>
                        </div>
                        <p className="text-sm text-gray-900 font-bold">{selectedRequest.returnDate}</p>
                        <p className="text-xs text-gray-600">{selectedRequest.returnTime}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-600" />
                          <label className="text-xs text-gray-600 font-semibold">Destination</label>
                        </div>
                        <p className="text-sm text-gray-900 font-bold">{selectedRequest.destination}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Reason</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-800 leading-relaxed">{selectedRequest.fullReason}</p>
                    </div>
                  </div>

                  {/* Approval Workflow */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Approval Workflow</h3>
                    <div className="flex items-center justify-between">
                      {['SUBMITTED', 'MENTOR', 'ADVISOR', 'HOD', 'FINAL'].map((stage, index) => (
                        <React.Fragment key={stage}>
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                              stage === selectedRequest.approvalStage 
                                ? 'bg-[#CD0000] text-white' 
                                : index < ['SUBMITTED', 'MENTOR', 'ADVISOR', 'HOD', 'FINAL'].indexOf(selectedRequest.approvalStage)
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {stage === selectedRequest.approvalStage ? (
                                <div className="w-3 h-3 bg-white rounded-full" />
                              ) : index < ['SUBMITTED', 'MENTOR', 'ADVISOR', 'HOD', 'FINAL'].indexOf(selectedRequest.approvalStage) ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <div className="w-3 h-3 bg-gray-400 rounded-full" />
                              )}
                            </div>
                            <span className="text-xs font-semibold text-gray-700 mt-2">{stage}</span>
                          </div>
                          {index < 4 && (
                            <div className={`flex-1 h-1 mx-2 ${
                              index < ['SUBMITTED', 'MENTOR', 'ADVISOR', 'HOD', 'FINAL'].indexOf(selectedRequest.approvalStage)
                                ? 'bg-green-500'
                                : 'bg-gray-200'
                            }`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Previous Actions */}
                  {selectedRequest.previousRemarks && selectedRequest.previousRemarks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Previous Actions</h3>
                      <div className="space-y-2">
                        {selectedRequest.previousRemarks.map((remark, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-gray-900">{remark.role}</span>
                              <span className="text-xs text-green-600 font-semibold">• {remark.action}</span>
                            </div>
                            <p className="text-sm text-gray-700">{remark.remark}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason Display */}
                  {selectedRequest.status === 'Rejected' && selectedRequest.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-red-800 mb-2">Rejection Reason</h3>
                      <p className="text-sm text-red-700">{selectedRequest.rejectionReason}</p>
                    </div>
                  )}

                  {/* Official Remarks & Decision */}
                  {selectedRequest.status === 'Pending' && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Official Remarks & Decision</h3>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Enter your remarks here..."
                        rows={4}
                        className="w-full p-4 border border-gray-300 rounded-lg outline-none focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 text-sm resize-none"
                      />
                      <div className="flex gap-4 mt-4">
                        <button
                          onClick={() => handleReject(selectedRequest.id)}
                          className="flex-1 px-6 py-3 bg-white text-[#CD0000] border-2 border-[#CD0000] rounded-lg font-bold transition-all hover:bg-red-50 active:scale-95"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(selectedRequest.id)}
                          className="flex-1 px-6 py-3 bg-[#CD0000] text-white rounded-lg font-bold transition-all hover:bg-[#a80000] active:scale-95 shadow-md"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Review & Approve for previously rejected */}
                  {selectedRequest.status === 'Rejected' && (
                    <div>
                      <button
                        onClick={() => {
                          setSelectedRequest({ ...selectedRequest, status: 'Pending' });
                          setRequests(prev => prev.map(req => 
                            req.id === selectedRequest.id ? { ...req, status: 'Pending' } : req
                          ));
                        }}
                        className="w-full px-6 py-3 bg-[#CD0000] text-white rounded-lg font-bold transition-all hover:bg-[#a80000] active:scale-95 shadow-md"
                      >
                        Review & Approve
                      </button>
                    </div>
                  )}

                  {selectedRequest.status === 'Approved' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-green-800">Request Approved</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p className="text-lg font-semibold">Select a request to view details</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'inbox':
        return (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <Inbox className="w-6 h-6 text-[#CD0000]" />
                Inbox
              </h2>
              <p className="text-gray-600 mt-1">Notifications and updates regarding requests.</p>
            </div>
            <div className="space-y-4">
              {mockNotifications.map((notif) => (
                <div key={notif.id} className={`rounded-lg p-5 border ${notif.read ? 'border-gray-200 bg-white' : 'border-[#CD0000] bg-red-50'} shadow-sm hover:shadow-md transition-all flex gap-4`}>
                  <div className={`mt-1 rounded-full p-2 h-max ${notif.read ? 'bg-gray-100 text-gray-500' : 'bg-[#CD0000]/10 text-[#CD0000]'}`}>
                    <Mail className="w-5 h-5" />
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

      case 'students':
        return (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <Users className="w-6 h-6 text-[#CD0000]" />
                My Students
              </h2>
              <p className="text-gray-600 mt-1">View students under your mentorship.</p>
            </div>
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{req.studentName}</h3>
                      <p className="text-sm text-gray-600 font-medium">{req.registerNumber}</p>
                      <p className="text-sm text-gray-600">{req.department} - Year {req.year}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-600"><span className="font-semibold">Block:</span> {req.hostelBlock}</p>
                      <p className="text-gray-600"><span className="font-semibold">Room:</span> {req.roomNumber}</p>
                      <p className="text-gray-600"><span className="font-semibold">Mobile:</span> {req.mobile}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <User className="w-6 h-6 text-[#CD0000]" />
                My Profile
              </h2>
              <p className="text-gray-600 mt-1">View and manage your profile information.</p>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Full Name</span>
                  <span className="font-semibold text-gray-900">Dr. A. Smith</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Role</span>
                  <span className="font-semibold text-gray-900">Mentor</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Department</span>
                  <span className="font-semibold text-gray-900">Computer Science & Engineering</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Employee ID</span>
                  <span className="font-semibold text-gray-900">EMP2024001</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Email</span>
                  <span className="font-semibold text-gray-900">a.smith@sns.edu.in</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Mobile</span>
                  <span className="font-semibold text-gray-900">9876543200</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm md:h-screen sticky top-0">
        <div className="p-6 border-b border-gray-200 flex items-center gap-3">
          <div className="bg-[#CD0000] p-2 rounded-lg shadow-sm">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            PassN<span className="text-[#CD0000]">Track</span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('requests')} 
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'requests' 
                ? 'bg-[#CD0000] text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5" /> Requests
          </button>
          <button 
            onClick={() => setActiveTab('inbox')} 
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'inbox' 
                ? 'bg-[#CD0000] text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Inbox className="w-5 h-5" /> Inbox
            {mockNotifications.filter(n => !n.read).length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {mockNotifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('students')} 
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'students' 
                ? 'bg-[#CD0000] text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" /> My Students
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'profile' 
                ? 'bg-[#CD0000] text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <User className="w-5 h-5" /> Profile
          </button>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-gray-700 hover:text-[#CD0000] hover:bg-red-50 font-semibold rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto">
        {/* Top Navbar */}
        <header className="px-8 py-5 flex justify-between items-center bg-white border-b border-gray-200 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight capitalize">
            {activeTab === 'students' ? 'My Students' : activeTab}
          </h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('inbox')} 
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700"
            >
              <Mail className="w-5 h-5" />
              {mockNotifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            <div 
              className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors" 
              onClick={() => setActiveTab('profile')}
            >
              <div className="w-8 h-8 rounded-full bg-[#CD0000] flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-bold text-gray-900 leading-tight">Dr. A. Smith</p>
                <p className="text-gray-600 text-xs leading-tight">Mentor</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 h-[calc(100vh-80px)]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
