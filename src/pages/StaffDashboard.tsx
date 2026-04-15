import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  FileText,
  GraduationCap,
  Inbox,
  LogOut,
  Mail,
  MapPin,
  Plane,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

type StaffRole = 'mentor' | 'advisor' | 'hod';
type ApprovalRole = StaffRole | 'warden' | 'principal';
type RequestType = 'leave' | 'outing';
type RequestStatus = 'pending' | 'approved' | 'rejected';
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'reconsidered';

interface RequestSummary {
  id: string;
  requestType: RequestType;
  studentName: string;
  studentEmail: string;
  requestLabel: string;
  reason: string;
  destination: string;
  status: RequestStatus;
  currentApprover: string | null;
  approvalChain: string[];
  createdAt: string;
  departureDate?: string | null;
  returnDate?: string | null;
  departureDateTime?: string | null;
  returnDateTime?: string | null;
  mentorEmail?: string | null;
  rejectionReason?: string | null;
  mentorStatus?: string | null;
  advisorStatus?: string | null;
  hodStatus?: string | null;
}

interface StudentProfileSnapshot {
  id: string;
  fullName: string;
  registerNumber?: string | null;
  department?: string | null;
  yearOfStudy?: string | null;
  hostelBlock?: string | null;
  roomNumber?: string | null;
  institute?: string | null;
  mobileNumber?: string | null;
  parentMobile?: string | null;
}

interface ApprovalEntry {
  id: string;
  role: ApprovalRole;
  status: ApprovalStatus;
  reason?: string | null;
  approverName?: string | null;
  createdAt: string;
}

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface StudentRow {
  id: string;
  email?: string | null;
  full_name: string | null;
  register_number: string | null;
  department: string | null;
  year: string | null;
  hostel_block: string | null;
  room_number: string | null;
  mobile_number: string | null;
}

const APPROVAL_STAGES = ['SUBMITTED', 'MENTOR', 'ADVISOR', 'HOD', 'FINAL'] as const;
const DEFAULT_APPROVAL_CHAIN: ApprovalRole[] = ['mentor', 'advisor', 'hod', 'warden', 'principal'];

const titleCase = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

const normalizeStaffRole = (role?: string | null): StaffRole | null => {
  if (!role) return null;
  const normalized = role.toLowerCase();
  if (normalized === 'staff') return 'mentor';
  if (normalized === 'mentor' || normalized === 'advisor' || normalized === 'hod') return normalized as StaffRole;
  return null;
};

const normalizeStatus = (status?: string | null): RequestStatus => {
  if (status === 'approved') return 'approved';
  if (status === 'rejected' || status === 'declined') return 'rejected';
  return 'pending';
};

