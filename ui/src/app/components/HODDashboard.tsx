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
  Mail,
  Building2,
  DoorClosed,
  Plane,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router';

// Mock Data
interface ApprovalLog {
  role: string;
  approverName: string;
  action: 'Approved' | 'Rejected';
  remark: string;
  timestamp: string;
}

interface Request {
  id: string;
  studentName: string;
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
  section?: string;
  hostelBlock: string;
  roomNumber: string;
  campus: string;
  submittedAt: string;
  appliedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  currentStage: 'hod';
  approvalHistory: ApprovalLog[];
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
    reason: "Visiting home for my sister's wedding ceremony",
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
    section: "A",
    hostelBlock: "Block A",
    roomNumber: "302-B",
    campus: "Main North Campus",
    submittedAt: "Oct 24, 10:45 AM",
    appliedDate: "Oct 24, 2023 | 10:45 AM",
    status: "Pending",
    currentStage: "hod",
    approvalHistory: [
      {
        role: "Mentor",
        approverName: "Dr. A. Smith",
        action: "Approved",
        remark: "Student has good attendance record. Family event is genuine. Approved.",
        timestamp: "Oct 24, 2023 | 02:30 PM"
      },
      {
        role: "Advisor",
        approverName: "Prof. B. Johnson",
        action: "Approved",
        remark: "Academic performance is excellent. No pending assignments. Approved.",
        timestamp: "Oct 25, 2023 | 11:15 AM"
      }
    ]
  },
  {
    id: "LVP-2023-0042",
    studentName: "Alex Johnson",
    registerNumber: "710019104025",
    email: "alex.j@sns.edu.in",
    type: "Leave",
    requestType: "Medical Leave",
    reason: "Medical appointment with specialist",
    fullReason: "I have a scheduled medical appointment with a specialist regarding an ongoing health issue. The appointment has been confirmed and requires my presence. Medical reports are attached.",
    departureDate: "Oct 27, 2023",
    departureTime: "09:30 AM",
    returnDate: "Oct 27, 2023",
    returnTime: "06:00 PM",
    destination: "City Hospital, Coimbatore",
    mobile: "9876543220",
    parentMobile: "9876543221",
    department: "Electronics & Communication",
    year: "2",
    section: "B",
    hostelBlock: "Block B",
    roomNumber: "215",
    campus: "Main North Campus",
    submittedAt: "Oct 24, 09:30 AM",
    appliedDate: "Oct 24, 2023 | 09:30 AM",
    status: "Approved",
    currentStage: "hod",
    approvalHistory: [
      {
        role: "Mentor",
        approverName: "Dr. C. Williams",
        action: "Approved",
        remark: "Medical documentation verified. Valid reason. Approved.",
        timestamp: "Oct 24, 2023 | 03:00 PM"
      },
      {
        role: "Advisor",
        approverName: "Prof. D. Miller",
        action: "Approved",
        remark: "Medical necessity confirmed. Approved for same-day return.",
        timestamp: "Oct 25, 2023 | 10:00 AM"
      }
    ]
  },
  {
    id: "OTP-2023-0043",
    studentName: "Michael Chen",
    registerNumber: "710019104050",
    email: "michael.c@sns.edu.in",
    type: "Outing",
    requestType: "Personal Outing",
    reason: "Project material purchase for final year project",
    fullReason: "I need to purchase specific electronic components and materials required for my final year project. These items are not available in local stores and need to be purchased from the electronics market in the city.",
    departureDate: "Oct 26, 2023",
    departureTime: "02:00 PM",
    returnDate: "Oct 26, 2023",
    returnTime: "07:00 PM",
    destination: "Electronics Market, Coimbatore",
    mobile: "9876543230",
    parentMobile: "9876543231",
    department: "Computer Science",
    year: "4",
    section: "A",
    hostelBlock: "Block A",
    roomNumber: "301",
    campus: "Main North Campus",
    submittedAt: "Oct 25, 02:15 PM",
    appliedDate: "Oct 25, 2023 | 02:15 PM",
    status: "Pending",
    currentStage: "hod",
    approvalHistory: [
      {
        role: "Mentor",
        approverName: "Dr. A. Smith",
        action: "Approved",
        remark: "Project requirement verified. Approved.",
        timestamp: "Oct 25, 2023 | 04:30 PM"
      },
      {
        role: "Advisor",
        approverName: "Prof. B. Johnson",
        action: "Approved",
        remark: "Final year project necessity. Approved.",
        timestamp: "Oct 26, 2023 | 09:00 AM"
      }
    ]
  },
  {
    id: "LVP-2023-0044",
    studentName: "Priya Sharma",
    registerNumber: "710019104072",
    email: "priya.s@sns.edu.in",
    type: "Leave",
    requestType: "Special Leave",
    reason: "National level sports championship participation",
    fullReason: "I have been selected to represent the state in the National Level Sports Championship for badminton. This is a significant achievement and the event runs for 3 days. Official invitation letter is attached.",
    departureDate: "Oct 28, 2023",
    departureTime: "06:00 AM",
    returnDate: "Oct 31, 2023",
    returnTime: "08:00 PM",
    destination: "Bangalore Sports Complex",
    mobile: "9876543240",
    parentMobile: "9876543241",
    department: "Information Technology",
    year: "3",
    section: "B",
    hostelBlock: "Block C",
    roomNumber: "205",
    campus: "Main North Campus",
    submittedAt: "Oct 23, 11:50 AM",
    appliedDate: "Oct 23, 2023 | 11:50 AM",
    status: "Pending",
    currentStage: "hod",
    approvalHistory: [
      {
        role: "Mentor",
        approverName: "Dr. E. Davis",
        action: "Approved",
        remark: "Excellent achievement. Official documentation verified. Highly recommended.",
        timestamp: "Oct 23, 2023 | 05:00 PM"
      },
      {
        role: "Advisor",
        approverName: "Prof. F. Wilson",
        action: "Approved",
        remark: "Outstanding sports achievement. Full support. Approved.",
        timestamp: "Oct 24, 2023 | 10:30 AM"
      }
    ]
  },
  {
    id: "LVP-2023-0045",
    studentName: "David Miller",
    registerNumber: "710019104088",
    email: "david.m@sns.edu.in",
    type: "Leave",
    requestType: "Weekend Leave",
    reason: "Family function - grandparent's 75th birthday",
    fullReason: "My grandparent's 75th birthday celebration is being organized by the family. As the eldest grandchild, my presence is important. The event is a one-day function.",
    departureDate: "Oct 29, 2023",
    departureTime: "10:00 AM",
    returnDate: "Oct 30, 2023",
    returnTime: "09:00 PM",
    destination: "Madurai",
    mobile: "9876543250",
    parentMobile: "9876543251",
    department: "Mechanical Engineering",
    year: "2",
    section: "A",
    hostelBlock: "Block D",
    roomNumber: "115",
    campus: "Main North Campus",
    submittedAt: "Oct 25, 11:50 AM",
    appliedDate: "Oct 25, 2023 | 11:50 AM",
    status: "Rejected",
    currentStage: "hod",
    approvalHistory: [
      {
        role: "Mentor",
        approverName: "Dr. G. Taylor",
        action: "Approved",
        remark: "Important family event. Approved.",
        timestamp: "Oct 25, 2023 | 03:00 PM"
      },
      {
        role: "Advisor",
        approverName: "Prof. H. Brown",
        action: "Approved",
        remark: "Family commitment is valid. Approved.",
        timestamp: "Oct 26, 2023 | 11:00 AM"
      }
    ],
    rejectionReason: "Multiple leave requests in the same month. Attendance already below 80%. Request denied."
  }
];

