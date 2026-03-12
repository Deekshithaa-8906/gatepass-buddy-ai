import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Complaint, PrincipalNotification } from '@/types';
import { getComplaints, checkAndEscalateComplaints, getPrincipalNotifications, markPrincipalNotificationRead, resolveComplaint } from '@/lib/storage';
import { MapPin, AlertTriangle, Bell, CheckCheck, ArrowLeft, Clock } from 'lucide-react';
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

const PrincipalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<PrincipalNotification[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'principal') { navigate('/'); return; }
    checkAndEscalateComplaints();
    refreshData();
  }, [user, navigate]);

  if (!user || user.role !== 'principal') return null;

  const refreshData = () => {
    setComplaints(getComplaints().filter(c => c.status === 'escalated' || c.status === 'escalated_management'));
    setNotifications(getPrincipalNotifications());
  };

  const handleResolve = (id: string) => {
    resolveComplaint(id, 'Principal');
    refreshData();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
            <span className="text-sm opacity-90">{user.name} (PRINCIPAL)</span>
            <ProfileDropdown />
          </div>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" className="gap-2 hover:scale-105 transition-transform" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">Principal Dashboard</h1>
        </div>

        <Tabs defaultValue="escalated" className="space-y-6">
          <TabsList>
            <TabsTrigger value="escalated" className="gap-1">
              <AlertTriangle className="w-4 h-4" /> Escalated Complaints ({complaints.length})
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 relative">
              <Bell className="w-4 h-4" /> Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">{unreadCount}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="escalated">
            {complaints.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-elevated text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No escalated complaints at this time.</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {complaints.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`card-elevated border-l-4 ${c.status === 'escalated_management' ? 'border-l-destructive' : 'border-l-orange-500'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{c.name} — Room {c.roomNumber}</h3>
                        <p className="text-xs text-muted-foreground">Submitted: {new Date(c.createdAt).toLocaleString()}</p>
                        {c.escalatedAt && (
                          <p className="text-xs text-orange-600">Escalated to Principal: {new Date(c.escalatedAt).toLocaleString()}</p>
                        )}
                        {c.escalatedToManagementAt && (
                          <p className="text-xs text-destructive">Escalated to Management: {new Date(c.escalatedToManagementAt).toLocaleString()}</p>
                        )}
                      </div>
                      <ComplaintStatusBadge status={c.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{c.text}</p>
                    <ComplaintTimeline complaint={c} />
                    {!c.resolved && c.status === 'escalated' && (
                      <Button size="sm" className="gap-1 bg-success hover:bg-success/90 text-success-foreground mt-3 hover:scale-105 transition-transform" onClick={() => handleResolve(c.id)}>
                        <CheckCheck className="w-4 h-4" /> Resolve
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications">
            {notifications.length === 0 ? (
              <div className="card-elevated text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.sort((a, b) => new Date(b.escalatedAt).getTime() - new Date(a.escalatedAt).getTime()).map(n => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`card-elevated border-l-4 border-l-orange-500 ${!n.read ? 'ring-1 ring-primary/20' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <span className="text-sm font-semibold text-foreground">Escalated Complaint</span>
                        {!n.read && <Badge className="bg-warning/20 text-warning border border-warning/30 text-xs">New</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(n.escalatedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-foreground bg-muted p-3 rounded-lg">
                      Complaint from <strong>{n.studentName}</strong> (Room {n.roomNumber}): "{n.complaintText.slice(0, 100)}{n.complaintText.length > 100 ? '...' : ''}"
                    </p>
                    {!n.read && (
                      <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => { markPrincipalNotificationRead(n.id); refreshData(); }}>
                        Mark as read
                      </Button>
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

export default PrincipalDashboard;
