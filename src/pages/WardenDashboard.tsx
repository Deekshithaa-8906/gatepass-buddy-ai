import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, GraduationCap, Inbox, LogOut, User, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { RequestDetailsModal } from '@/components/common/RequestDetailsModal';
import { ProgressStep } from '@/components/common/ProgressTracker';

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
  parentMobile?: string | null;
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
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'approved':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getTimelineStage = (request: RequestSummary | null) => {
  if (!request) return 'SUBMITTED';
  if (request.status === 'approved') return 'WARDEN';
  switch ((request.currentApprover || '').toLowerCase()) {
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
  pushEntry('hod', request.hodStatus);

  if (request.status === 'rejected') {
    entries.push({
      id: `${request.id}-warden`,
      role: 'warden',
      status: 'rejected',
      reason: request.rejectionReason,
      createdAt: request.createdAt,
    });
  }

  return entries;
};

export function WardenDashboard() {
  const navigate = useNavigate();
  const { profile, loading: authLoading, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<'requests' | 'inbox' | 'profile'>('requests');
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [studentDirectory, setStudentDirectory] = useState<Record<string, StudentProfileSnapshot>>({});
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestSummary | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalEntry[]>([]);
  const [remarks, setRemarks] = useState('');
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const displayName = profile?.full_name || profile?.email || 'Warden';

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
    if (!profile || profile.role !== 'warden') return;
    setLoadingRequests(true);
    try {
      const baseSelect =
        'id, student_email, student_name, destination, reason, status, current_approver, approval_chain, created_at, departure_date, return_date, departure_datetime, return_datetime, mentor_status, advisor_status, hod_status, rejection_reason';
      const applyFilters = (query: any) =>
        query.eq('current_approver', 'warden').in('status', ['pending', 'rejected']);

      const [leaveResponse, outingResponse] = await Promise.all([
        applyFilters(supabase.from('leave_requests').select(baseSelect)),
        applyFilters(supabase.from('outing_requests').select(baseSelect)),
      ]);

      if (leaveResponse.error || outingResponse.error) {
        throw leaveResponse.error || outingResponse.error;
      }

      const leaveRows = (leaveResponse.data || []).map((row) => buildRequestSummary(row, 'leave'));
      const outingRows = (outingResponse.data || []).map((row) => buildRequestSummary(row, 'outing'));
      const combined = [...leaveRows, ...outingRows].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setRequests(combined);

      const studentEmails = Array.from(new Set(combined.map((request) => request.studentEmail)));
      if (studentEmails.length === 0) {
        setStudentDirectory({});
        return;
      }

      const { data: studentRows, error: studentError } = await supabase
        .from('user_profile_view')
        .select('*')
        .in('email', studentEmails);

      if (studentError) {
        console.error('Unable to load student profiles:', studentError);
        setStudentDirectory({});
        return;
      }

      const directory: Record<string, StudentProfileSnapshot> = {};
      (studentRows || []).forEach((row: any) => {
        if (!row.email) return;
        directory[row.email] = {
          fullName: row.full_name || row.email,
          registerNumber: row.register_number,
          department: row.department,
          yearOfStudy: row.year_of_study || row.year,
          classDetails: row.class_details,
          hostelBlock: row.hostel_block,
          roomNumber: row.room_number,
          institute: row.institute,
          parentMobile: row.parent_mobile,
        };
      });
      setStudentDirectory(directory);
    } catch (error: any) {
      console.error('Unable to load warden requests:', error);
      toast({
        title: 'Unable to load requests',
        description: error?.message || 'Please check your connection and try again.',
      });
    } finally {
      setLoadingRequests(false);
    }
  }, [buildRequestSummary, profile]);

  const loadApprovalHistory = useCallback(async (request: RequestSummary) => {
    const { data, error } = await supabase
      .from('request_approvals')
      .select('id, approver_role, status, reason, created_at')
      .eq('request_id', request.id)
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
      approverName: null,
      createdAt: entry.created_at,
    }));
  }, []);

  const insertApprovalHistory = useCallback(
    async (request: RequestSummary, status: ApprovalStatus, reason?: string) => {
      if (!profile) return;
      const { error } = await supabase.from('request_approvals').insert({
        request_id: request.id,
        approver_id: profile.id,
        approver_role: 'warden',
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
      status: 'approved',
      current_approver: 'completed',
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
    toast({ title: 'Request approved', description: 'Final approval recorded successfully.' });
    setRemarks('');
    await loadRequests();
    setSelectedRequest(null);
    setApprovalHistory([]);
    setActionLoading(false);
  }, [insertApprovalHistory, loadRequests, profile, remarks, selectedRequest]);

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
      current_approver: 'warden',
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
    setActionLoading(false);
  }, [insertApprovalHistory, loadRequests, profile, remarks, selectedRequest]);

  const handleReconsider = useCallback(async () => {
    if (!selectedRequest || !profile) return;
    setActionLoading(true);
    const table = selectedRequest.requestType === 'leave' ? 'leave_requests' : 'outing_requests';
    const updates: Record<string, any> = {
      status: 'pending',
      current_approver: 'warden',
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
    setActionLoading(false);
  }, [insertApprovalHistory, loadRequests, profile, selectedRequest]);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [navigate, signOut]);

  const loadNotifications = useCallback(async () => {
    if (!profile?.id) return;
    setLoadingNotifications(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, is_read, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Unable to load notifications:', error);
      setLoadingNotifications(false);
      return;
    }
    setNotifications((data || []) as NotificationRow[]);
    setLoadingNotifications(false);
  }, [profile?.id]);

  const markNotificationRead = useCallback(
    async (notification: NotificationRow) => {
      if (notification.is_read) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
      if (error) {
        console.error('Unable to mark notification read:', error);
        return;
      }
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)),
      );
    },
    [],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'warden') {
      navigate('/');
      return;
    }
    void loadRequests();
  }, [authLoading, loadRequests, navigate, profile]);

  useEffect(() => {
    if (!profile?.id) return;
    void loadNotifications();
    const channel = supabase
      .channel('warden-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        () => {
          void loadNotifications();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadNotifications, profile?.id]);

  useEffect(() => {
    if (!selectedRequest) {
      setApprovalHistory([]);
      return;
    }
    void loadApprovalHistory(selectedRequest).then((history) => {
      setApprovalHistory(history.length > 0 ? history : buildFallbackHistory(selectedRequest));
    });
  }, [loadApprovalHistory, selectedRequest]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRequests = useMemo(() => {
    if (!normalizedSearch) return requests;
    return requests.filter((request) => {
      const student = studentDirectory[request.studentEmail];
      const haystack = [
        request.studentName,
        student?.fullName,
        student?.roomNumber,
        student?.registerNumber,
        student?.department,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [normalizedSearch, requests, studentDirectory]);

  const departments = useMemo(() => {
    const map = new Map<string, RequestSummary[]>();
    filteredRequests.forEach((request) => {
      const dept = studentDirectory[request.studentEmail]?.department || 'Unknown Department';
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)?.push(request);
    });
    return Array.from(map.entries()).map(([name, deptRequests]) => ({
      name,
      requests: deptRequests,
      pendingCount: deptRequests.filter((req) => req.status === 'pending').length,
    }));
  }, [filteredRequests, studentDirectory]);

  const students = useMemo(() => {
    if (!selectedDepartment) return [] as { email: string; profile: StudentProfileSnapshot; requests: RequestSummary[] }[];
    const departmentRequests = filteredRequests.filter((request) => {
      const dept = studentDirectory[request.studentEmail]?.department || 'Unknown Department';
      return dept === selectedDepartment;
    });
    const map = new Map<string, RequestSummary[]>();
    departmentRequests.forEach((request) => {
      if (!map.has(request.studentEmail)) map.set(request.studentEmail, []);
      map.get(request.studentEmail)?.push(request);
    });
    return Array.from(map.entries()).map(([email, studentRequests]) => ({
      email,
      profile: studentDirectory[email] || { fullName: requestFallbackName(studentRequests) },
      requests: studentRequests,
    }));
  }, [filteredRequests, selectedDepartment, studentDirectory]);

  const studentRequests = useMemo(() => {
    if (!selectedStudentEmail) return [] as RequestSummary[];
    return filteredRequests.filter((request) => request.studentEmail === selectedStudentEmail);
  }, [filteredRequests, selectedStudentEmail]);

  const currentLevel = selectedDepartment ? (selectedStudentEmail ? 'requests' : 'students') : 'departments';

  const handleDepartmentSelect = (department: string) => {
    setSelectedDepartment(department);
    setSelectedStudentEmail(null);
    setSelectedRequest(null);
  };

  const handleStudentSelect = (email: string) => {
    setSelectedStudentEmail(email);
    setSelectedRequest(null);
  };

  const handleRequestSelect = (request: RequestSummary) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const handleBreadcrumbReset = () => {
    setSelectedDepartment(null);
    setSelectedStudentEmail(null);
    setSelectedRequest(null);
  };

  const buildProgressSteps = (request: RequestSummary): ProgressStep[] => {
    const currentStage = getTimelineStage(request);
    const currentIndex = TIMELINE_STEPS.indexOf(currentStage);
    const approvedRoles = new Set(
      approvalHistory.filter((entry) => entry.status === 'approved').map((entry) => entry.role.toUpperCase()),
    );
    const labels: Record<typeof TIMELINE_STEPS[number], string> = {
      SUBMITTED: 'Submitted',
      MENTOR: 'Mentor',
      ADVISOR: 'Advisor',
      HOD: 'HOD',
      WARDEN: 'Warden',
    };

    return TIMELINE_STEPS.map((stage, index) => {
      let status: ProgressStep['status'] = 'pending';
      if (request.status === 'approved') {
        status = 'completed';
      } else if (approvedRoles.has(stage)) {
        status = 'completed';
      } else if (request.status === 'rejected' && stage === currentStage) {
        status = 'rejected';
      } else if (index < currentIndex) {
        status = 'completed';
      } else if (index === currentIndex) {
        status = 'current';
      }
      return { label: labels[stage], status };
    });
  };

  const selectedStudentMeta = selectedRequest
    ? studentDirectory[selectedRequest.studentEmail]
    : null;

  const requestType: 'Leave' | 'Outing' = selectedRequest?.requestType === 'leave' ? 'Leave' : 'Outing';
  const requestStatus: 'Pending' | 'Approved' | 'Rejected' =
    selectedRequest?.status === 'approved'
      ? 'Approved'
      : selectedRequest?.status === 'rejected'
      ? 'Rejected'
      : 'Pending';

  const modalRequest = selectedRequest
    ? {
        id: selectedRequest.id,
        type: requestType,
        status: requestStatus,
        departureDate:
          selectedRequest.requestType === 'leave'
            ? formatDate(selectedRequest.departureDate)
            : formatDate(selectedRequest.departureDateTime),
        departureTime:
          selectedRequest.requestType === 'leave'
            ? '-'
            : formatTime(selectedRequest.departureDateTime),
        returnDate:
          selectedRequest.requestType === 'leave'
            ? formatDate(selectedRequest.returnDate)
            : formatDate(selectedRequest.returnDateTime),
        returnTime:
          selectedRequest.requestType === 'leave'
            ? '-'
            : formatTime(selectedRequest.returnDateTime),
        duration: '-',
        destination: selectedRequest.destination,
        reason: selectedRequest.reason,
        date: formatDate(selectedRequest.createdAt),
        studentInfo: {
          name: selectedStudentMeta?.fullName || selectedRequest.studentName,
          department: selectedStudentMeta?.department || '-',
          roomNumber: `${selectedStudentMeta?.roomNumber || '-'}${
            selectedStudentMeta?.hostelBlock ? ` / ${selectedStudentMeta.hostelBlock}` : ''
          }`,
          campus: selectedStudentMeta?.institute || '-',
        },
        progressSteps: buildProgressSteps(selectedRequest),
      }
    : null;

  const renderDecisionContent = () => {
    if (!selectedRequest) return null;

    if (selectedRequest.status === 'rejected') {
      return (
        <button
          onClick={handleReconsider}
          className="w-full bg-[#CD0000] text-white py-3 rounded-xl font-bold shadow-sm hover:bg-[#a80000] transition-colors focus:ring-4 focus:ring-[#CD0000]/20 active:scale-95 text-sm"
          disabled={actionLoading}
        >
          {actionLoading ? 'Updating...' : 'Review & Approve'}
        </button>
      );
    }

    return (
      <div className="flex flex-col md:flex-row gap-4">
        <textarea
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          placeholder="Enter your remarks here (Required for Rejection)..."
          className="flex-1 p-4 bg-white border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 outline-none rounded-xl resize-none text-sm font-medium shadow-sm transition-all"
          rows={3}
        />
        <div className="flex flex-col gap-3 w-full md:w-40 justify-center">
          <button
            onClick={handleApprove}
            className="w-full bg-[#CD0000] text-white py-3 rounded-xl font-bold shadow-sm hover:bg-[#a80000] transition-colors focus:ring-4 focus:ring-[#CD0000]/20 active:scale-95 text-sm"
            disabled={actionLoading}
          >
            {actionLoading ? 'Saving...' : 'Approve Request'}
          </button>
          <button
            onClick={handleReject}
            className="w-full bg-white border border-[#CD0000] text-[#CD0000] py-3 rounded-xl font-bold hover:bg-red-50 text-sm transition-colors active:scale-95"
            disabled={actionLoading}
          >
            {actionLoading ? 'Saving...' : 'Reject Request'}
          </button>
        </div>
      </div>
    );
  };

  if (authLoading) return null;

  const headerTitle = activeSection === 'requests' ? 'Warden Requests' : activeSection === 'inbox' ? 'Inbox' : 'Profile';
  const headerSubtitle =
    activeSection === 'requests' ? 'Final Authorization Level' : activeSection === 'inbox' ? 'Updates for you' : 'Account details';

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm md:h-screen sticky top-0">
        <div className="p-6 border-b border-gray-200 flex items-center gap-3">
          <div className="bg-[#CD0000] p-2 rounded-lg shadow-sm">
            <Users className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900">PassN<span className="text-[#CD0000]">Track</span></span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <button
            onClick={() => {
              setActiveSection('requests');
              handleBreadcrumbReset();
            }}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              activeSection === 'requests'
                ? 'bg-[#CD0000] text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5" /> Requests
          </button>
          <button
            onClick={() => setActiveSection('inbox')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              activeSection === 'inbox'
                ? 'bg-[#CD0000]/10 text-[#CD0000]'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Inbox className="w-5 h-5" /> Inbox
          </button>
          <button
            onClick={() => setActiveSection('profile')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              activeSection === 'profile'
                ? 'bg-[#CD0000]/10 text-[#CD0000]'
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

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="px-8 py-5 flex justify-between items-center bg-white border-b border-gray-200 sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">{headerTitle}</h1>
            <p className="text-sm font-medium text-gray-600">{headerSubtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#CD0000] flex items-center justify-center text-white font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-bold text-gray-900 leading-tight">{displayName}</p>
                <p className="text-gray-600 text-xs leading-tight">Warden</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 h-[calc(100vh-80px)]">
          {activeSection === 'requests' ? (
            <>
              <div className="mb-4">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, room, department"
                  className="w-full"
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-y-auto max-h-[calc(100vh-170px)]">
                {loadingRequests ? (
                  <div className="text-sm font-medium text-gray-500">Loading requests...</div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-sm font-medium text-gray-500">No requests found.</div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {filteredRequests.map((request) => {
                      const student = studentDirectory[request.studentEmail];
                      return (
                        <button
                          key={request.id}
                          onClick={() => handleRequestSelect(request)}
                          className="w-full text-left rounded-xl border border-gray-100 p-5 shadow-sm hover:border-red-200 hover:shadow-md hover:bg-red-50/10 transition-all flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-4 w-full">
                            <div className="flex-1 min-w-0">
                              <p className="text-[15px] font-bold text-gray-900 truncate">
                                {student?.fullName || request.studentName}
                              </p>
                              <p className="text-xs font-semibold text-gray-500 mt-0.5 truncate">
                                {student?.department || '-'} • Room {student?.roomNumber || '-'}
                              </p>
                            </div>
                            <span className={`flex-shrink-0 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-bold ${getStatusBadgeClass(request.status)}`}>
                              {request.status}
                            </span>
                          </div>
                          
                          <div className="w-full h-px bg-gray-100 my-1" />
                          
                          <div className="flex items-center justify-between text-xs font-medium text-gray-500 w-full">
                            <span className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100 font-semibold">{titleCase(request.requestType)}</span>
                            <span>{formatDateTimeLabel(request.createdAt)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : activeSection === 'inbox' ? (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              {loadingNotifications ? (
                <div className="text-sm text-gray-500">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="text-sm text-gray-500">No notifications yet.</div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => markNotificationRead(note)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        note.is_read ? 'bg-white border-gray-200' : 'bg-red-50 border-red-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{note.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{note.message}</p>
                        </div>
                        {!note.is_read && (
                          <span className="text-xs font-semibold text-[#CD0000]">New</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{formatDateTimeLabel(note.created_at)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-6 max-w-3xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#CD0000] text-white flex items-center justify-center text-lg font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{displayName}</p>
                  <p className="text-sm text-gray-600">{profile?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Role</p>
                  <p className="font-semibold text-gray-900">Warden</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Institute</p>
                  <p className="font-semibold text-gray-900">{profile?.institute || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Mobile</p>
                  <p className="font-semibold text-gray-900">{profile?.mobile_number || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Department</p>
                  <p className="font-semibold text-gray-900">{profile?.department || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <RequestDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        request={modalRequest}
        showDecisionForm
        decisionContent={renderDecisionContent()}
      />
    </div>
  );
}

const requestFallbackName = (requests: RequestSummary[]) => requests[0]?.studentName || 'Student';
