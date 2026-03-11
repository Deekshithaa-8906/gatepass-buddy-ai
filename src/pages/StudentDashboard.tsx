import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { OutingRequest, Complaint, GatepassNotification, INSTITUTIONS, YEARS, getApprovalChain, ApprovalStep } from '@/types';
import { getRequests, addRequest, getComplaints, addComplaint, getNotifications, markNotificationRead, checkAndEscalateComplaints } from '@/lib/storage';
import { downloadGatepassPDF } from '@/lib/gatepass-pdf';
import { MapPin, FileText, ClipboardList, AlertTriangle, Download, Clock, CheckCircle, XCircle, Bell, ArrowLeft, RotateCcw } from 'lucide-react';
import ApprovalTimeline from '@/components/ApprovalTimeline';
import ProfileDropdown from '@/components/ProfileDropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const StatusBadge = ({ status }: { status: string }) => {
  const classes =
    status === 'approved' ? 'bg-success/20 text-success border-success/30' :
    status === 'declined' ? 'bg-destructive/20 text-destructive border-destructive/30' :
    'bg-warning/20 text-warning border-warning/30';
  return <Badge className={`capitalize border ${classes}`}>{status}</Badge>;
};

const ComplaintStatusBadge = ({ status }: { status: string }) => {
  const classes =
    status === 'resolved' ? 'bg-[#28A745]/20 text-[#28A745] border-[#28A745]/30' :
    status === 'escalated' ? 'bg-destructive/20 text-destructive border-destructive/30' :
    'bg-warning/20 text-warning border-warning/30';
  return <Badge className={`capitalize border ${classes}`}>{status}</Badge>;
};

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<OutingRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<GatepassNotification[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'student') { navigate('/'); return; }
    // Check for complaint escalation on load
    checkAndEscalateComplaints();
    refreshData();
  }, [user, navigate]);

  if (!user || user.role !== 'student') return null;

  const refreshData = () => {
    setRequests(getRequests().filter(r => r.studentId === user.id));
    setComplaints(getComplaints().filter(c => c.studentId === user.id));
    setNotifications(getNotifications(user.id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero text-primary-foreground py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6" />
            <span className="font-display font-bold text-lg">PassNTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-90">Welcome, {user.name}</span>
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">Student Dashboard</h1>
        </div>

        <Tabs defaultValue="outing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="outing" className="gap-1"><FileText className="w-4 h-4" /> Outing</TabsTrigger>
            <TabsTrigger value="leave" className="gap-1"><ClipboardList className="w-4 h-4" /> Leave</TabsTrigger>
            <TabsTrigger value="complaints" className="gap-1"><AlertTriangle className="w-4 h-4" /> Complaints</TabsTrigger>
            <TabsTrigger value="status" className="gap-1"><Clock className="w-4 h-4" /> Status</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 relative">
              <Bell className="w-4 h-4" /> Inbox
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">{unreadCount}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="outing">
            <RequestForm type="outing" user={user} onSubmit={refreshData} />
          </TabsContent>
          <TabsContent value="leave">
            <RequestForm type="leave" user={user} onSubmit={refreshData} />
          </TabsContent>
          <TabsContent value="complaints">
            <ComplaintForm user={user} onSubmit={refreshData} />
            {complaints.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-display font-bold text-foreground">Your Complaints</h3>
                {complaints.map(c => (
                  <div key={c.id} className={`card-elevated ${c.status === 'escalated' ? 'border-l-4 border-l-destructive' : c.status === 'resolved' ? 'border-l-4 border-l-[#28A745]' : ''}`}>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Room {c.roomNumber}</p>
                        <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</p>
                      </div>
                      <ComplaintStatusBadge status={c.status || (c.resolved ? 'resolved' : 'pending')} />
                    </div>
                    <p className="text-sm text-muted-foreground">{c.text}</p>
                    {c.escalatedAt && <p className="text-xs text-destructive mt-1">Escalated on {new Date(c.escalatedAt).toLocaleString()}</p>}
                    {c.resolvedAt && <p className="text-xs text-[#28A745] mt-1">Resolved on {new Date(c.resolvedAt).toLocaleString()}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="status">
            <StatusView requests={requests} />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsView notifications={notifications} onRefresh={refreshData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

function RequestForm({ type, user, onSubmit }: { type: 'outing' | 'leave'; user: { id: string; name: string; phone: string; email: string }; onSubmit: () => void }) {
  const [form, setForm] = useState({
    year: '' as string,
    branch: '',
    institution: '',
    regNumber: '',
    parentPhone: '',
    roomNumber: '',
    outDateTime: '',
    inDateTime: '',
    reason: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chain = getApprovalChain(form.year, type);
    const approvalChain: ApprovalStep[] = chain.map(role => ({ role, status: 'pending' as const }));

    const request: OutingRequest = {
      id: crypto.randomUUID(),
      type,
      studentId: user.id,
      name: user.name,
      year: form.year as OutingRequest['year'],
      branch: form.branch,
      studentPhone: user.phone,
      studentEmail: user.email,
      institution: form.institution,
      regNumber: form.regNumber,
      parentPhone: form.parentPhone,
      roomNumber: form.roomNumber,
      outDateTime: form.outDateTime,
      inDateTime: form.inDateTime,
      reason: form.reason,
      approvalChain,
      currentApprover: chain[0],
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    addRequest(request);
    setSubmitted(true);
    onSubmit();
    setTimeout(() => setSubmitted(false), 3000);
    setForm({ year: '', branch: '', institution: '', regNumber: '', parentPhone: '', roomNumber: '', outDateTime: '', inDateTime: '', reason: '' });
  };

  const passTitle = type === 'outing' ? 'Outing Pass Request' : 'Leave Pass Request';
  const reasonLabel = type === 'outing' ? 'Reason for Going Out' : 'Reason for Leave';
  const outLabel = type === 'outing' ? 'Out Date & Time' : 'From Date & Time';
  const inLabel = type === 'outing' ? 'In Date & Time' : 'To Date & Time';

  return (
    <div className="card-elevated max-w-2xl">
      <h2 className="text-xl font-display font-bold text-foreground mb-4">{passTitle}</h2>
      {submitted && (
        <div className="bg-success/20 text-success border border-success/30 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Request submitted successfully! PassNTrack will notify you on approval.
        </div>
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input value={user.name} disabled />
        </div>
        <div className="space-y-1">
          <Label>Year</Label>
          <Select value={form.year} onValueChange={v => update('year', v)}>
            <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
            <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y} Year</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Branch</Label>
          <Input placeholder="e.g. CSE" value={form.branch} onChange={e => update('branch', e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Institution</Label>
          <Select value={form.institution} onValueChange={v => update('institution', v)}>
            <SelectTrigger><SelectValue placeholder="Select institution" /></SelectTrigger>
            <SelectContent>{INSTITUTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Registration Number</Label>
          <Input placeholder="Enter reg number" value={form.regNumber} onChange={e => update('regNumber', e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Student Phone</Label>
          <Input value={user.phone} disabled />
        </div>
        <div className="space-y-1">
          <Label>Parent Phone</Label>
          <Input type="tel" placeholder="Parent phone" value={form.parentPhone} onChange={e => update('parentPhone', e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Room Number</Label>
          <Input placeholder="e.g. A-201" value={form.roomNumber} onChange={e => update('roomNumber', e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>{outLabel}</Label>
          <Input type="datetime-local" value={form.outDateTime} onChange={e => update('outDateTime', e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>{inLabel}</Label>
          <Input type="datetime-local" value={form.inDateTime} onChange={e => update('inDateTime', e.target.value)} required />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label>{reasonLabel}</Label>
          <Textarea placeholder="Enter reason..." value={form.reason} onChange={e => update('reason', e.target.value)} required />
        </div>
        {form.year && (
          <div className="sm:col-span-2 bg-muted p-3 rounded-lg text-sm text-muted-foreground">
            <strong>Approval chain:</strong> {getApprovalChain(form.year).map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(' → ')}
          </div>
        )}
        <div className="sm:col-span-2">
          <Button type="submit" className="btn-hero w-full">Submit {type === 'outing' ? 'Outing' : 'Leave'} Request</Button>
        </div>
      </form>
    </div>
  );
}

function ComplaintForm({ user, onSubmit }: { user: { id: string; name: string }; onSubmit: () => void }) {
  const [roomNumber, setRoomNumber] = useState('');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addComplaint({
      id: crypto.randomUUID(),
      studentId: user.id,
      name: user.name,
      roomNumber,
      text,
      createdAt: new Date().toISOString(),
      resolved: false,
      status: 'pending',
    });
    setSubmitted(true);
    onSubmit();
    setTimeout(() => setSubmitted(false), 3000);
    setRoomNumber('');
    setText('');
  };

  return (
    <div className="card-elevated max-w-2xl">
      <h2 className="text-xl font-display font-bold text-foreground mb-4">Submit Complaint</h2>
      {submitted && (
        <div className="bg-success/20 text-success border border-success/30 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Complaint submitted to PassNTrack!
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input value={user.name} disabled />
        </div>
        <div className="space-y-1">
          <Label>Room Number</Label>
          <Input placeholder="e.g. A-201" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Complaint</Label>
          <Textarea placeholder="Describe your complaint..." value={text} onChange={e => setText(e.target.value)} required rows={4} />
        </div>
        <Button type="submit" className="btn-hero w-full">Submit Complaint</Button>
      </form>
    </div>
  );
}

function StatusView({ requests }: { requests: OutingRequest[] }) {
  if (requests.length === 0) {
    return (
      <div className="card-elevated text-center py-12 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No requests yet. Submit an outing or leave request to track it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map(r => (
        <div key={r.id} className="card-elevated">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground">{r.type === 'outing' ? 'Outing' : 'Leave'} Pass</h3>
              <p className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
            <StatusBadge status={r.status} />
          </div>
          <div className="text-sm text-muted-foreground mb-3">
            <p><strong>Out:</strong> {new Date(r.outDateTime).toLocaleString()} → <strong>In:</strong> {new Date(r.inDateTime).toLocaleString()}</p>
            <p><strong>Reason:</strong> {r.reason}</p>
          </div>
          <ApprovalTimeline chain={r.approvalChain} />
          {r.status === 'approved' && (
            <Button size="sm" className="mt-3 gap-1" variant="outline" onClick={() => downloadGatepassPDF(r)}>
              <Download className="w-3 h-3" /> Download {r.type === 'leave' ? 'Leave Pass' : 'Gatepass'} PDF
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function NotificationsView({ notifications, onRefresh }: { notifications: GatepassNotification[]; onRefresh: () => void }) {
  if (notifications.length === 0) {
    return (
      <div className="card-elevated text-center py-12 text-muted-foreground">
        <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No notifications yet. PassNTrack will notify you when your requests are actioned.</p>
      </div>
    );
  }

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    onRefresh();
  };

  const isApproved = (msg: string) => msg.toLowerCase().includes('approved');
  const isRejected = (msg: string) => msg.toLowerCase().includes('rejected') || msg.toLowerCase().includes('declined');

  return (
    <div className="space-y-4">
      {notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(n => {
        const approved = isApproved(n.message);
        const rejected = isRejected(n.message);
        const borderColor = approved ? 'border-l-4 border-l-[#28A745]' : rejected ? 'border-l-4 border-l-[#FF0000]' : '';

        return (
          <div key={n.id} className={`card-elevated bg-white ${borderColor} ${!n.read ? 'ring-1 ring-primary/20' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {approved && <CheckCircle className="w-5 h-5 text-[#28A745]" />}
                {rejected && <XCircle className="w-5 h-5 text-[#FF0000]" />}
                {!approved && !rejected && <Bell className="w-5 h-5 text-primary" />}
                <span className="text-sm font-semibold text-[#000000]">
                  {approved ? 'Approved' : rejected ? 'Rejected' : 'Notification'} — PassNTrack
                </span>
                {!n.read && <Badge className="bg-warning/20 text-warning border border-warning/30 text-xs">New</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-[#000000] bg-muted p-3 rounded-lg">{n.message}</p>
            {!n.read && (
              <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => handleMarkRead(n.id)}>
                Mark as read
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StudentDashboard;
