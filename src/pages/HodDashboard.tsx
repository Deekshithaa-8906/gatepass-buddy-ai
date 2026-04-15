import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle,
  FileText,
  GraduationCap,
  Inbox,
  LogOut,
  Mail,
  MapPin,
  Plane,
  User,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

type RequestType = 'leave' | 'outing';
type RequestStatus = 'pending' | 'approved' | 'rejected';
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'reconsidered';

interface RequestSummary {
  id: string;
  requestType: RequestType;
  studentName: string;
  studentEmail: string;
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
  mentorStatus?: string | null;
  advisorStatus?: string | null;
  hodStatus?: string | null;
  rejectionReason?: string | null;
}

interface StudentProfileSnapshot {
  fullName: string;
  registerNumber?: string | null;
  department?: string | null;
  yearOfStudy?: string | null;
  classDetails?: string | null;
  hostelBlock?: string | null;
  roomNumber?: string | null;
  institute?: string | null;
}

interface ApprovalEntry {
  id: string;
  role: string;
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

const TIMELINE_STEPS = ['SUBMITTED', 'MENTOR', 'ADVISOR', 'HOD', 'WARDEN'] as const;

const titleCase = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

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

const formatDateTimeLabel = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getStatusBadgeClass = (status: RequestStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'approved':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getTimelineStage = (currentApprover?: string | null) => {
  switch ((currentApprover || '').toLowerCase()) {
    case 'mentor':
      return 'MENTOR';
    case 'advisor':
      return 'ADVISOR';
    case 'hod':
      return 'HOD';
    case 'warden':
      return 'WARDEN';
    default:
      return 'SUBMITTED';
  }
};

const buildFallbackHistory = (request: RequestSummary): ApprovalEntry[] => {
  const entries: ApprovalEntry[] = [];
  const pushEntry = (role: string, status?: string | null) => {
    const normalized = normalizeApprovalStatus(status);
    if (!normalized || normalized === 'pending') return;
    entries.push({
      id: `${request.id}-${role}`,
      role,
      status: normalized,
      reason: null,
      createdAt: request.createdAt,
    });
  };

  pushEntry('mentor', request.mentorStatus);
  pushEntry('advisor', request.advisorStatus);

  if (request.status === 'rejected') {
    entries.push({
      id: `${request.id}-hod`,
      role: 'hod',
      status: 'rejected',
      reason: request.rejectionReason,
      createdAt: request.createdAt,
    });
  }

  return entries;
};

const RequestItem = ({
  request,
  student,
  active,
  onSelect,
}: {
  request: RequestSummary;
  student?: StudentProfileSnapshot | null;
  active: boolean;
  onSelect: () => void;
}) => (
  <div
    onClick={onSelect}
    className={`p-4 rounded-lg cursor-pointer transition-all border ${
      active ? 'border-[#CD0000] bg-red-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
    }`}
  >
    <div className="mb-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-bold text-gray-900 text-sm">{request.studentName}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${getStatusBadgeClass(request.status)}`}>
          {request.status.toUpperCase()}
        </span>
      </div>
      <p className="text-xs text-gray-600 font-medium">
        {student?.department || '-'} • {student?.yearOfStudy || '-'} Year
      </p>
    </div>

    <p className="text-xs font-semibold text-gray-700 mb-1">{titleCase(request.requestType)} Request</p>
    <p className="text-xs text-gray-600 line-clamp-2 mb-3">{request.reason}</p>

    <div className="flex items-center gap-3 mb-2">
      <div className="flex items-center gap-1 text-xs text-green-600">
        <Check className="w-3 h-3" /> Mentor
      </div>
      <div className="flex items-center gap-1 text-xs text-green-600">
        <Check className="w-3 h-3" /> Advisor
      </div>
    </div>

    <p className="text-xs text-gray-500">Submitted: {formatDateTimeLabel(request.createdAt)}</p>
  </div>
);

const RequestList = ({
  requests,
  selectedId,
  studentDirectory,
  loading,
  onSelect,
}: {
  requests: RequestSummary[];
  selectedId: string | null;
  studentDirectory: Record<string, StudentProfileSnapshot>;
  loading: boolean;
  onSelect: (request: RequestSummary) => void;
}) => (
  <div className="lg:w-[30%] bg-white rounded-xl shadow-sm border p-6 overflow-y-auto max-h-[calc(100vh-180px)]">
    <h2 className="text-lg font-bold text-gray-900 mb-4">HOD Approval Queue</h2>
    {loading ? (
      <div className="text-sm text-gray-500">Loading requests...</div>
    ) : requests.length === 0 ? (
      <div className="text-sm text-gray-500">No requests ready for HOD review.</div>
    ) : (
      <div className="space-y-3">
        {requests.map((request) => (
          <RequestItem
            key={`${request.requestType}-${request.id}`}
            request={request}
            student={studentDirectory[request.studentEmail]}
            active={selectedId === request.id}
            onSelect={() => onSelect(request)}
          />
        ))}
      </div>
    )}
  </div>
);

const ApprovalHistory = ({ history }: { history: ApprovalEntry[] }) => (
  <div className="space-y-3">
    {history.map((log) => (
      <div key={log.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <CheckCircle className="w-4 h-4" /> {titleCase(log.role)} Approval
          </div>
          <span className="text-xs text-gray-500">{formatDateTimeLabel(log.createdAt)}</span>
        </div>
        {log.approverName && <p className="text-xs text-gray-600 mb-1">Name: {log.approverName}</p>}
        <p className="text-xs text-gray-600">Remark: {log.reason || 'No remarks provided.'}</p>
      </div>
    ))}
  </div>
);

const Timeline = ({
  currentStage,
  rejected,
  approverNames,
}: {
  currentStage: typeof TIMELINE_STEPS[number];
  rejected: boolean;
  approverNames: Record<string, string | undefined>;
}) => (
  <div className="flex items-center justify-between">
    {TIMELINE_STEPS.map((stage, index) => {
      const currentIndex = TIMELINE_STEPS.indexOf(currentStage);
      const isActive = stage === currentStage;
      const isComplete = index < currentIndex;
      const stageClass = rejected && stage === 'HOD'
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
              {isComplete ? <CheckCircle className="w-5 h-5" /> : <div className="w-3 h-3 bg-white/80 rounded-full" />}
            </div>
            <span className="text-xs font-semibold text-gray-700 mt-2">{stage}</span>
            {approverNames[stage] && (
              <span className="text-[10px] text-gray-500 mt-1">{approverNames[stage]}</span>
            )}
          </div>
          {index < TIMELINE_STEPS.length - 1 && (
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
  actionLoading,
}: {
  status: RequestStatus;
  remarks: string;
  onRemarksChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onReconsider: () => void;
  actionLoading: boolean;
}) => {
  if (status === 'rejected') {
    return (
      <button
        onClick={onReconsider}
        className="w-full px-6 py-3 bg-[#CD0000] text-white rounded-lg font-bold transition-all hover:bg-[#a80000] active:scale-95 shadow-md"
        disabled={actionLoading}
      >
        {actionLoading ? 'Updating...' : 'Review & Approve'}
      </button>
    );
  }

  if (status === 'approved') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
        <p className="text-sm font-bold text-green-800">Request Approved & Forwarded to Warden</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">HOD Decision</h3>
      <textarea
        value={remarks}
        onChange={(e) => onRemarksChange(e.target.value)}
        placeholder="Enter your remarks here (optional for approval, required for rejection)..."
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
          {actionLoading ? 'Saving...' : 'Approve & Forward to Warden'}
        </button>
      </div>
    </div>
  );
};

export default function HodDashboard() {
  const navigate = useNavigate();
  const { profile, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [selectedRequestSummary, setSelectedRequestSummary] = useState<RequestSummary | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestSummary | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfileSnapshot | null>(null);
  const [studentDirectory, setStudentDirectory] = useState<Record<string, StudentProfileSnapshot>>({});
  const [approvalHistory, setApprovalHistory] = useState<ApprovalEntry[]>([]);
  const [remarks, setRemarks] = useState('');
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  const displayName = profile?.full_name || profile?.email || 'HOD';

  const loadAssignedStudents = useCallback(async () => {
    if (!profile) return { data: [], error: null } as { data: any[]; error: any };
    const selectQuery = (column: string, value: string) =>
      supabase
        .from('user_profile_view')
        .select('*')
        .eq('role', 'student')
        .eq(column, value)
        .order('full_name', { ascending: true });

    const idResponse = profile.id ? await selectQuery('hod_id', profile.id) : { data: [], error: null };
    if (!idResponse.error || idResponse.error.code !== '42703') {
      return idResponse;
    }

    if (profile.email) {
      return selectQuery('hod_email', profile.email);
    }

    return { data: [], error: null } as { data: any[]; error: any };
  }, [profile]);

  const buildRequestSummary = useCallback((row: any, requestType: RequestType): RequestSummary => {
    return {
      id: row.id,
      requestType,
      studentName: row.student_name,
      studentEmail: row.student_email,
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
      mentorStatus: row.mentor_status ?? null,
      advisorStatus: row.advisor_status ?? null,
      hodStatus: row.hod_status ?? null,
      rejectionReason: row.rejection_reason ?? null,
    };
  }, []);

  const loadRequests = useCallback(async () => {
    if (!profile || profile.role !== 'hod') return;
    setLoadingRequests(true);

    try {
      const studentResponse = await loadAssignedStudents();
      if (studentResponse.error) {
        console.error('Unable to load students:', studentResponse.error);
      }

      const students = (studentResponse.data || []) as any[];
      const studentEmailList = students.map((row) => row.email).filter(Boolean);

      const map: Record<string, StudentProfileSnapshot> = {};
      students.forEach((row) => {
        if (!row.email) return;
        map[row.email] = {
          fullName: row.full_name || row.email,
          registerNumber: row.register_number,
          department: row.department,
          yearOfStudy: row.year_of_study || row.year,
          classDetails: row.class_details,
          hostelBlock: row.hostel_block,
          roomNumber: row.room_number,
          institute: row.institute,
        };
      });
      setStudentDirectory(map);

      const baseSelect =
        'id, student_email, student_name, destination, reason, status, current_approver, approval_chain, created_at, departure_date, return_date, departure_datetime, return_datetime, mentor_status, advisor_status, hod_status, rejection_reason';

      const fetchRequests = async (includeApprovalFilters: boolean) => {
        const applyFilters = (query: any) => {
          let nextQuery = query.eq('current_approver', 'hod').in('status', ['pending', 'rejected']);
          if (includeApprovalFilters) {
            nextQuery = nextQuery.eq('mentor_status', 'approved').eq('advisor_status', 'approved');
          }
          if (studentEmailList.length > 0) {
            nextQuery = nextQuery.in('student_email', studentEmailList);
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
          const error = leaveResponse.error || outingResponse.error;
          if (includeApprovalFilters && error?.code === '42703') {
            return fetchRequests(false);
          }
          throw error;
        }

        const leaveRows = (leaveResponse.data || []).map((row) => buildRequestSummary(row, 'leave'));
        const outingRows = (outingResponse.data || []).map((row) => buildRequestSummary(row, 'outing'));
        return [...leaveRows, ...outingRows].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      };

      const combined = await fetchRequests(true);
      setRequests(combined);
    } catch (error: any) {
      console.error('Failed to load HOD requests:', error);
      toast({
        title: 'Unable to load requests',
        description: error?.message || 'Please check your connection and try again.',
      });
    } finally {
      setLoadingRequests(false);
    }
  }, [buildRequestSummary, loadAssignedStudents, profile]);

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
      fullName: data.full_name || request.studentName,
      registerNumber: data.register_number,
      department: data.department,
      yearOfStudy: data.year_of_study || data.year,
      classDetails: data.class_details,
      hostelBlock: data.hostel_block,
      roomNumber: data.room_number,
      institute: data.institute,
    } satisfies StudentProfileSnapshot;
  }, []);

  const loadRequestDetails = useCallback(async (summary: RequestSummary) => {
    const baseSelect =
      'id, student_email, student_name, destination, reason, status, current_approver, approval_chain, created_at, departure_date, return_date, departure_datetime, return_datetime, mentor_status, advisor_status, hod_status, rejection_reason';
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
  }, [buildRequestSummary, loadApprovalHistory, loadStudentProfile]);

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

  const insertApprovalHistory = useCallback(
    async (request: RequestSummary, status: ApprovalStatus, reason?: string) => {
      if (!profile) return;
      const { error } = await supabase.from('pass_request_approvals').insert({
        request_id: request.id,
        request_type: request.requestType,
        approver_id: profile.id,
        approver_email: profile.email,
        approver_name: profile.full_name,
        approver_role: 'hod',
        status,
        reason: reason || null,
      });

      if (error) {
        console.error('Unable to log approval history:', error);
      }
    },
    [profile],
  );

  const handleApprove = useCallback(async () => {
    if (!selectedRequest || !profile) return;
    setActionLoading(true);

    const table = selectedRequest.requestType === 'leave' ? 'leave_requests' : 'outing_requests';
    const updates: Record<string, any> = {
      status: 'pending',
      current_approver: 'warden',
      hod_status: 'approved',
      approved_by: profile.email,
      rejection_reason: null,
      rejected_by: null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from(table).update(updates).eq('id', selectedRequest.id);
    if (error) {
      console.error('Unable to approve request:', error);
      toast({ title: 'Approval failed', description: error.message || 'Please try again.' });
      setActionLoading(false);
      return;
    }

    await insertApprovalHistory(selectedRequest, 'approved', remarks.trim() || undefined);
    toast({ title: 'Request approved', description: 'Forwarded to warden successfully.' });
    setRemarks('');
    await loadRequests();
    await loadRequestDetails(selectedRequest);
    setActionLoading(false);
  }, [insertApprovalHistory, loadRequestDetails, loadRequests, profile, remarks, selectedRequest]);

  const handleReject = useCallback(async () => {
    if (!selectedRequest || !profile) return;
    if (!remarks.trim()) {
      toast({ title: 'Remarks required', description: 'Please add remarks before rejecting.' });
      return;
    }

    setActionLoading(true);
    const table = selectedRequest.requestType === 'leave' ? 'leave_requests' : 'outing_requests';
    const updates: Record<string, any> = {
      status: 'rejected',
      current_approver: 'hod',
      hod_status: 'rejected',
      rejection_reason: remarks.trim(),
      rejected_by: profile.email,
      updated_at: new Date().toISOString(),
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
  }, [insertApprovalHistory, loadRequestDetails, loadRequests, profile, remarks, selectedRequest]);

  const handleReconsider = useCallback(async () => {
    if (!selectedRequest || !profile) return;
    setActionLoading(true);
    const table = selectedRequest.requestType === 'leave' ? 'leave_requests' : 'outing_requests';
    const updates: Record<string, any> = {
      status: 'pending',
      current_approver: 'hod',
      hod_status: 'pending',
      rejection_reason: null,
      rejected_by: null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from(table).update(updates).eq('id', selectedRequest.id);
    if (error) {
      console.error('Unable to reopen request:', error);
      toast({ title: 'Unable to reopen', description: error.message || 'Please try again.' });
      setActionLoading(false);
      return;
    }

    await insertApprovalHistory(selectedRequest, 'reconsidered', 'Reopened for review');
    toast({ title: 'Request reopened', description: 'You can now approve or reject.' });
    await loadRequests();
    await loadRequestDetails(selectedRequest);
    setActionLoading(false);
  }, [insertApprovalHistory, loadRequestDetails, loadRequests, profile, selectedRequest]);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [navigate, signOut]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'hod') {
      navigate('/');
      return;
    }
    void loadRequests();
  }, [authLoading, loadRequests, navigate, profile]);

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
  }, [activeTab, loadNotifications]);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  );

  if (authLoading) return null;

  const studentMeta = selectedStudent || (selectedRequest ? studentDirectory[selectedRequest.studentEmail] : null);
  const history = approvalHistory.filter((entry) => ['mentor', 'advisor'].includes(entry.role));
  const currentStage = getTimelineStage(selectedRequest?.currentApprover);
  const approverNames: Record<string, string | undefined> = {
    SUBMITTED: selectedRequest?.studentName,
    MENTOR: approvalHistory.find((entry) => entry.role === 'mentor')?.approverName,
    ADVISOR: approvalHistory.find((entry) => entry.role === 'advisor')?.approverName,
    HOD: profile?.full_name || profile?.email,
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'requests':
        return (
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            <RequestList
              requests={requests}
              selectedId={selectedRequestSummary?.id || null}
              studentDirectory={studentDirectory}
              loading={loadingRequests}
              onSelect={setSelectedRequestSummary}
            />
            <div className="lg:w-[70%] bg-white rounded-xl shadow-sm border p-8 overflow-y-auto max-h-[calc(100vh-180px)]">
              {selectedRequest ? (
                <div className="space-y-6">
                  <div className="flex items-start justify-between pb-4 border-b">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{titleCase(selectedRequest.requestType)} Request</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-semibold">Ref ID: {selectedRequest.id}</span>
                        <span>•</span>
                        <span>Applied {formatDateTimeLabel(selectedRequest.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Student Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Name</label>
                        <p className="text-sm text-gray-900 font-semibold">{studentMeta?.fullName || selectedRequest.studentName}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Department</label>
                        <p className="text-sm text-gray-900 font-semibold">{studentMeta?.department || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Year & Section</label>
                        <p className="text-sm text-gray-900 font-semibold">
                          {studentMeta?.yearOfStudy || '-'} Year {studentMeta?.classDetails ? `- ${studentMeta.classDetails}` : ''}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Room/Block</label>
                        <p className="text-sm text-gray-900 font-semibold">{studentMeta?.roomNumber || '-'} / {studentMeta?.hostelBlock || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Campus</label>
                        <p className="text-sm text-gray-900 font-semibold">{studentMeta?.institute || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold block mb-1">Register No</label>
                        <p className="text-sm text-gray-900 font-semibold">{studentMeta?.registerNumber || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">{titleCase(selectedRequest.requestType)} Details</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Plane className="w-4 h-4 text-gray-600" />
                          <label className="text-xs text-gray-600 font-semibold">Departure</label>
                        </div>
                        <p className="text-sm text-gray-900 font-bold">
                          {selectedRequest.requestType === 'leave' ? formatDate(selectedRequest.departureDate) : formatDate(selectedRequest.departureDateTime)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {selectedRequest.requestType === 'leave' ? '-' : formatTime(selectedRequest.departureDateTime)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Plane className="w-4 h-4 text-gray-600 transform rotate-180" />
                          <label className="text-xs text-gray-600 font-semibold">Return</label>
                        </div>
                        <p className="text-sm text-gray-900 font-bold">
                          {selectedRequest.requestType === 'leave' ? formatDate(selectedRequest.returnDate) : formatDate(selectedRequest.returnDateTime)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {selectedRequest.requestType === 'leave' ? '-' : formatTime(selectedRequest.returnDateTime)}
                        </p>
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

                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Reason</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-800 leading-relaxed">{selectedRequest.reason}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Approval History</h3>
                    {history.length === 0 ? <p className="text-sm text-gray-500">No history yet.</p> : <ApprovalHistory history={history} />}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Approval Timeline</h3>
                    <Timeline currentStage={currentStage} rejected={selectedRequest.status === 'rejected'} approverNames={approverNames} />
                  </div>

                  {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <h3 className="text-sm font-bold text-red-800">Rejected by HOD</h3>
                      </div>
                      <p className="text-sm text-red-700"><span className="font-semibold">Reason:</span> {selectedRequest.rejectionReason}</p>
                    </div>
                  )}

                  <ActionSection
                    status={selectedRequest.status}
                    remarks={remarks}
                    onRemarksChange={setRemarks}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onReconsider={handleReconsider}
                    actionLoading={actionLoading}
                  />
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
            {notifications.length === 0 ? (
              <div className="text-sm text-gray-500">No notifications yet.</div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`rounded-lg p-5 border ${notif.is_read ? 'border-gray-200 bg-white' : 'border-[#CD0000] bg-red-50'} shadow-sm hover:shadow-md transition-all flex gap-4`}>
                    <div className={`mt-1 rounded-full p-2 h-max ${notif.is_read ? 'bg-gray-100 text-gray-500' : 'bg-[#CD0000]/10 text-[#CD0000]'}`}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-bold ${notif.is_read ? 'text-gray-800' : 'text-gray-900'} text-base`}>{notif.title}</h4>
                        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap ml-2">{formatDateTimeLabel(notif.created_at)}</span>
                      </div>
                      <p className={`text-sm ${notif.is_read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{notif.message}</p>
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
                  <span className="font-semibold text-gray-900">Head of Department (HOD)</span>
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
            {activeTab === 'requests' ? 'HOD Approval Requests' : activeTab}
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
                <p className="text-gray-600 text-xs leading-tight">HOD</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 h-[calc(100vh-80px)]">{renderContent()}</div>
      </main>
    </div>
  );
}
