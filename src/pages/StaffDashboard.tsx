import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import { MapPin, CheckCircle, XCircle, Clock, FileText, ArrowLeft, RotateCcw, AlertCircle } from 'lucide-react';
import ProfileDropdown from '@/components/ProfileDropdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const StatusBadge = ({ status }: { status: string }) => {
  const classes =
    status === 'approved' ? 'bg-success/20 text-success border-success/30' :
    status === 'rejected' ? 'bg-destructive/20 text-destructive border-destructive/30' :
    'bg-warning/20 text-warning border-warning/30';
  return <Badge className={`capitalize border ${classes}`}>{status}</Badge>;
};

interface PassRequest {
  id: string;
  student_email: string;
  student_name: string;
  mentor_email: string;
  destination: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approval_chain: string[];
  current_approver: string;
  mentor_status?: string;
  advisor_status?: string;
  hod_status?: string;
  departure_datetime?: string;
  return_datetime?: string;
  departure_date?: string;
  return_date?: string;
  rejection_reason?: string;
  type: 'outing' | 'leave';
}

const StaffDashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [outingRequests, setOutingRequests] = useState<PassRequest[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<PassRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [declineReasons, setDeclineReasons] = useState<Record<string, string>>({});
  const [approving, setApproving] = useState<string | null>(null);

  const staffRoles: UserRole[] = ['staff', 'mentor', 'advisor', 'hod'];
  const currentRole = (profile?.role as UserRole | undefined);
  const approvalRole = currentRole === 'staff' ? 'mentor' : currentRole;
  const actorName = profile?.full_name || profile?.email || 'Staff';
  const dashboardRoleLabel = currentRole === 'hod' ? 'HOD' : 'STAFF';

  useEffect(() => {
    if (authLoading) return;
    if (!approvalRole || !staffRoles.includes(currentRole)) { 
      navigate('/'); 
      return; 
    }
    loadRequests();
  }, [authLoading, currentRole, approvalRole, navigate, user?.email]);

  if (authLoading) return null;
  if (!currentRole || !approvalRole || !staffRoles.includes(currentRole)) return null;

  const loadRequests = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      // Load outing requests
      let outingQuery = supabase
        .from('outing_requests')
        .select('*')
        .eq('current_approver', approvalRole)
        .order('created_at', { ascending: false });

      if (approvalRole === 'mentor' && user?.email) {
        outingQuery = outingQuery.eq('mentor_email', user.email);
      }

      const { data: outings, error: outingErr } = await outingQuery;

      if (outingErr) {
        console.error('Error loading outing requests:', outingErr);
      } else {
        setOutingRequests((outings || []).map(r => ({ ...r, type: 'outing' as const })));
      }

      // Load leave requests
      let leaveQuery = supabase
        .from('leave_requests')
        .select('*')
        .eq('current_approver', approvalRole)
        .order('created_at', { ascending: false });

      if (approvalRole === 'mentor' && user?.email) {
        leaveQuery = leaveQuery.eq('mentor_email', user.email);
      }

      const { data: leaves, error: leaveErr } = await leaveQuery;

      if (leaveErr) {
        console.error('Error loading leave requests:', leaveErr);
      } else {
        setLeaveRequests((leaves || []).map(r => ({ ...r, type: 'leave' as const })));
      }
    } finally {
      setLoading(false);
    }
  };

  const getPendingRequests = (type: 'outing' | 'leave') => {
    const requests = type === 'outing' ? outingRequests : leaveRequests;
    return requests.filter(r => r.status === 'pending' && r.current_approver === approvalRole);
  };

  const handleApprove = async (id: string, type: 'outing' | 'leave') => {
    setApproving(id);
    try {
      const table = type === 'outing' ? 'outing_requests' : 'leave_requests';
      const actorRole = approvalRole;
      const statusField = `${actorRole}_status` as any;
      
      // Update the status for this role
      const updateData: any = {
        [statusField]: 'approved',
        approved_by: actorName,
      };

      // Determine next approver - currently just 'mentor' in chain
      // In future, could be ['mentor', 'advisor', 'hod']
      const nextApprovers: Record<string, string | null> = {
        'mentor': 'advisor', // After mentor approves, goes to advisor
        'advisor': 'hod',    // After advisor approves, goes to hod
        'hod': null,         // After hod approves, done
      };

      const nextApprover = nextApprovers[actorRole];
      
      updateData.current_approver = nextApprover || null;
      updateData.status = nextApprover ? 'pending' : 'approved';

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', id);

      if (error) {
        alert('Failed to approve request: ' + error.message);
        return;
      }

      alert('Request approved successfully!');
      await loadRequests();
    } finally {
      setApproving(null);
    }
  };

  const handleDecline = async (id: string, type: 'outing' | 'leave') => {
    const reason = declineReasons[id] || 'No reason provided';
    
    if (!reason.trim()) {
      alert('Please provide a reason for declining');
      return;
    }

    setApproving(id);
    try {
      const table = type === 'outing' ? 'outing_requests' : 'leave_requests';
      const actorRole = approvalRole;
      const statusField = `${actorRole}_status` as any;

      const { error } = await supabase
        .from(table)
        .update({
          [statusField]: 'rejected',
          rejected_by: actorName,
          rejection_reason: reason,
          current_approver: null,
          status: 'rejected',
        })
        .eq('id', id);

      if (error) {
        alert('Failed to decline request: ' + error.message);
        return;
      }

      setDeclineReasons(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      alert('Request declined and student has been notified.');
      await loadRequests();
    } finally {
      setApproving(null);
    }
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
            <span className="text-sm opacity-90">{actorName} ({dashboardRoleLabel})</span>
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">{dashboardRoleLabel === 'HOD' ? 'HOD Dashboard' : 'Staff Dashboard'}</h1>
        </div>

        {loading ? (
          <div className="card-elevated text-center py-12">
            <p className="text-muted-foreground">Loading requests...</p>
          </div>
        ) : (
          <Tabs defaultValue="outing" className="space-y-6">
            <TabsList className="flex flex-wrap gap-1">
              <TabsTrigger value="outing" className="gap-1">
                <Clock className="w-4 h-4" /> Pending Outing ({getPendingRequests('outing').length})
              </TabsTrigger>
              <TabsTrigger value="leave" className="gap-1">
                <Clock className="w-4 h-4" /> Pending Leave ({getPendingRequests('leave').length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1">
                <FileText className="w-4 h-4" /> History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="outing">
              {getPendingRequests('outing').length === 0 ? (
                <div className="card-elevated text-center py-12 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No pending outing requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getPendingRequests('outing').map(r => (
                    <RequestCard 
                      key={r.id} 
                      request={r} 
                      onApprove={handleApprove} 
                      onDecline={handleDecline} 
                      declineReason={declineReasons[r.id] || ''} 
                      onDeclineReasonChange={v => setDeclineReasons(p => ({ ...p, [r.id]: v }))}
                      approving={approving === r.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="leave">
              {getPendingRequests('leave').length === 0 ? (
                <div className="card-elevated text-center py-12 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No pending leave requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getPendingRequests('leave').map(r => (
                    <RequestCard 
                      key={r.id} 
                      request={r} 
                      onApprove={handleApprove} 
                      onDecline={handleDecline} 
                      declineReason={declineReasons[r.id] || ''} 
                      onDeclineReasonChange={v => setDeclineReasons(p => ({ ...p, [r.id]: v }))}
                      approving={approving === r.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {outingRequests.filter(r => r.status !== 'pending').length === 0 && leaveRequests.filter(r => r.status !== 'pending').length === 0 ? (
                <div className="card-elevated text-center py-12 text-muted-foreground">
                  <p>No past approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...outingRequests, ...leaveRequests].filter(r => r.status !== 'pending').map(r => (
                    <div key={r.id} className="card-elevated">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-foreground">{r.student_name} — {r.type} pass</h3>
                          <p className="text-sm text-muted-foreground">{r.student_email}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <p><strong>Destination:</strong> {r.destination}</p>
                        <p><strong>Reason:</strong> {r.reason}</p>
                        {r.rejection_reason && (
                          <>
                            <div className="flex gap-2 items-start mt-3 p-3 bg-red-50 rounded border border-red-200">
                              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                              <div>
                                <p className="font-semibold text-red-900">Rejection Reason</p>
                                <p className="text-red-800">{r.rejection_reason}</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

function RequestCard({ 
  request: r, 
  onApprove, 
  onDecline, 
  declineReason, 
  onDeclineReasonChange,
  approving
}: {
  request: PassRequest;
  onApprove: (id: string, type: 'outing' | 'leave') => void;
  onDecline: (id: string, type: 'outing' | 'leave') => void;
  declineReason: string;
  onDeclineReasonChange: (v: string) => void;
  approving: boolean;
}) {
  return (
    <div className="card-elevated">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-foreground text-lg">{r.student_name}</h3>
          <p className="text-sm text-muted-foreground">{r.type.toUpperCase()} | {r.student_email}</p>
        </div>
        <Badge className="bg-warning/20 text-warning border border-warning/30">Pending Your Approval</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground mb-4">
        <p><strong>Destination:</strong> {r.destination}</p>
        <p><strong>Status:</strong> {r.status}</p>
        <p className="col-span-2"><strong>Reason:</strong> {r.reason}</p>
        {r.type === 'outing' && r.departure_datetime && (
          <>
            <p><strong>Departure:</strong> {new Date(r.departure_datetime).toLocaleString()}</p>
            <p><strong>Return:</strong> {new Date(r.return_datetime || '').toLocaleString()}</p>
          </>
        )}
        {r.type === 'leave' && r.departure_date && (
          <>
            <p><strong>From:</strong> {r.departure_date}</p>
            <p><strong>To:</strong> {r.return_date}</p>
          </>
        )}
      </div>
      <div className="flex items-end gap-3 mt-3">
        <Button 
          className="gap-1 bg-success hover:bg-success/90 text-success-foreground"
          onClick={() => onApprove(r.id, r.type)}
          disabled={approving}
        >
          <CheckCircle className="w-4 h-4" /> Approve
        </Button>
        <div className="flex-1">
          <Textarea 
            placeholder="Reason for declining..." 
            value={declineReason} 
            onChange={e => onDeclineReasonChange(e.target.value)} 
            rows={1} 
            className="text-sm"
            disabled={approving}
          />
        </div>
        <Button 
          variant="destructive" 
          className="gap-1" 
          onClick={() => onDecline(r.id, r.type)}
          disabled={approving}
        >
          <XCircle className="w-4 h-4" /> Decline
        </Button>
      </div>
    </div>
  );
}

export default StaffDashboard;
