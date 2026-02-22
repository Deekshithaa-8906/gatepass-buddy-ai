import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { OutingRequest, UserRole } from '@/types';
import { getRequests, updateRequest, addNotification } from '@/lib/storage';
import { MapPin, CheckCircle, XCircle, Clock, FileText, ArrowLeft } from 'lucide-react';
import ProfileDropdown from '@/components/ProfileDropdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const StatusBadge = ({ status }: { status: string }) => {
  const classes =
    status === 'approved' ? 'bg-success/20 text-success border-success/30' :
    status === 'declined' ? 'bg-destructive/20 text-destructive border-destructive/30' :
    'bg-warning/20 text-warning border-warning/30';
  return <Badge className={`capitalize border ${classes}`}>{status}</Badge>;
};

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<OutingRequest[]>([]);
  const [declineReasons, setDeclineReasons] = useState<Record<string, string>>({});

  const staffRoles: UserRole[] = ['mentor', 'advisor', 'hod'];

  useEffect(() => {
    if (!user || !staffRoles.includes(user.role)) { navigate('/'); return; }
    refreshRequests();
  }, [user, navigate]);

  if (!user || !staffRoles.includes(user.role)) return null;

  const refreshRequests = () => {
    setRequests(getRequests());
  };

  const pending = requests.filter(r => r.currentApprover === user.role && r.status === 'pending');
  const pendingOuting = pending.filter(r => r.type === 'outing');
  const pendingLeave = pending.filter(r => r.type === 'leave');
  const history = requests.filter(r => r.approvalChain.some(s => s.role === user.role && s.status !== 'pending'));

  const handleApprove = (id: string) => {
    updateRequest(id, r => {
      const stepIdx = r.approvalChain.findIndex(s => s.role === user.role);
      if (stepIdx === -1) return r;
      r.approvalChain[stepIdx] = { ...r.approvalChain[stepIdx], status: 'approved', approvedBy: user.name, timestamp: new Date().toISOString() };
      const nextStep = r.approvalChain[stepIdx + 1];
      if (nextStep) {
        r.currentApprover = nextStep.role;
      } else {
        r.currentApprover = 'completed';
        r.status = 'approved';
      }
      return r;
    });
    refreshRequests();
  };

  const handleDecline = (id: string) => {
    const reason = declineReasons[id] || 'No reason provided';
    let declinedRequest: OutingRequest | null = null;
    updateRequest(id, r => {
      const stepIdx = r.approvalChain.findIndex(s => s.role === user.role);
      if (stepIdx === -1) return r;
      r.approvalChain[stepIdx] = { ...r.approvalChain[stepIdx], status: 'declined', approvedBy: user.name, reason, timestamp: new Date().toISOString() };
      r.currentApprover = 'declined';
      r.status = 'declined';
      declinedRequest = { ...r };
      return r;
    });

    if (declinedRequest) {
      const req = declinedRequest as OutingRequest;
      const roleName = user.role.charAt(0).toUpperCase() + user.role.slice(1);
      addNotification({
        id: crypto.randomUUID(),
        requestId: req.id,
        studentId: req.studentId,
        method: 'sms',
        destination: req.studentPhone,
        message: `Your gatepass request has been rejected by your ${roleName}. Please contact your ${roleName} for further details.`,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
    refreshRequests();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero text-primary-foreground py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6" />
            <span className="font-display font-bold text-lg">PassNTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-90">{user.name} ({user.role.toUpperCase()})</span>
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground capitalize">{user.role} Dashboard</h1>
        </div>

        <Tabs defaultValue="outing" className="space-y-6">
          <TabsList>
            <TabsTrigger value="outing" className="gap-1">
              <Clock className="w-4 h-4" /> Pending Outing ({pendingOuting.length})
            </TabsTrigger>
            <TabsTrigger value="leave" className="gap-1">
              <Clock className="w-4 h-4" /> Pending Leave ({pendingLeave.length})
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
              <div className="space-y-4">
                {pendingOuting.map(r => (
                  <RequestCard key={r.id} request={r} onApprove={handleApprove} onDecline={handleDecline} declineReason={declineReasons[r.id] || ''} onDeclineReasonChange={v => setDeclineReasons(p => ({ ...p, [r.id]: v }))} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leave">
            {pendingLeave.length === 0 ? (
              <div className="card-elevated text-center py-12 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No pending leave requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingLeave.map(r => (
                  <RequestCard key={r.id} request={r} onApprove={handleApprove} onDecline={handleDecline} declineReason={declineReasons[r.id] || ''} onDeclineReasonChange={v => setDeclineReasons(p => ({ ...p, [r.id]: v }))} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {history.length === 0 ? (
              <div className="card-elevated text-center py-12 text-muted-foreground">
                <p>No past approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map(r => (
                  <div key={r.id} className="card-elevated">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-foreground">{r.name} — {r.type} pass</h3>
                        <p className="text-sm text-muted-foreground">{r.year} Year, {r.branch} | {r.institution}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
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

function RequestCard({ request: r, onApprove, onDecline, declineReason, onDeclineReasonChange }: {
  request: OutingRequest;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  declineReason: string;
  onDeclineReasonChange: (v: string) => void;
}) {
  return (
    <div className="card-elevated">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-foreground text-lg">{r.name}</h3>
          <p className="text-sm text-muted-foreground">{r.type.toUpperCase()} | {r.year} Year, {r.branch}</p>
        </div>
        <Badge className="bg-warning/20 text-warning border border-warning/30">Pending Your Approval</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
        <p><strong>Institution:</strong> {r.institution}</p>
        <p><strong>Reg No:</strong> {r.regNumber}</p>
        <p><strong>Room:</strong> {r.roomNumber}</p>
        <p><strong>Student Phone:</strong> {r.studentPhone}</p>
        <p><strong>Parent Phone:</strong> {r.parentPhone}</p>
        <p><strong>Out:</strong> {new Date(r.outDateTime).toLocaleString()}</p>
        <p><strong>In:</strong> {new Date(r.inDateTime).toLocaleString()}</p>
        <p className="col-span-2"><strong>Reason:</strong> {r.reason}</p>
      </div>
      <div className="flex items-end gap-3">
        <Button className="gap-1 bg-success hover:bg-success/90 text-success-foreground" onClick={() => onApprove(r.id)}>
          <CheckCircle className="w-4 h-4" /> Approve
        </Button>
        <div className="flex-1">
          <Textarea placeholder="Reason for declining..." value={declineReason} onChange={e => onDeclineReasonChange(e.target.value)} rows={1} className="text-sm" />
        </div>
        <Button variant="destructive" className="gap-1" onClick={() => onDecline(r.id)}>
          <XCircle className="w-4 h-4" /> Decline
        </Button>
      </div>
    </div>
  );
}

export default StaffDashboard;
