import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '@/types';
import { MapPin, ArrowLeft, UserCheck, UserX, Users, Shield, Edit2, Search } from 'lucide-react';
import ProfileDropdown from '@/components/ProfileDropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

function getUsers(): User[] {
  return JSON.parse(localStorage.getItem('gatepass_users') || '[]');
}
function saveUsers(users: User[]) {
  localStorage.setItem('gatepass_users', JSON.stringify(users));
}

const STAFF_ROLES: { value: UserRole; label: string }[] = [
  { value: 'mentor', label: 'Mentor' },
  { value: 'advisor', label: 'Advisor' },
  { value: 'hod', label: 'HOD' },
  { value: 'warden', label: 'Warden' },
  { value: 'principal', label: 'Principal' },
  { value: 'management', label: 'Management' },
];

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'approved') return <Badge className="bg-success/20 text-success border border-success/30">Approved</Badge>;
  if (status === 'rejected') return <Badge className="bg-destructive/20 text-destructive border border-destructive/30">Rejected</Badge>;
  return <Badge className="bg-warning/20 text-warning border border-warning/30">Pending</Badge>;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editHostelBlock, setEditHostelBlock] = useState('');
  const [editRegNumber, setEditRegNumber] = useState('');

  // Create staff account state
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('mentor');

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    refreshData();
  }, [user, navigate]);

  const refreshData = () => setAllUsers(getUsers());

  if (!user || user.role !== 'admin') return null;

  const pendingStudents = allUsers.filter(u => u.role === 'student' && (!u.accountStatus || u.accountStatus === 'pending'));
  const approvedUsers = allUsers.filter(u => u.accountStatus === 'approved' || (u.role !== 'student' && u.role !== 'admin'));
  const filteredUsers = allUsers.filter(u => u.role !== 'admin' && (
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search) ||
    (u.regNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  ));

  const handleApprove = (id: string) => {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) { users[idx].accountStatus = 'approved'; saveUsers(users); }
    refreshData();
    toast({ title: 'Student Approved', description: 'The student can now login.' });
  };

  const handleReject = (id: string) => {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) { users[idx].accountStatus = 'rejected'; saveUsers(users); }
    refreshData();
    toast({ title: 'Student Rejected', variant: 'destructive' });
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setEditName(u.name);
    setEditPhone(u.phone);
    setEditEmail(u.email);
    setEditDept(u.department || '');
    setEditRoomNumber(u.roomNumber || '');
    setEditHostelBlock(u.hostelBlock || '');
    setEditRegNumber(u.regNumber || '');
  };

  const saveEdit = () => {
    if (!editUser) return;
    const users = getUsers();
    const idx = users.findIndex(u => u.id === editUser.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], name: editName, phone: editPhone, email: editEmail, department: editDept, roomNumber: editRoomNumber, hostelBlock: editHostelBlock, regNumber: editRegNumber };
      saveUsers(users);
    }
    setEditUser(null);
    refreshData();
    toast({ title: 'User Updated' });
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getUsers();
    if (users.find(u => u.phone === staffPhone || u.email === staffEmail)) {
      toast({ title: 'Error', description: 'Phone or email already exists', variant: 'destructive' });
      return;
    }
    const newUser: User = {
      id: crypto.randomUUID(), name: staffName, phone: staffPhone, email: staffEmail,
      password: staffPassword, role: staffRole, accountStatus: 'approved',
    };
    users.push(newUser);
    saveUsers(users);
    setStaffName(''); setStaffPhone(''); setStaffEmail(''); setStaffPassword('');
    refreshData();
    toast({ title: 'Staff Account Created' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="min-h-screen bg-background">
      <motion.header initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="gradient-hero text-primary-foreground py-4 px-6 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6" />
            <span className="font-display font-bold text-lg">PassNTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-90">{user.name} (ADMIN)</span>
            <ProfileDropdown />
          </div>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" className="gap-2 hover:scale-105 transition-transform" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending Approvals', count: pendingStudents.length, icon: Shield, color: 'text-warning' },
            { label: 'Approved Users', count: approvedUsers.length, icon: UserCheck, color: 'text-success' },
            { label: 'Total Users', count: allUsers.filter(u => u.role !== 'admin').length, icon: Users, color: 'text-primary' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card-elevated flex items-center gap-4">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.count}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1"><Shield className="w-4 h-4" /> Pending ({pendingStudents.length})</TabsTrigger>
            <TabsTrigger value="all" className="gap-1"><Users className="w-4 h-4" /> All Users</TabsTrigger>
            <TabsTrigger value="create" className="gap-1"><UserCheck className="w-4 h-4" /> Create Staff</TabsTrigger>
          </TabsList>

          {/* Pending Students */}
          <TabsContent value="pending">
            {pendingStudents.length === 0 ? (
              <div className="card-elevated text-center py-12 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No pending registrations.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingStudents.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card-elevated border-l-4 border-l-warning">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground text-lg">{s.name}</h3>
                        <p className="text-sm text-muted-foreground">Phone: {s.phone} | Email: {s.email}</p>
                        {s.regNumber && <p className="text-sm text-muted-foreground">Reg: {s.regNumber}</p>}
                        {s.department && <p className="text-sm text-muted-foreground">Dept: {s.department}</p>}
                        {s.roomNumber && <p className="text-sm text-muted-foreground">Room: {s.roomNumber} | Block: {s.hostelBlock}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={s.accountStatus || 'pending'} />
                        <Button size="sm" className="gap-1 bg-success hover:bg-success/90 text-success-foreground hover:scale-105 transition-transform" onClick={() => handleApprove(s.id)}>
                          <UserCheck className="w-4 h-4" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1 hover:scale-105 transition-transform" onClick={() => handleReject(s.id)}>
                          <UserX className="w-4 h-4" /> Reject
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 hover:scale-105 transition-transform" onClick={() => openEdit(s)}>
                          <Edit2 className="w-4 h-4" /> Edit
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* All Users */}
          <TabsContent value="all">
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by name, phone, email, reg number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3">Phone</th>
                    <th className="py-2 px-3">Email</th>
                    <th className="py-2 px-3">Reg No</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-2 px-3 font-medium text-foreground">{u.name}</td>
                      <td className="py-2 px-3 capitalize">{u.role}</td>
                      <td className="py-2 px-3">{u.phone}</td>
                      <td className="py-2 px-3">{u.email}</td>
                      <td className="py-2 px-3">{u.regNumber || '-'}</td>
                      <td className="py-2 px-3"><StatusBadge status={u.accountStatus || (u.role === 'student' ? 'pending' : 'approved')} /></td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          {u.role === 'student' && u.accountStatus !== 'approved' && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-success hover:scale-105 transition-transform" onClick={() => handleApprove(u.id)}>Approve</Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs hover:scale-105 transition-transform" onClick={() => openEdit(u)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Create Staff */}
          <TabsContent value="create">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-elevated max-w-lg">
              <h3 className="text-xl font-display font-bold text-foreground mb-4">Create Staff / Authority Account</h3>
              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={staffName} onChange={e => setStaffName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input type="tel" value={staffPhone} onChange={e => setStaffPhone(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={staffRole} onValueChange={v => setStaffRole(v as UserRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAFF_ROLES.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="btn-hero w-full gap-2">
                  <UserCheck className="w-4 h-4" /> Create Account
                </Button>
              </form>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Dialog */}
      {editUser && (
        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User: {editUser.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={editPhone} onChange={e => setEditPhone(e.target.value)} /></div>
              <div><Label>Email</Label><Input value={editEmail} onChange={e => setEditEmail(e.target.value)} /></div>
              <div><Label>Reg Number</Label><Input value={editRegNumber} onChange={e => setEditRegNumber(e.target.value)} /></div>
              <div><Label>Department</Label><Input value={editDept} onChange={e => setEditDept(e.target.value)} /></div>
              <div><Label>Room Number</Label><Input value={editRoomNumber} onChange={e => setEditRoomNumber(e.target.value)} /></div>
              <div><Label>Hostel Block</Label><Input value={editHostelBlock} onChange={e => setEditHostelBlock(e.target.value)} /></div>
              <Button className="w-full btn-hero" onClick={saveEdit}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};

export default AdminDashboard;
