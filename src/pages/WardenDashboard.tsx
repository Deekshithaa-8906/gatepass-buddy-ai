import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { OutingRequest, Complaint } from '@/types';
import { getRequests, updateRequest, getComplaints, addNotification, resolveComplaint } from '@/lib/storage';
import { downloadGatepassPDF } from '@/lib/gatepass-pdf';
import { MapPin, CheckCircle, XCircle, Clock, FileText, AlertTriangle, Download, ArrowLeft, CheckCheck } from 'lucide-react';
import ProfileDropdown from '@/components/ProfileDropdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const StatusBadge = ({ status }: { status: string }) => {
  const classes =
    status === 'approved' ? 'bg-success/20 text-success border-success/30' :
    status === 'declined' ? 'bg-destructive/20 text-destructive border-destructive/30' :
    status === 'resolved' ? 'bg-success/20 text-success border-success/30' :
    'bg-warning/20 text-warning border-warning/30';
  return <Badge className={`capitalize border ${classes}`}>{status}</Badge>;
};

const WardenDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<OutingRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [declineReasons, setDeclineReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user || user.role !== 'warden') { navigate('/'); return; }
    refreshData();
  }, [user, navigate]);

  if (!user || user.role !== 'warden') return null;

  const refreshData = () => {
    setRequests(getRequests());
    setComplaints(getComplaints());
  };

  const pendingOuting = requests.filter(r => r.currentApprover === 'warden' && r.status === 'pending' && r.type === 'outing');
  const pendingLeave = requests.filter(r => r.currentApprover === 'warden' && r.status === 'pending' && r.type === 'leave');
  const history = requests.filter(r => r.approvalChain.some(s => s.role === 'warden' && s.status !== 'pending'));

  const handleApprove = (id: string) => {
    let approvedRequest: OutingRequest | null = null;
    updateRequest(id, r => {
      const stepIdx = r.approvalChain.findIndex(s => s.role === 'warden');
      if (stepIdx === -1) return r;
      r.approvalChain[stepIdx] = { ...r.approvalChain[stepIdx], status: 'approved', approvedBy: user.name, timestamp: new Date().toISOString() };
      r.currentApprover = 'completed';
      r.status = 'approved';
      approvedRequest = { ...r };
      return r;
    });

    if (approvedRequest) {
      const req = approvedRequest as OutingRequest;
      const hasEmail = req.studentEmail && req.studentEmail.trim() !== '';
      const method = hasEmail ? 'email' : 'sms';
      const destination = hasEmail ? req.studentEmail : req.studentPhone;
      const passLabel = req.type === 'leave' ? 'leave pass' : 'gatepass';

      addNotification({
        id: crypto.randomUUID(),
        requestId: req.id,
        studentId: req.studentId,
        method,
        destination,
        message: `[PassNTrack] Your ${req.type} pass has been APPROVED by Warden! ${passLabel.charAt(0).toUpperCase() + passLabel.slice(1)} for ${new Date(req.outDateTime).toLocaleDateString()} – ${new Date(req.inDateTime).toLocaleDateString()} is ready for download. ${method === 'email' ? 'A copy has been sent to your email.' : 'Check your messages for details.'}`,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
    refreshData();
  };

  const handleDecline = (id: string) => {
    const reason = declineReasons[id] || 'No reason provided';
    let declinedRequest: OutingRequest | null = null;
    updateRequest(id, r => {
      const stepIdx = r.approvalChain.findIndex(s => s.role === 'warden');
      if (stepIdx === -1) return r;
      r.approvalChain[stepIdx] = { ...r.approvalChain[stepIdx], status: 'declined', approvedBy: user.name, reason, timestamp: new Date().toISOString() };
      r.currentApprover = 'declined';
      r.status = 'declined';
      declinedRequest = { ...r };
      return r;
    });

    if (declinedRequest) {
      const req = declinedRequest as OutingRequest;
      const hasEmail = req.studentEmail && req.studentEmail.trim() !== '';
      addNotification({
        id: crypto.randomUUID(),
        requestId: req.id,
        studentId: req.studentId,
        method: hasEmail ? 'email' : 'sms',
        destination: hasEmail ? req.studentEmail : req.studentPhone,
        message: `[PassNTrack] Your ${req.type} pass has been DECLINED by Warden. Reason: ${reason}`,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
    refreshData();
  };

  const handleResolveComplaint = (complaint: Complaint) => {
    resolveComplaint(complaint.id);
    addNotification({
      id: crypto.randomUUID(),
      requestId: complaint.id,
      studentId: complaint.studentId,
      method: 'sms',
      destination: '',
      message: `[PassNTrack] Your complaint regarding "${complaint.text.slice(0, 60)}${complaint.text.length > 60 ? '...' : ''}" has been marked as RESOLVED by Warden. Thank you for bringing this to our attention.`,
      createdAt: new Date().toISOString(),
      read: false,
    });
    refreshData();
  };

  const RequestCard = ({ r }: { r: OutingRequest }) => (
    <div className="card-elevated">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-foreground text-lg">{r.name}</h3>
          <p className="text-sm text-muted-foreground">{r.type.toUpperCase()} | {r.year} Year, {r.branch} | {r.institution}</p>
        </div>
        <StatusBadge status="pending" />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
        <p><strong>Reg No:</strong> {r.regNumber}</p>
        <p><strong>Room:</strong> {r.roomNumber}</p>
        <p><strong>Student Phone:</strong> {r.studentPhone}</p>
        <p><strong>Parent Phone:</strong> {r.parentPhone}</p>
        <p><strong>Out:</strong> {new Date(r.outDateTime).toLocaleString()}</p>
        <p><strong>In:</strong> {new Date(r.inDateTime).toLocaleString()}</p>
        <p className="col-span-2"><strong>Reason:</strong> {r.reason}</p>
      </div>
      {r.approvalChain.length > 1 && (
        <div className="flex items-center gap-2 mb-3 text-xs">
          <span className="text-muted-foreground">Prior approvals:</span>
          {r.approvalChain.filter(s => s.role !== 'warden').map((s, i) => (
            <span key={i} className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-success" />
              <span className="capitalize">{s.role}</span>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end gap-3">
        <Button className="gap-1 bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleApprove(r.id)}>
          <CheckCircle className="w-4 h-4" /> Approve & Generate Pass
        </Button>
        <div className="flex-1">
          <Textarea placeholder="Reason for declining..." value={declineReasons[r.id] || ''} onChange={e => setDeclineReasons(p => ({ ...p, [r.id]: e.target.value }))} rows={1} className="text-sm" />
        </div>
        <Button variant="destructive" className="gap-1" onClick={() => handleDecline(r.id)}>
          <XCircle className="w-4 h-4" /> Decline
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero text-primary-foreground py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6" />
            <span className="font-display font-bold text-lg">PassNTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-90">{user.name} (WARDEN)</span>
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">Warden Dashboard</h1>
        </div>

        <Tabs defaultValue="outing" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="outing" className="gap-1">
              <Clock className="w-4 h-4" /> Pending Outing ({pendingOuting.length})
            </TabsTrigger>
            <TabsTrigger value="leave" className="gap-1">
              <Clock className="w-4 h-4" /> Pending Leave ({pendingLeave.length})
            </TabsTrigger>
            <TabsTrigger value="complaints" className="gap-1">
              <AlertTriangle className="w-4 h-4" /> Complaints ({complaints.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <FileText className="w-4 h-4" /> History
            </TabsTrigger>
          </TabsList>

          {/* Pending Outing */}
          <TabsContent value="outing">
            {pendingOuting.length === 0 ? (
              <div className="card-elevated text-center py-12 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No pending outing requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOuting.map(r => <RequestCard key={r.id} r={r} />)}
              </div>
            )}
          </TabsContent>

          {/* Pending Leave */}
          <TabsContent value="leave">
            {pendingLeave.length === 0 ? (
              <div className="card-elevated text-center py-12 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No pending leave requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingLeave.map(r => <RequestCard key={r.id} r={r} />)}
              </div>
            )}
          </TabsContent>

          {/* Complaints */}
          <TabsContent value="complaints">
            {complaints.length === 0 ? (
              <div className="card-elevated text-center py-12 text-muted-foreground"><p>No complaints submitted</p></div>
            ) : (
              <div className="space-y-4">
                {complaints.map(c => (
                  <div key={c.id} className="card-elevated">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{c.name} — Room {c.roomNumber}</h3>
                        <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</p>
                      </div>
                      <StatusBadge status={c.resolved ? 'resolved' : 'pending'} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{c.text}</p>
                    {c.resolved && c.resolvedAt && (
                      <p className="text-xs text-success">Resolved on {new Date(c.resolvedAt).toLocaleString()}</p>
                    )}
                    {!c.resolved && (
                      <Button size="sm" className="gap-1 bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleResolveComplaint(c)}>
                        <CheckCheck className="w-4 h-4" /> Mark as Solved
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            {history.length === 0 ? (
              <div className="card-elevated text-center py-12 text-muted-foreground"><p>No past approvals</p></div>
            ) : (
              <div className="space-y-4">
                {history.map(r => (
                  <div key={r.id} className="card-elevated">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-foreground">{r.name} — {r.type} pass</h3>
                        <p className="text-sm text-muted-foreground">{r.year} Year, {r.branch}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.status === 'approved' && (
                      <Button size="sm" variant="outline" className="mt-2 gap-1" onClick={() => downloadGatepassPDF(r)}>
                        <Download className="w-3 h-3" /> Download {r.type === 'leave' ? 'Leave Pass' : 'Gatepass'} PDF
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WardenDashboard;
