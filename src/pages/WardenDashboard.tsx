import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { OutingRequest, Complaint } from '@/types';
import { getRequests, updateRequest, getComplaints, addNotification, resolveComplaint } from '@/lib/storage';
import { downloadGatepassPDF } from '@/lib/gatepass-pdf';
import { MapPin, CheckCircle, XCircle, Clock, FileText, AlertTriangle, Download, ArrowLeft, CheckCheck, Search, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import ProfileDropdown from '@/components/ProfileDropdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import ApprovalTimeline from '@/components/ApprovalTimeline';

const StatusBadge = ({ status }: { status: string }) => {
  const classes =
    status === 'approved' || status === 'reconsidered' ? 'bg-success/20 text-success border-success/30' :
    status === 'declined' ? 'bg-destructive/20 text-destructive border-destructive/30' :
    status === 'resolved' ? 'bg-success/20 text-success border-success/30' :
    status === 'escalated' ? 'bg-destructive/20 text-destructive border-destructive/30' :
    'bg-warning/20 text-warning border-warning/30';
  const label = status === 'reconsidered' ? 'Reconsidered' : status;
  return <Badge className={`capitalize border ${classes}`}>{label}</Badge>;
};

const WardenDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<OutingRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [declineReasons, setDeclineReasons] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

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

  // Declined by warden - for reconsideration
  const declinedByMe = requests.filter(r => {
    const step = r.approvalChain.find(s => s.role === 'warden');
    return step && step.status === 'declined' && r.status === 'declined' && r.currentApprover === 'declined';
  });

  // Search filter for history
  const q = searchQuery.toLowerCase().trim();
  const filteredHistory = q ? history.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.regNumber.toLowerCase().includes(q) ||
    r.roomNumber.toLowerCase().includes(q)
  ) : history;

  // Group history by student for movement tracking
  const studentGroups = filteredHistory.reduce((acc, r) => {
    const key = r.regNumber;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, OutingRequest[]>);

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
      // Student notification
      addNotification({
        id: crypto.randomUUID(),
        requestId: req.id,
        studentId: req.studentId,
        method: 'sms',
        destination: req.studentPhone,
        message: `Your gatepass has been approved..! You can download it.`,
        createdAt: new Date().toISOString(),
        read: false,
      });
      // Parent SMS notification
      addNotification({
        id: crypto.randomUUID(),
        requestId: req.id,
        studentId: req.studentId,
        method: 'sms',
        destination: req.parentPhone,
        message: `PassNTrack Notification: Your child ${req.name} from ${req.institution} has received an approved gatepass and will be going out from ${new Date(req.outDateTime).toLocaleString()} to ${new Date(req.inDateTime).toLocaleString()}.`,
        createdAt: new Date().toISOString(),
        read: true, // Parent SMS - mark as read so it doesn't clutter student inbox
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
      addNotification({
        id: crypto.randomUUID(),
        requestId: req.id,
        studentId: req.studentId,
        method: 'sms',
        destination: req.studentPhone,
        message: `Your gatepass request has been rejected by your Warden. Please contact your Warden for further details.`,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
    refreshData();
  };

  const handleReconsider = (id: string) => {
    updateRequest(id, r => {
      const stepIdx = r.approvalChain.findIndex(s => s.role === 'warden');
      if (stepIdx === -1) return r;
      r.approvalChain[stepIdx] = {
        ...r.approvalChain[stepIdx],
        status: 'reconsidered',
        approvedBy: user.name,
        reason: undefined,
        timestamp: new Date().toISOString(),
      };
      r.currentApprover = 'completed';
      r.status = 'approved';
      return r;
    });

    const req = getRequests().find(r => r.id === id);
    if (req) {
      addNotification({
        id: crypto.randomUUID(),
        requestId: req.id,
        studentId: req.studentId,
        method: 'sms',
        destination: req.studentPhone,
        message: `Your gatepass has been reconsidered and approved by your Warden. You can now download it.`,
        createdAt: new Date().toISOString(),
        read: false,
      });
      // Parent SMS
      addNotification({
        id: crypto.randomUUID(),
        requestId: req.id,
        studentId: req.studentId,
        method: 'sms',
        destination: req.parentPhone,
        message: `PassNTrack Notification: Your child ${req.name} from ${req.institution} has received an approved gatepass and will be going out from ${new Date(req.outDateTime).toLocaleString()} to ${new Date(req.inDateTime).toLocaleString()}.`,
        createdAt: new Date().toISOString(),
        read: true,
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
      {r.approvalChain.some(s => s.status !== 'pending') && (
        <ApprovalTimeline chain={r.approvalChain} />
      )}
      <div className="flex items-end gap-3 mt-3">
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
            {declinedByMe.length > 0 && (
              <TabsTrigger value="declined" className="gap-1">
                <XCircle className="w-4 h-4" /> Declined ({declinedByMe.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="complaints" className="gap-1">
              <AlertTriangle className="w-4 h-4" /> Complaints ({complaints.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <FileText className="w-4 h-4" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="outing">
            {pendingOuting.length === 0 ? (
              <div className="card-elevated text-center py-12 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No pending outing requests</p>
              </div>
            ) : (
              <div className="space-y-4">{pendingOuting.map(r => <RequestCard key={r.id} r={r} />)}</div>
            )}
          </TabsContent>

          <TabsContent value="leave">
            {pendingLeave.length === 0 ? (
              <div className="card-elevated text-center py-12 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No pending leave requests</p>
              </div>
            ) : (
              <div className="space-y-4">{pendingLeave.map(r => <RequestCard key={r.id} r={r} />)}</div>
            )}
          </TabsContent>

          {declinedByMe.length > 0 && (
            <TabsContent value="declined">
              <div className="space-y-4">
                {declinedByMe.map(r => (
                  <div key={r.id} className="card-elevated border-l-4 border-l-destructive">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">{r.name}</h3>
                        <p className="text-sm text-muted-foreground">{r.type.toUpperCase()} | {r.year} Year, {r.branch} | {r.institution}</p>
                      </div>
                      <StatusBadge status="declined" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                      <p><strong>Reg No:</strong> {r.regNumber}</p>
                      <p><strong>Room:</strong> {r.roomNumber}</p>
                      <p><strong>Out:</strong> {new Date(r.outDateTime).toLocaleString()}</p>
                      <p><strong>In:</strong> {new Date(r.inDateTime).toLocaleString()}</p>
                      <p className="col-span-2"><strong>Reason:</strong> {r.reason}</p>
                    </div>
                    <ApprovalTimeline chain={r.approvalChain} />
                    <Button className="mt-3 gap-2 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => handleReconsider(r.id)}>
                      <RotateCcw className="w-4 h-4" /> Reconsider & Approve
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

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
                      <StatusBadge status={c.resolved ? 'resolved' : c.status === 'escalated' ? 'escalated' : 'pending'} />
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

          <TabsContent value="history">
            {/* Search Bar */}
            <div className="card-elevated mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, register number, or room number..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {Object.keys(studentGroups).length === 0 ? (
              <div className="card-elevated text-center py-12 text-muted-foreground"><p>No past approvals</p></div>
            ) : (
              <div className="space-y-4">
                {Object.entries(studentGroups).map(([regNo, studentRequests]) => {
                  const first = studentRequests[0];
                  const isExpanded = expandedStudent === regNo;
                  return (
                    <div key={regNo} className="card-elevated">
                      <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => setExpandedStudent(isExpanded ? null : regNo)}
                      >
                        <div>
                          <h3 className="font-semibold text-foreground">{first.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {first.regNumber} | Room {first.roomNumber} | {first.institution}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{studentRequests.length} record{studentRequests.length > 1 ? 's' : ''}</Badge>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-3 border-t pt-4">
                          {studentRequests.map(r => (
                            <div key={r.id} className="bg-muted/50 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium text-foreground">{r.type === 'outing' ? 'Outing' : 'Leave'} Pass</p>
                                  <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                                </div>
                                <StatusBadge status={r.status} />
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-sm text-muted-foreground mb-2">
                                <p><strong>Out:</strong> {new Date(r.outDateTime).toLocaleString()}</p>
                                <p><strong>In:</strong> {new Date(r.inDateTime).toLocaleString()}</p>
                                <p className="col-span-2"><strong>Reason:</strong> {r.reason}</p>
                              </div>
                              <ApprovalTimeline chain={r.approvalChain} />
                              {r.status === 'approved' && (
                                <Button size="sm" variant="outline" className="mt-2 gap-1" onClick={() => downloadGatepassPDF(r)}>
                                  <Download className="w-3 h-3" /> Download PDF
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WardenDashboard;