const normalizeApprovalStatus = (status?: string | null): ApprovalStatus | null => {
  if (!status) return null;
  if (status === 'approved' || status === 'rejected' || status === 'pending' || status === 'reconsidered') {
    return status as ApprovalStatus;
  }
  if (status === 'declined') return 'rejected';
  return null;
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const hasTimePart = (value?: string | null) => Boolean(value && (value.includes('T') || value.includes(':')));

const formatDateTimeLabel = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatRoleLabel = (role?: string | null) => {
  switch ((role || '').toLowerCase()) {
    case 'mentor':
      return 'Mentor Request';
    case 'advisor':
      return 'Advisor Request';
    case 'hod':
      return 'HOD Request';
    case 'warden':
      return 'Warden Request';
    case 'principal':
      return 'Principal Request';
    default:
      return 'Request';
  }
};

const getStatusBadgeClass = (status: RequestStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'approved':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const normalizeApprovalChain = (chain?: string[] | null): ApprovalRole[] => {
  const normalized = (chain || [])
    .map((role) => role.toLowerCase())
    .filter((role): role is ApprovalRole => DEFAULT_APPROVAL_CHAIN.includes(role as ApprovalRole));
  if (normalized.length < 2) return DEFAULT_APPROVAL_CHAIN;
  return DEFAULT_APPROVAL_CHAIN.filter((role) => normalized.includes(role));
};

const buildFallbackHistory = (request: RequestSummary): ApprovalEntry[] => {
  const entries: ApprovalEntry[] = [];

  const pushEntry = (role: ApprovalRole, status?: string | null) => {
    const normalized = normalizeApprovalStatus(status);
    if (!normalized || normalized === 'pending') return;
    entries.push({
      id: `${request.id}-${role}`,
      role,
      status: normalized,
      reason: role === request.currentApprover ? request.rejectionReason : null,
      createdAt: request.createdAt,
    });
  };

  pushEntry('mentor', request.mentorStatus);
  pushEntry('advisor', request.advisorStatus);
  pushEntry('hod', request.hodStatus);

  if (request.status === 'rejected' && request.currentApprover) {
    const rejectedRole = request.currentApprover.toLowerCase() as ApprovalRole;
    if (!entries.some((entry) => entry.role === rejectedRole)) {
      entries.push({
        id: `${request.id}-${rejectedRole}`,
        role: rejectedRole,
        status: 'rejected',
        reason: request.rejectionReason,
        createdAt: request.createdAt,
      });
    }
  }

  return entries;
};

const getStageLabel = (role?: string | null) => {
  switch ((role || '').toLowerCase()) {
    case 'mentor':
      return 'MENTOR';
    case 'advisor':
      return 'ADVISOR';
    case 'hod':
      return 'HOD';
    case 'warden':
    case 'principal':
      return 'FINAL';
    default:
      return 'SUBMITTED';
  }
};

const RequestItem = ({
  request,
  active,
  onSelect,
}: {
  request: RequestSummary;
  active: boolean;
  onSelect: () => void;
}) => (
  <div
    onClick={onSelect}
    className={`p-4 rounded-lg cursor-pointer transition-all border ${
      active ? 'border-[#CD0000] bg-red-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
    }`}
  >
    <div className="flex items-start gap-3 mb-2">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700 flex-shrink-0">
        {request.studentName
          .split(' ')
          .map((n) => n[0])
          .join('')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-gray-900 text-sm">{request.studentName}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${getStatusBadgeClass(request.status)}`}>
            {request.status.toUpperCase()}
          </span>
        </div>
        <p className="text-xs font-semibold text-gray-700 mb-1">{titleCase(request.requestType)} Request</p>
        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{request.reason}</p>
        <p className="text-xs text-gray-500">Submitted: {formatDateTimeLabel(request.createdAt)}</p>
      </div>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-[#CD0000] bg-red-50 border border-red-100 rounded-lg px-2 py-1">
        {request.requestLabel}
      </span>
      <span className="text-xs text-gray-500">{titleCase(request.requestType)}</span>
    </div>
  </div>
);

const RequestList = ({
  requests,
  selectedId,
  title,
  loading,
  onSelect,
}: {
  requests: RequestSummary[];
  selectedId: string | null;
  title: string;
  loading: boolean;
  onSelect: (request: RequestSummary) => void;
}) => (
  <div className="lg:w-[30%] bg-white rounded-xl shadow-sm border p-6 overflow-y-auto max-h-[calc(100vh-180px)]">
    <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
    {loading ? (
      <div className="text-sm text-gray-500">Loading requests...</div>
    ) : requests.length === 0 ? (
      <div className="text-sm text-gray-500">No requests pending your review.</div>
    ) : (
      <div className="space-y-3">
        {requests.map((request) => (
          <RequestItem
            key={`${request.requestType}-${request.id}`}
            request={request}
            active={selectedId === request.id}
            onSelect={() => onSelect(request)}
          />
        ))}
      </div>
    )}
  </div>
);

const Timeline = ({
  currentStage,
  isRejected,
}: {
  currentStage: typeof APPROVAL_STAGES[number];
  isRejected: boolean;
}) => (
  <div className="flex items-center justify-between">
    {APPROVAL_STAGES.map((stage, index) => {
      const currentIndex = APPROVAL_STAGES.indexOf(currentStage);
      const isActive = stage === currentStage;
      const isComplete = index < currentIndex;
      const isRejectedStage = isActive && isRejected;
      const stageClass = isRejectedStage
        ? 'bg-red-500 text-white'
        : isActive
        ? 'bg-[#CD0000] text-white'
        : isComplete
        ? 'bg-green-500 text-white'
        : 'bg-gray-200 text-gray-600';

      return (
        <React.Fragment key={stage}>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${stageClass}`}>
              {isActive ? (
                <div className="w-3 h-3 bg-white rounded-full" />
              ) : isComplete ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <div className="w-3 h-3 bg-gray-400 rounded-full" />
              )}
            </div>
            <span className="text-xs font-semibold text-gray-700 mt-2">{stage}</span>
          </div>
          {index < APPROVAL_STAGES.length - 1 && (
            <div className={`flex-1 h-1 mx-2 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const ActionSection = ({
  status,
  remarks,
  onRemarksChange,
  onApprove,
  onReject,
  onReconsider,
  canAct,
  actionLoading,
}: {
  status: RequestStatus;
  remarks: string;
  onRemarksChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onReconsider: () => void;
  canAct: boolean;
  actionLoading: boolean;
}) => {
  if (!canAct) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-sm font-semibold text-gray-600">You cannot take action at this stage.</p>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div>
        <button
          onClick={onReconsider}
          className="w-full px-6 py-3 bg-[#CD0000] text-white rounded-lg font-bold transition-all hover:bg-[#a80000] active:scale-95 shadow-md"
          disabled={actionLoading}
        >
          {actionLoading ? 'Updating...' : 'Review & Approve'}
        </button>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
        <p className="text-sm font-bold text-green-800">Request Approved</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Official Remarks & Decision</h3>
      <textarea
        value={remarks}
        onChange={(e) => onRemarksChange(e.target.value)}
        placeholder="Enter your remarks here..."
        rows={4}
        className="w-full p-4 border border-gray-300 rounded-lg outline-none focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 text-sm resize-none"
      />
      <div className="flex gap-4 mt-4">
        <button
          onClick={onReject}
          className="flex-1 px-6 py-3 bg-white text-[#CD0000] border-2 border-[#CD0000] rounded-lg font-bold transition-all hover:bg-red-50 active:scale-95"
          disabled={actionLoading}
        >
          {actionLoading ? 'Saving...' : 'Reject'}
        </button>
        <button
          onClick={onApprove}
          className="flex-1 px-6 py-3 bg-[#CD0000] text-white rounded-lg font-bold transition-all hover:bg-[#a80000] active:scale-95 shadow-md"
          disabled={actionLoading}
        >
          {actionLoading ? 'Saving...' : 'Approve'}
        </button>
      </div>
    </div>
  );
};

const RequestDetails = ({
  request,
  student,
  approvalHistory,
  remarks,
  onRemarksChange,
  onApprove,
  onReject,
  onReconsider,
  canAct,
  actionLoading,
}: {
  request: RequestSummary | null;
  student: StudentProfileSnapshot | null;
  approvalHistory: ApprovalEntry[];
  remarks: string;
  onRemarksChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onReconsider: () => void;
  canAct: boolean;
  actionLoading: boolean;
}) => {
  if (!request) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p className="text-lg font-semibold">Select a request to view details</p>
      </div>
    );
  }

  const departureDate = request.requestType === 'leave' ? formatDate(request.departureDate) : formatDate(request.departureDateTime);
  const departureTime = request.requestType === 'leave'
    ? '-'
    : (hasTimePart(request.departureDateTime) ? formatTime(request.departureDateTime) : '-');
  const returnDate = request.requestType === 'leave' ? formatDate(request.returnDate) : formatDate(request.returnDateTime);
  const returnTime = request.requestType === 'leave'
    ? '-'
    : (hasTimePart(request.returnDateTime) ? formatTime(request.returnDateTime) : '-');
  const currentStage = getStageLabel(request.currentApprover);
  const isRejected = request.status === 'rejected';

  return (
    <div className="lg:w-[70%] bg-white rounded-xl shadow-sm border p-8 overflow-y-auto max-h-[calc(100vh-180px)]">
      <div className="space-y-6">
        <div className="flex items-start justify-between pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{titleCase(request.requestType)} Request</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-semibold">Ref ID: {request.id}</span>
              <span>•</span>
              <span>Applied {formatDateTimeLabel(request.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Info</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1">Name</label>
              <p className="text-sm text-gray-900 font-semibold">{student?.fullName || request.studentName}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1">Department</label>
              <p className="text-sm text-gray-900 font-semibold">{student?.department || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1">Room/Block</label>
              <p className="text-sm text-gray-900 font-semibold">{student?.roomNumber || '-'} / {student?.hostelBlock || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1">Campus</label>
              <p className="text-sm text-gray-900 font-semibold">{student?.institute || '-'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">{titleCase(request.requestType)} Details</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-4 h-4 text-gray-600" />
                <label className="text-xs text-gray-600 font-semibold">Departure</label>
              </div>
              <p className="text-sm text-gray-900 font-bold">{departureDate}</p>
              <p className="text-xs text-gray-600">{departureTime}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-4 h-4 text-gray-600 transform rotate-180" />
                <label className="text-xs text-gray-600 font-semibold">Return</label>
              </div>
              <p className="text-sm text-gray-900 font-bold">{returnDate}</p>
              <p className="text-xs text-gray-600">{returnTime}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <label className="text-xs text-gray-600 font-semibold">Destination</label>
              </div>
              <p className="text-sm text-gray-900 font-bold">{request.destination}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Reason</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-800 leading-relaxed">{request.reason}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Approval Workflow</h3>
          <Timeline currentStage={currentStage} isRejected={isRejected} />
        </div>

        {approvalHistory.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Previous Actions</h3>
            <div className="space-y-2">
              {approvalHistory
                .filter((entry) => entry.status === 'approved' || entry.status === 'rejected')
                .map((entry) => (
                  <div
                    key={entry.id}
                    className={`bg-gray-50 rounded-lg p-4 border-l-4 ${
                      entry.status === 'approved' ? 'border-green-500' : 'border-red-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900">{titleCase(entry.role)}</span>
                      <span className={`text-xs font-semibold ${entry.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                        • {titleCase(entry.status)}
                      </span>
                    </div>
                    {entry.reason && <p className="text-sm text-gray-700">{entry.reason}</p>}
                  </div>
                ))}
            </div>
          </div>
        )}

        {request.status === 'rejected' && request.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-red-800 mb-2">Rejection Reason</h3>
            <p className="text-sm text-red-700">{request.rejectionReason}</p>
          </div>
        )}

        <ActionSection
          status={request.status}
          remarks={remarks}
          onRemarksChange={onRemarksChange}
          onApprove={onApprove}
          onReject={onReject}
          onReconsider={onReconsider}
          canAct={canAct}
          actionLoading={actionLoading}
        />
      </div>
    </div>
  );
};

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { profile, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [selectedRequestSummary, setSelectedRequestSummary] = useState<RequestSummary | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestSummary | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfileSnapshot | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalEntry[]>([]);
  const [remarks, setRemarks] = useState('');
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);

  const staffRole = normalizeStaffRole(profile?.role);
  const displayName = profile?.full_name || profile?.email || 'Staff';

  const queryAssignedStudents = useCallback(async (role: StaffRole, staffId?: string | null, staffEmail?: string | null) => {
    const idColumn = role === 'mentor' ? 'mentor_id' : role === 'advisor' ? 'advisor_id' : 'hod_id';
    const emailColumn = role === 'mentor' ? 'mentor_email' : role === 'advisor' ? 'advisor_email' : 'hod_email';

    const buildQuery = (column: string, value: string) =>
      supabase
        .from('user_profile_view')
        .select('*')
        .eq('role', 'student')
        .eq(column, value)
        .order('full_name', { ascending: true });

    if (staffId) {
      const response = await buildQuery(idColumn, staffId);
      if (!response.error || response.error.code !== '42703') {
        return response;
      }
    }

    if (staffEmail) {
      return buildQuery(emailColumn, staffEmail);
    }

    return { data: [], error: null } as { data: any[]; error: any };
  }, []);

  const loadStudentEmails = useCallback(
    async (role: StaffRole, staffId?: string | null, staffEmail?: string | null) => {
      const { data, error } = await queryAssignedStudents(role, staffId, staffEmail);
      if (error) {
        console.error('Unable to load assigned students:', error);
        return [] as string[];
      }
      return (data || []).map((row) => row.email).filter(Boolean);
    },
    [queryAssignedStudents],
  );

  const buildRequestSummary = useCallback((row: any, requestType: RequestType): RequestSummary => {
    return {
      id: row.id,
      requestType,
      studentName: row.student_name,
      studentEmail: row.student_email,
      requestLabel: formatRoleLabel(row.current_approver),
      reason: row.reason,
      destination: row.destination,
      status: normalizeStatus(row.status),
      currentApprover: row.current_approver ?? null,
      approvalChain: row.approval_chain || [],
      createdAt: row.created_at,
      departureDate: row.departure_date ?? null,
      returnDate: row.return_date ?? null,
      departureDateTime: row.departure_datetime ?? null,
      returnDateTime: row.return_datetime ?? null,
      mentorEmail: row.mentor_email ?? null,
      rejectionReason: row.rejection_reason ?? null,
      mentorStatus: row.mentor_status ?? null,
      advisorStatus: row.advisor_status ?? null,
      hodStatus: row.hod_status ?? null,
    };
  }, []);

  const loadRequests = useCallback(async () => {
    if (!staffRole || !profile) return;
    setLoadingRequests(true);
    try {
      const studentEmails = await loadStudentEmails(staffRole, profile.id, profile.email);
      const baseSelect =
        'id, student_email, student_name, mentor_email, destination, reason, status, current_approver, approval_chain, created_at, departure_date, return_date, departure_datetime, return_datetime, rejection_reason, mentor_status, advisor_status, hod_status';

      const applyFilters = (query: any) => {
        let nextQuery = query.eq('current_approver', staffRole).in('status', ['pending', 'rejected']);
        if (staffRole === 'mentor' && profile.email) {
          nextQuery = nextQuery.eq('mentor_email', profile.email);
        } else if (studentEmails.length > 0) {
          nextQuery = nextQuery.in('student_email', studentEmails);
        } else {
          nextQuery = nextQuery.eq('student_email', '__no_assigned_students__');
        }
        return nextQuery;
      };

      const [leaveResponse, outingResponse] = await Promise.all([
        applyFilters(supabase.from('leave_requests').select(baseSelect)),
        applyFilters(supabase.from('outing_requests').select(baseSelect)),
      ]);

      if (leaveResponse.error || outingResponse.error) {
        console.error('Failed to load requests:', leaveResponse.error || outingResponse.error);
        toast({
          title: 'Unable to load requests',
          description: 'Please check your connection and try again.',
        });
        return;
      }

      const leaveRows = (leaveResponse.data || []).map((row) => buildRequestSummary(row, 'leave'));
      const outingRows = (outingResponse.data || []).map((row) => buildRequestSummary(row, 'outing'));
      const combined = [...leaveRows, ...outingRows].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setRequests(combined);
    } finally {
      setLoadingRequests(false);
    }
  }, [buildRequestSummary, loadStudentEmails, profile, staffRole]);

  const loadStudentProfile = useCallback(async (request: RequestSummary) => {
    const { data, error } = await supabase
      .from('user_profile_view')
      .select('*')
      .eq('email', request.studentEmail)
      .maybeSingle();

    if (error) {
      console.error('Unable to load student details:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      fullName: data.full_name || request.studentName,
      registerNumber: data.register_number,
      department: data.department,
      yearOfStudy: data.year_of_study || data.year,
      hostelBlock: data.hostel_block,
      roomNumber: data.room_number,
      institute: data.institute,
      mobileNumber: data.mobile_number,
      parentMobile: data.parent_mobile,
    } satisfies StudentProfileSnapshot;
  }, []);

  const loadApprovalHistory = useCallback(async (request: RequestSummary) => {
    const { data, error } = await supabase
      .from('pass_request_approvals')
      .select('id, approver_role, status, reason, approver_name, created_at')
      .eq('request_id', request.id)
      .eq('request_type', request.requestType)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Unable to load approval history:', error);
      return [] as ApprovalEntry[];
    }

    return (data || []).map((entry) => ({
      id: entry.id,
      role: entry.approver_role,
      status: entry.status,
      reason: entry.reason,
      approverName: entry.approver_name,
      createdAt: entry.created_at,
    }));
  }, []);

  const loadRequestDetails = useCallback(
    async (summary: RequestSummary) => {
      const baseSelect =
        'id, student_email, student_name, mentor_email, destination, reason, status, current_approver, approval_chain, created_at, departure_date, return_date, departure_datetime, return_datetime, rejection_reason, mentor_status, advisor_status, hod_status';
      const table = summary.requestType === 'leave' ? 'leave_requests' : 'outing_requests';
      const { data, error } = await supabase.from(table).select(baseSelect).eq('id', summary.id).maybeSingle();

      if (error || !data) {
        console.error('Unable to load request details:', error);
        return;
      }

      const details = buildRequestSummary(data, summary.requestType);
      setSelectedRequest(details);
      setRemarks('');

      const [studentProfile, history] = await Promise.all([
        loadStudentProfile(details),
        loadApprovalHistory(details),
      ]);

      setSelectedStudent(studentProfile);
      setApprovalHistory(history.length > 0 ? history : buildFallbackHistory(details));
    },
    [buildRequestSummary, loadApprovalHistory, loadStudentProfile],
  );

  const loadNotifications = useCallback(async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, is_read, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Unable to load notifications:', error);
      return;
    }
    setNotifications((data || []) as NotificationRow[]);
  }, [profile?.id]);

  const loadStudents = useCallback(async () => {
    if (!profile || !staffRole) return;
    const { data, error } = await queryAssignedStudents(staffRole, profile.id, profile.email);

    if (error) {
      console.error('Unable to load students:', error);
      return;
    }

    const mapped = (data || []).map((row: any) => ({
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      register_number: row.register_number,
      department: row.department,
      year: row.year_of_study || row.year || null,
      hostel_block: row.hostel_block,
      room_number: row.room_number,
      mobile_number: row.mobile_number,
    }));

    setStudents(mapped as StudentRow[]);
  }, [profile, queryAssignedStudents, staffRole]);

  const insertApprovalHistory = useCallback(
    async (request: RequestSummary, status: ApprovalStatus, reason?: string) => {
      if (!profile || !staffRole) return;
      const { error } = await supabase.from('pass_request_approvals').insert({
        request_id: request.id,
        request_type: request.requestType,
        approver_id: profile.id,
        approver_email: profile.email,
        approver_name: profile.full_name,
        approver_role: staffRole,
        status,
        reason: reason || null,
      });

      if (error) {
        console.error('Unable to log approval history:', error);
      }
    },
    [profile, staffRole],
  );

  const getRoleStatusColumn = (role: StaffRole) => {
    if (role === 'mentor') return 'mentor_status';
    if (role === 'advisor') return 'advisor_status';
    return 'hod_status';
  };

  const handleApprove = useCallback(async () => {
    if (!selectedRequest || !profile || !staffRole) return;
    setActionLoading(true);

    const chain = normalizeApprovalChain(selectedRequest.approvalChain);
    const currentRoleIndex = chain.indexOf(staffRole);
    const nextRole = currentRoleIndex >= 0 ? chain[currentRoleIndex + 1] : undefined;
    const table = selectedRequest.requestType === 'leave' ? 'leave_requests' : 'outing_requests';
    const statusColumn = getRoleStatusColumn(staffRole);

    const updates: Record<string, any> = {
      status: nextRole ? 'pending' : 'approved',
      current_approver: nextRole || 'completed',
      updated_at: new Date().toISOString(),
      approved_by: profile.email,
      rejection_reason: null,
      rejected_by: null,
      [statusColumn]: 'approved',
    };

    const normalizedChain = normalizeApprovalChain(selectedRequest.approvalChain);
    if (normalizedChain.join(',') !== selectedRequest.approvalChain.join(',')) {
      updates.approval_chain = normalizedChain;
    }

    const { error } = await supabase.from(table).update(updates).eq('id', selectedRequest.id);
    if (error) {
      console.error('Unable to approve request:', error);
      toast({ title: 'Approval failed', description: error.message || 'Please try again.' });
      setActionLoading(false);
      return;
    }

    await insertApprovalHistory(selectedRequest, 'approved', remarks.trim() || undefined);
    toast({ title: 'Request approved', description: 'Approval recorded successfully.' });
    setRemarks('');
    await loadRequests();
    await loadRequestDetails(selectedRequest);
    setActionLoading(false);
  }, [insertApprovalHistory, loadRequestDetails, loadRequests, profile, remarks, selectedRequest, selectedStudent, staffRole]);

  const handleReject = useCallback(async () => {
    if (!selectedRequest || !profile || !staffRole) return;
    if (!remarks.trim()) {
      toast({ title: 'Remarks required', description: 'Please add remarks before rejecting.' });
      return;
    }

    setActionLoading(true);
    const table = selectedRequest.requestType === 'leave' ? 'leave_requests' : 'outing_requests';
    const statusColumn = getRoleStatusColumn(staffRole);

    const updates: Record<string, any> = {
      status: 'rejected',
      current_approver: staffRole,
      rejection_reason: remarks.trim(),
      rejected_by: profile.email,
      updated_at: new Date().toISOString(),
      [statusColumn]: 'rejected',
    };

    const { error } = await supabase.from(table).update(updates).eq('id', selectedRequest.id);
    if (error) {
      console.error('Unable to reject request:', error);
      toast({ title: 'Rejection failed', description: error.message || 'Please try again.' });
      setActionLoading(false);
      return;
    }

    await insertApprovalHistory(selectedRequest, 'rejected', remarks.trim());
    toast({ title: 'Request rejected', description: 'Rejection recorded successfully.' });
    setRemarks('');
    await loadRequests();
    await loadRequestDetails(selectedRequest);
    setActionLoading(false);
  }, [insertApprovalHistory, loadRequestDetails, loadRequests, profile, remarks, selectedRequest, staffRole]);

  const handleReconsider = useCallback(async () => {
    if (!selectedRequest || !profile || !staffRole) return;
    setActionLoading(true);
    const table = selectedRequest.requestType === 'leave' ? 'leave_requests' : 'outing_requests';
    const statusColumn = getRoleStatusColumn(staffRole);
    const updates: Record<string, any> = {
      status: 'pending',
      current_approver: staffRole,
      rejection_reason: null,
      rejected_by: null,
      updated_at: new Date().toISOString(),
      [statusColumn]: 'pending',
    };

    const { error } = await supabase.from(table).update(updates).eq('id', selectedRequest.id);
    if (error) {
      console.error('Unable to reset request:', error);
      toast({ title: 'Unable to reopen', description: error.message || 'Please try again.' });
      setActionLoading(false);
      return;
    }

    await insertApprovalHistory(selectedRequest, 'reconsidered', 'Reopened for review');
    toast({ title: 'Request reopened', description: 'You can now approve or reject.' });
    await loadRequests();
    await loadRequestDetails(selectedRequest);
    setActionLoading(false);
  }, [insertApprovalHistory, loadRequestDetails, loadRequests, profile, selectedRequest, staffRole]);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [navigate, signOut]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile || !staffRole) {
      navigate('/');
      return;
    }
    void loadRequests();
  }, [authLoading, loadRequests, navigate, profile, staffRole]);

  useEffect(() => {
    if (requests.length === 0) {
      setSelectedRequestSummary(null);
      return;
    }
    if (!selectedRequestSummary || !requests.some((request) => request.id === selectedRequestSummary.id)) {
      setSelectedRequestSummary(requests[0]);
    }
  }, [requests, selectedRequestSummary]);

  useEffect(() => {
    if (!selectedRequestSummary) {
      setSelectedRequest(null);
      setSelectedStudent(null);
      setApprovalHistory([]);
      return;
    }
    void loadRequestDetails(selectedRequestSummary);
  }, [loadRequestDetails, selectedRequestSummary]);

  useEffect(() => {
    if (activeTab === 'inbox') {
      void loadNotifications();
    }
    if (activeTab === 'students') {
      void loadStudents();
    }
  }, [activeTab, loadNotifications, loadStudents]);

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === 'pending').length,
    [requests],
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  );

  if (authLoading) {
    return null;
  }

  const canAct = Boolean(
    selectedRequest && staffRole && selectedRequest.currentApprover === staffRole && selectedRequest.status !== 'approved',
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'requests':
        return (
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            <RequestList
              requests={requests}
              selectedId={selectedRequestSummary?.id || null}
              title={`${titleCase(staffRole || 'staff')} Requests`}
              loading={loadingRequests}
              onSelect={setSelectedRequestSummary}
            />
            <RequestDetails
              request={selectedRequest}
              student={selectedStudent}
              approvalHistory={approvalHistory}
              remarks={remarks}
              onRemarksChange={setRemarks}
              onApprove={handleApprove}
              onReject={handleReject}
              onReconsider={handleReconsider}
              canAct={canAct}
              actionLoading={actionLoading}
            />
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
            {notifications.length === 0 ? (
              <div className="text-sm text-gray-500">No notifications yet.</div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`rounded-lg p-5 border ${
                      notif.is_read ? 'border-gray-200 bg-white' : 'border-[#CD0000] bg-red-50'
                    } shadow-sm hover:shadow-md transition-all flex gap-4`}
                  >
                    <div
                      className={`mt-1 rounded-full p-2 h-max ${
                        notif.is_read ? 'bg-gray-100 text-gray-500' : 'bg-[#CD0000]/10 text-[#CD0000]'
                      }`}
                    >
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-bold ${notif.is_read ? 'text-gray-800' : 'text-gray-900'} text-base`}>
                          {notif.title}
                        </h4>
                        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap ml-2">
                          {formatDateTimeLabel(notif.created_at)}
                        </span>
                      </div>
                      <p className={`text-sm ${notif.is_read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                        {notif.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            {students.length === 0 ? (
              <div className="text-sm text-gray-500">No students assigned yet.</div>
            ) : (
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.id} className="rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{student.full_name || 'Student'}</h3>
                        <p className="text-sm text-gray-600 font-medium">{student.register_number || '-'}</p>
                        <p className="text-sm text-gray-600">
                          {student.department || '-'} - Year {student.year || '-'}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-600">
                          <span className="font-semibold">Block:</span> {student.hostel_block || '-'}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-semibold">Room:</span> {student.room_number || '-'}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-semibold">Mobile:</span> {student.mobile_number || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  <span className="font-semibold text-gray-900">{profile?.full_name || '-'}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Role</span>
                  <span className="font-semibold text-gray-900">{titleCase(profile?.role || '') || '-'}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Department</span>
                  <span className="font-semibold text-gray-900">{profile?.department || '-'}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Employee ID</span>
                  <span className="font-semibold text-gray-900">{profile?.id ? profile.id.slice(0, 8) : '-'}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Email</span>
                  <span className="font-semibold text-gray-900">{profile?.email || '-'}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Mobile</span>
                  <span className="font-semibold text-gray-900">{profile?.mobile_number || '-'}</span>
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
              activeTab === 'requests' ? 'bg-[#CD0000] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5" /> Requests
            {pendingCount > 0 && (
              <span className="ml-auto bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'inbox' ? 'bg-[#CD0000] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Inbox className="w-5 h-5" /> Inbox
            {unreadNotifications > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {unreadNotifications}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'students' ? 'bg-[#CD0000] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" /> My Students
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'profile' ? 'bg-[#CD0000] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
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

      <main className="flex-1 h-screen overflow-y-auto">
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
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            <div
              className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => setActiveTab('profile')}
            >
              <div className="w-8 h-8 rounded-full bg-[#CD0000] flex items-center justify-center text-white font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-bold text-gray-900 leading-tight">{displayName}</p>
                <p className="text-gray-600 text-xs leading-tight">{titleCase(staffRole || 'staff')}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 h-[calc(100vh-80px)]">{renderContent()}</div>
      </main>
    </div>
  );
}
