import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Complaint } from '@/types';
import { getComplaints, saveComplaints, checkAndEscalateComplaints } from '@/lib/storage';
import { MapPin, AlertTriangle, Bell, CheckCheck, ArrowLeft, Clock, Eye, ShieldAlert } from 'lucide-react';
import ProfileDropdown from '@/components/ProfileDropdown';
import ComplaintTimeline from '@/components/ComplaintTimeline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

const ComplaintStatusBadge = ({ status }: { status: string }) => {
  const classes =
    status === 'resolved' ? 'bg-success/20 text-success border-success/30' :
    status === 'escalated_management' ? 'bg-destructive/20 text-destructive border-destructive/30' :
    status === 'escalated' ? 'bg-orange-500/20 text-orange-600 border-orange-500/30' :
    'bg-warning/20 text-warning border-warning/30';
  const label =
    status === 'escalated_management' ? 'Escalated to Management' :
    status === 'escalated' ? 'Escalated to Principal' : status;
  return <Badge className={`capitalize border ${classes}`}>{label}</Badge>;
};

const ManagementDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'management') { navigate('/'); return; }
    checkAndEscalateComplaints();
    refreshData();
  }, [user, navigate]);

  if (!user || user.role !== 'management') return null;

  const refreshData = () => {
    setComplaints(getComplaints().filter(c => c.status === 'escalated_management'));
  };

  const handleResolve = (id: string) => {
    const all = getComplaints();
    const idx = all.findIndex(c => c.id === id);
    if (idx !== -1) {
      all[idx].resolved = true;
      all[idx].resolvedAt = new Date().toISOString();
      all[idx].resolvedBy = 'Management';
      all[idx].status = 'resolved';
      all[idx].underReview = false;
      saveComplaints(all);
    }
    refreshData();
  };

  const handleUnderReview = (id: string) => {
    const all = getComplaints();
    const idx = all.findIndex(c => c.id === id);
    if (idx !== -1) {
      all[idx].underReview = true;
      saveComplaints(all);
    }
    refreshData();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-background"
    >
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="gradient-hero text-primary-foreground py-4 px-6"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6" />
            <span className="font-display font-bold text-lg">PassNTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-90">{user.name} (MANAGEMENT)</span>
            <ProfileDropdown />
          </div>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" className="gap-2 hover:scale-105 transition-transform" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">Management Dashboard</h1>
        </div>

        <Tabs defaultValue="escalated" className="space-y-6">
          <TabsList>
            <TabsTrigger value="escalated" className="gap-1">
              <ShieldAlert className="w-4 h-4" /> Escalated Complaints ({complaints.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="escalated">
            {complaints.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card-elevated text-center py-12 text-muted-foreground"
              >
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No complaints escalated to management at this time.</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {complaints.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="card-elevated border-l-4 border-l-destructive"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{c.name} — Room {c.roomNumber}</h3>
                        {c.institution && <p className="text-xs text-muted-foreground">{c.institution}</p>}
                        <p className="text-xs text-muted-foreground">Submitted: {new Date(c.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.underReview && <Badge className="bg-blue-500/20 text-blue-600 border border-blue-500/30">Under Review</Badge>}
                        <ComplaintStatusBadge status={c.status} />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{c.text}</p>

                    <ComplaintTimeline complaint={c} />

                    {!c.resolved && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="gap-1 bg-success hover:bg-success/90 text-success-foreground hover:scale-105 transition-transform" onClick={() => handleResolve(c.id)}>
                          <CheckCheck className="w-4 h-4" /> Resolve
                        </Button>
                        {!c.underReview && (
                          <Button size="sm" variant="outline" className="gap-1 hover:scale-105 transition-transform" onClick={() => handleUnderReview(c.id)}>
                            <Eye className="w-4 h-4" /> Mark Under Review
                          </Button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </motion.div>
  );
};

export default ManagementDashboard;
