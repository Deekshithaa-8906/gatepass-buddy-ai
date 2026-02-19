import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { OutingRequest, Complaint, INSTITUTIONS, YEARS, getApprovalChain, ApprovalStep } from '@/types';
import { getRequests, addRequest, getComplaints, addComplaint } from '@/lib/storage';
import { Shield, LogOut, FileText, ClipboardList, AlertTriangle, Download, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<OutingRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'student') { navigate('/'); return; }
    setRequests(getRequests().filter(r => r.studentId === user.id));
    setComplaints(getComplaints().filter(c => c.studentId === user.id));
  }, [user, navigate]);

  const refreshData = () => {
    if (!user) return;
    setRequests(getRequests().filter(r => r.studentId === user.id));
    setComplaints(getComplaints().filter(c => c.studentId === user.id));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero text-primary-foreground py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <span className="font-display font-bold text-lg">SNS Gatepass</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-90">Welcome, {user?.name}</span>
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => { logout(); navigate('/'); }}>
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-6">Student Dashboard</h1>

        <Tabs defaultValue="outing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="outing" className="gap-1"><FileText className="w-4 h-4" /> Outing</TabsTrigger>
            <TabsTrigger value="leave" className="gap-1"><ClipboardList className="w-4 h-4" /> Leave</TabsTrigger>
            <TabsTrigger value="complaints" className="gap-1"><AlertTriangle className="w-4 h-4" /> Complaints</TabsTrigger>
            <TabsTrigger value="status" className="gap-1"><Clock className="w-4 h-4" /> Status</TabsTrigger>
          </TabsList>

          <TabsContent value="outing">
            <RequestForm type="outing" user={user!} onSubmit={refreshData} />
          </TabsContent>
          <TabsContent value="leave">
            <RequestForm type="leave" user={user!} onSubmit={refreshData} />
          </TabsContent>
          <TabsContent value="complaints">
            <ComplaintForm user={user!} onSubmit={refreshData} />
          </TabsContent>
          <TabsContent value="status">
            <StatusView requests={requests} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

function RequestForm({ type, user, onSubmit }: { type: 'outing' | 'leave'; user: { id: string; name: string; phone: string }; onSubmit: () => void }) {
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
    const chain = getApprovalChain(form.year);
    const approvalChain: ApprovalStep[] = chain.map(role => ({ role, status: 'pending' as const }));

    const request: OutingRequest = {
      id: crypto.randomUUID(),
      type,
      studentId: user.id,
      name: user.name,
      year: form.year as OutingRequest['year'],
      branch: form.branch,
      studentPhone: user.phone,
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

  return (
    <div className="card-elevated max-w-2xl">
      <h2 className="text-xl font-display font-bold text-foreground mb-4">
        {type === 'outing' ? 'Outing Pass Request' : 'Leave Pass Request'}
      </h2>
      {submitted && (
        <div className="status-approved p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Request submitted successfully!
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
          <Label>Out Date & Time</Label>
          <Input type="datetime-local" value={form.outDateTime} onChange={e => update('outDateTime', e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>In Date & Time</Label>
          <Input type="datetime-local" value={form.inDateTime} onChange={e => update('inDateTime', e.target.value)} required />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label>Reason for {type === 'outing' ? 'Going Out' : 'Leave'}</Label>
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
        <div className="status-approved p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Complaint submitted!
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
  const statusIcon = (s: string) => {
    if (s === 'approved') return <CheckCircle className="w-4 h-4 text-success" />;
    if (s === 'declined') return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-warning" />;
  };

  const downloadGatepass = (r: OutingRequest) => {
    const text = `
=== GATEPASS ===
SNS Institutions - Hostel Gatepass

Name: ${r.name}
Reg No: ${r.regNumber}
Branch: ${r.branch}
Year: ${r.year}
Institution: ${r.institution}
Room: ${r.roomNumber}
Student Phone: ${r.studentPhone}
Parent Phone: ${r.parentPhone}

Type: ${r.type.toUpperCase()}
Out: ${new Date(r.outDateTime).toLocaleString()}
In: ${new Date(r.inDateTime).toLocaleString()}
Reason: ${r.reason}

Status: APPROVED
Approved on: ${new Date().toLocaleString()}
================
    `.trim();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gatepass-${r.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            <Badge className={r.status === 'approved' ? 'status-approved' : r.status === 'declined' ? 'status-declined' : 'status-pending'}>
              {r.status}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mb-3">
            <p><strong>Out:</strong> {new Date(r.outDateTime).toLocaleString()} → <strong>In:</strong> {new Date(r.inDateTime).toLocaleString()}</p>
            <p><strong>Reason:</strong> {r.reason}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {r.approvalChain.map((step, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                {statusIcon(step.status)}
                <span className="capitalize">{step.role}</span>
                {step.reason && <span className="text-destructive">({step.reason})</span>}
                {i < r.approvalChain.length - 1 && <span className="text-muted-foreground mx-1">→</span>}
              </div>
            ))}
          </div>
          {r.status === 'approved' && (
            <Button size="sm" className="mt-3 gap-1" variant="outline" onClick={() => downloadGatepass(r)}>
              <Download className="w-3 h-3" /> Download Gatepass
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

export default StudentDashboard;