const mockNotifications = [
  { id: 1, title: "New Request for Review", message: "Jane Smith's leave request has been forwarded to you for approval.", time: "2 hours ago", read: false },
  { id: 2, title: "Request Approved", message: "You approved leave request for Alex Johnson.", time: "1 day ago", read: true },
  { id: 3, title: "Request Rejected", message: "You rejected leave request for David Miller.", time: "2 days ago", read: true },
];

export function HODDashboard() {
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
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
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
                HOD Approval Queue
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
                    <div className="mb-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-sm">{req.studentName}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${getStatusBadgeClass(req.status)}`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">{req.department} • {req.year}rd Year</p>
                    </div>
                    
                    <p className="text-xs font-semibold text-gray-700 mb-1">{req.requestType}</p>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3">{req.reason}</p>
                    
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Check className="w-3 h-3" />
                        <span className="font-semibold">Mentor</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Check className="w-3 h-3" />
                        <span className="font-semibold">Advisor</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500">Submitted: {req.submittedAt}</p>
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

                  {/* Student Info */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Student Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Name</label>
                        <p className="text-sm text-gray-900 font-semibold">{selectedRequest.studentName}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Department</label>
                        <p className="text-sm text-gray-900 font-semibold">{selectedRequest.department}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Year & Section</label>
                        <p className="text-sm text-gray-900 font-semibold">{selectedRequest.year}rd Year - {selectedRequest.section}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Room/Block</label>
                        <p className="text-sm text-gray-900 font-semibold">{selectedRequest.roomNumber} / {selectedRequest.hostelBlock}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Campus</label>
                        <p className="text-sm text-gray-900 font-semibold">{selectedRequest.campus}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Register No</label>
                        <p className="text-sm text-gray-900 font-semibold">{selectedRequest.registerNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">{selectedRequest.type} Details</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Plane className="w-4 h-4 text-gray-600" />
                          <label className="text-xs text-gray-600 font-semibold">
                            {selectedRequest.type === 'Leave' ? 'Departure' : 'Out Time'}
                          </label>
                        </div>
                        <p className="text-sm text-gray-900 font-bold">{selectedRequest.departureDate}</p>
                        <p className="text-xs text-gray-600">{selectedRequest.departureTime}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Plane className="w-4 h-4 text-gray-600 transform rotate-180" />
                          <label className="text-xs text-gray-600 font-semibold">
                            {selectedRequest.type === 'Leave' ? 'Return' : 'Return Time'}
                          </label>
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

                  {/* Approval History */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Approval History</h3>
                    <div className="space-y-3">
                      {selectedRequest.approvalHistory.map((log, index) => (
                        <div key={index} className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-bold text-gray-900">{log.role} Approval</span>
                            <span className="ml-auto text-xs text-gray-500">{log.timestamp}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-semibold">Name:</span> {log.approverName}
                          </p>
                          <p className="text-xs text-gray-600">
                            <span className="font-semibold">Remark:</span> {log.remark}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Approval Timeline */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Approval Timeline</h3>
                    <div className="flex items-center justify-between">
                      {[
                        { stage: 'SUBMITTED', name: selectedRequest.studentName },
                        { stage: 'MENTOR', name: selectedRequest.approvalHistory[0]?.approverName },
                        { stage: 'ADVISOR', name: selectedRequest.approvalHistory[1]?.approverName },
                        { stage: 'HOD', name: 'Pending' },
                        { stage: 'WARDEN', name: 'Pending' }
                      ].map((step, index) => (
                        <React.Fragment key={step.stage}>
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 3 && selectedRequest.status === 'Pending'
                                ? 'bg-[#CD0000] text-white ring-4 ring-red-100'
                                : index < 3
                                ? 'bg-green-500 text-white'
                                : selectedRequest.status === 'Approved' && index === 3
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {index < 3 || (selectedRequest.status === 'Approved' && index === 3) ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : index === 3 && selectedRequest.status === 'Pending' ? (
                                <div className="w-3 h-3 bg-white rounded-full" />
                              ) : (
                                <div className="w-3 h-3 bg-gray-400 rounded-full" />
                              )}
                            </div>
                            <span className="text-xs font-semibold text-gray-700 mt-2">{step.stage}</span>
                            {step.name && step.name !== 'Pending' && (
                              <span className="text-xs text-gray-500 text-center mt-0.5">{step.name}</span>
                            )}
                          </div>
                          {index < 4 && (
                            <div className={`flex-1 h-1 mx-2 ${
                              index < 2 || (selectedRequest.status === 'Approved' && index === 2)
                                ? 'bg-green-500'
                                : 'bg-gray-200'
                            }`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Rejection Display */}
                  {selectedRequest.status === 'Rejected' && selectedRequest.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <h3 className="text-sm font-bold text-red-800">Rejected by HOD</h3>
                      </div>
                      <p className="text-sm text-red-700"><span className="font-semibold">Reason:</span> {selectedRequest.rejectionReason}</p>
                    </div>
                  )}

                  {/* Action Section */}
                  {selectedRequest.status === 'Pending' && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">HOD Decision</h3>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Enter your remarks here (optional for approval, required for rejection)..."
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
                          Approve & Forward to Warden
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
                      <p className="text-sm font-bold text-green-800">Request Approved & Forwarded to Warden</p>
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
                  <span className="font-semibold text-gray-900">Dr. K. Anderson</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Role</span>
                  <span className="font-semibold text-gray-900">Head of Department (HOD)</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Department</span>
                  <span className="font-semibold text-gray-900">Computer Science & Engineering</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Employee ID</span>
                  <span className="font-semibold text-gray-900">HOD-CSE-2024</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Email</span>
                  <span className="font-semibold text-gray-900">hod.cse@sns.edu.in</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Mobile</span>
                  <span className="font-semibold text-gray-900">9876543100</span>
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
            {activeTab === 'requests' ? 'HOD Approval Requests' : activeTab}
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
                KA
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-bold text-gray-900 leading-tight">Dr. K. Anderson</p>
                <p className="text-gray-600 text-xs leading-tight">HOD - CSE</p>
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
