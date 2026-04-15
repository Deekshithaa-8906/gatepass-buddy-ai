import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle, FileText, LogOut, Mail, User, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

type ComplaintRow = {
  id: string;
  student_id: string | null;
  category: string;
  description: string;
  status: ComplaintStatus;
  created_at: string;
  escalated_at?: string | null;
  resolved_at?: string | null;
  forwarded_by_role?: string | null;
  closed_reason?: string | null;
  closed_at?: string | null;
};

type StudentMeta = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  room_number?: string | null;
  hostel_block?: string | null;
  department?: string | null;
  register_number?: string | null;
  institute?: string | null;
};

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type WardenRemark = {
  note: string;
  created_at: string;
  author_name: string;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getForwardLabel = (role?: string | null) => {
  if (role === 'warden') return 'Forwarded by Warden';
  if (role === 'system') return 'Auto Forwarded';
  return '-';
};

const getStatusBadgeClass = (status: ComplaintStatus) => {
  switch (status) {
    case 'resolved':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'closed':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'open':
    default:
      return 'bg-orange-100 text-orange-700 border-orange-200';
  }
};

const PrincipalDashboard = () => {
  const navigate = useNavigate();
  const { profile, loading: authLoading, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<'complaints' | 'inbox' | 'profile'>('complaints');
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [studentDirectory, setStudentDirectory] = useState<Record<string, StudentMeta>>({});
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [wardenRemark, setWardenRemark] = useState<WardenRemark | null>(null);
  const [closeReason, setCloseReason] = useState('');

  const displayName = profile?.full_name || profile?.email || 'Principal';

  const loadComplaints = useCallback(async () => {
    setLoadingComplaints(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('id, student_id, category, description, status, created_at, escalated_at, resolved_at, forwarded_by_role, closed_reason, closed_at')
      .not('forwarded_by_role', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Unable to load complaints:', error);
      toast({ title: 'Unable to load complaints', description: error.message || 'Please try again.' });
      setLoadingComplaints(false);
      return;
    }

    const rows = (data || []) as ComplaintRow[];
    setComplaints(rows);

    const studentIds = Array.from(new Set(rows.map((row) => row.student_id).filter(Boolean))) as string[];
    if (studentIds.length === 0) {
      setStudentDirectory({});
      setLoadingComplaints(false);
      return;
    }

    const { data: studentRows, error: studentError } = await supabase
      .from('user_profile_view')
      .select('id, full_name, email, room_number, hostel_block, department, register_number, institute')
      .in('id', studentIds);

    if (studentError) {
      console.error('Unable to load student profiles:', studentError);
      setStudentDirectory({});
      setLoadingComplaints(false);
      return;
    }

    const directory: Record<string, StudentMeta> = {};
    (studentRows || []).forEach((row: any) => {
      if (!row.id) return;
      directory[row.id] = {
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        room_number: row.room_number,
        hostel_block: row.hostel_block,
        department: row.department,
        register_number: row.register_number,
        institute: row.institute,
      };
    });

    setStudentDirectory(directory);
    setLoadingComplaints(false);
  }, []);

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

  const loadWardenRemark = useCallback(async (complaintId: string) => {
    const { data, error } = await supabase
      .from('complaint_notes')
      .select('id, note, created_at, author:author_id (id, role, full_name, email)')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Unable to load complaint notes:', error);
      setWardenRemark(null);
      return;
    }

    const row = (data || []).find((entry: any) => entry.author?.role === 'warden');
    if (!row) {
      setWardenRemark(null);
      return;
    }

    const author = Array.isArray(row.author) ? row.author[0] : row.author;
    const authorName = author?.full_name || author?.email || 'Warden';
    setWardenRemark({ note: row.note, created_at: row.created_at, author_name: authorName });
  }, []);

  const markNotificationRead = useCallback(async (notification: NotificationRow) => {
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
  }, []);

  const handleResolve = useCallback(async (complaint: ComplaintRow) => {
    const { error } = await supabase
      .from('complaints')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', complaint.id);

    if (error) {
      toast({ title: 'Unable to resolve', description: error.message || 'Please try again.' });
      return;
    }

    toast({ title: 'Complaint resolved', description: 'Status updated to resolved.' });
    await loadComplaints();
  }, [loadComplaints]);

  const handleClose = useCallback(async (complaint: ComplaintRow) => {
    if (!closeReason.trim()) {
      toast({ title: 'Reason required', description: 'Please add a close reason.' });
      return;
    }

    const { error } = await supabase
      .from('complaints')
      .update({
        status: 'closed',
        closed_reason: closeReason.trim(),
        closed_at: new Date().toISOString(),
      })
      .eq('id', complaint.id);

    if (error) {
      toast({ title: 'Unable to close', description: error.message || 'Please try again.' });
      return;
    }

    toast({ title: 'Complaint closed', description: 'Status updated to closed.' });
    setCloseReason('');
    await loadComplaints();
  }, [closeReason, loadComplaints]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== 'principal') {
      navigate('/');
      return;
    }
    void loadComplaints();
    void loadNotifications();
  }, [authLoading, loadComplaints, loadNotifications, navigate, profile]);

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel('principal-notifications')
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
    if (!selectedComplaintId) {
      setWardenRemark(null);
      return;
    }
    void loadWardenRemark(selectedComplaintId);
  }, [loadWardenRemark, selectedComplaintId]);

  const filteredComplaints = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return complaints;
    return complaints.filter((complaint) => {
      const student = complaint.student_id ? studentDirectory[complaint.student_id] : null;
      const haystack = [
        student?.full_name,
        student?.register_number,
        student?.room_number,
        student?.hostel_block,
        student?.department,
        complaint.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [complaints, searchTerm, studentDirectory]);

  const selectedComplaint = useMemo(
    () => complaints.find((item) => item.id === selectedComplaintId) || null,
    [complaints, selectedComplaintId],
  );

  if (authLoading) return null;
  if (!profile || profile.role !== 'principal') return null;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm md:h-screen sticky top-0">
        <div className="p-6 border-b border-gray-200 flex items-center gap-3">
          <div className="bg-[#CD0000] p-2 rounded-lg shadow-sm">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900">PassN<span className="text-[#CD0000]">Track</span></span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <button
            onClick={() => setActiveSection('complaints')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              activeSection === 'complaints'
                ? 'bg-[#CD0000] text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5" /> Complaints
          </button>
          <button
            onClick={() => setActiveSection('inbox')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              activeSection === 'inbox'
                ? 'bg-[#CD0000]/10 text-[#CD0000]'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Bell className="w-5 h-5" /> Inbox
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
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-gray-700 hover:text-[#CD0000] hover:bg-red-50 font-semibold rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="px-8 py-5 flex justify-between items-center bg-white border-b border-gray-200 sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Principal Dashboard</h1>
            <p className="text-sm font-medium text-gray-600">Complaints overview</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700">
              <Mail className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#CD0000] flex items-center justify-center text-white font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-bold text-gray-900 leading-tight">{displayName}</p>
                <p className="text-gray-600 text-xs leading-tight">Principal</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 h-[calc(100vh-80px)]">
          {activeSection === 'complaints' ? (
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              <div className="lg:w-[35%] bg-white rounded-xl shadow-sm border p-6 overflow-y-auto max-h-[calc(100vh-220px)]">
                <div className="mb-4">
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by student name, room, department"
                  />
                </div>
                {loadingComplaints ? (
                  <div className="text-sm text-gray-500">Loading complaints...</div>
                ) : filteredComplaints.length === 0 ? (
                  <div className="text-sm text-gray-500">No forwarded complaints found.</div>
                ) : (
                  <div className="space-y-3">
                    {filteredComplaints.map((complaint) => {
                      const student = complaint.student_id ? studentDirectory[complaint.student_id] : null;
                      const label = getForwardLabel(complaint.forwarded_by_role);
                      return (
                        <button
                          key={complaint.id}
                          onClick={() => setSelectedComplaintId(complaint.id)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${
                            selectedComplaintId === complaint.id
                              ? 'border-[#CD0000] bg-red-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-900">{student?.full_name || student?.email || 'Student'}</p>
                              <p className="text-xs text-gray-600 mt-1">{complaint.description.slice(0, 80)}{complaint.description.length > 80 ? '...' : ''}</p>
                              <p className="text-xs text-gray-500 mt-2">{label}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getStatusBadgeClass(complaint.status)}`}>
                              {complaint.status}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex-1 bg-white rounded-xl shadow-sm border p-6 overflow-y-auto">
                {!selectedComplaint ? (
                  <div className="text-sm text-gray-500">Select a complaint to view details.</div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Complaint Details</h2>
                        <p className="text-xs text-gray-500">Submitted {formatDateTime(selectedComplaint.created_at)}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getStatusBadgeClass(selectedComplaint.status)}`}>
                        {selectedComplaint.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Student</p>
                        <p className="font-semibold text-gray-900">
                          {selectedComplaint.student_id ? studentDirectory[selectedComplaint.student_id]?.full_name : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Register No</p>
                        <p className="font-semibold text-gray-900">
                          {selectedComplaint.student_id ? studentDirectory[selectedComplaint.student_id]?.register_number || '-' : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Room / Block</p>
                        <p className="font-semibold text-gray-900">
                          {selectedComplaint.student_id ? studentDirectory[selectedComplaint.student_id]?.room_number || '-' : '-'} / {selectedComplaint.student_id ? studentDirectory[selectedComplaint.student_id]?.hostel_block || '-' : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Department</p>
                        <p className="font-semibold text-gray-900">
                          {selectedComplaint.student_id ? studentDirectory[selectedComplaint.student_id]?.department || '-' : '-'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Complaint</p>
                      <p className="text-sm text-gray-800 mt-2 whitespace-pre-line">{selectedComplaint.description}</p>
                    </div>

                    <div className="bg-gray-50 border rounded-lg p-4">
                      <p className="text-xs text-gray-500 font-semibold">Warden remarks</p>
                      <p className="text-sm text-gray-800 mt-2">
                        {wardenRemark ? `${wardenRemark.note} (by ${wardenRemark.author_name})` : 'No remarks recorded.'}
                      </p>
                      {wardenRemark && (
                        <p className="text-xs text-gray-500 mt-2">{formatDateTime(wardenRemark.created_at)}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Textarea
                        value={closeReason}
                        onChange={(event) => setCloseReason(event.target.value)}
                        placeholder="Add close reason (required to close)"
                        className="min-h-[90px]"
                      />
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={() => handleResolve(selectedComplaint)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Resolve
                        </Button>
                        <Button
                          onClick={() => handleClose(selectedComplaint)}
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Close
                        </Button>
                      </div>
                      {selectedComplaint.closed_reason && (
                        <p className="text-xs text-gray-500">Closed reason: {selectedComplaint.closed_reason}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                      <p className="text-xs text-gray-500 mt-2">{formatDateTime(note.created_at)}</p>
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
                  <p className="font-semibold text-gray-900">Principal</p>
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
    </div>
  );
};

export default PrincipalDashboard;
