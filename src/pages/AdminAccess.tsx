import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Filter,
  LogOut,
  Loader,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type DirectoryUser = {
  id?: string;
  email: string;
  role: string;
  status: string;
  access_status?: string;
  onboarding_complete?: boolean;
  password_created?: boolean;
  full_name?: string | null;
  gender?: string | null;
  department?: string | null;
  room_number?: string | null;
  created_at?: string | null;
};

const roleTabs = ['student', 'mentor', 'advisor', 'hod', 'principal'] as const;

type RoleTab = (typeof roleTabs)[number];
type GenderFilter = 'boys' | 'girls';

export function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState<'overview' | 'manage'>('overview');

  return (
    <div className="min-h-screen bg-[#f7f8fb] flex font-sans text-gray-900">
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-[#CD0000] p-2 rounded-xl shadow-sm">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Admin</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-2">
          <button
            onClick={() => setActiveMenu('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${activeMenu === 'overview' ? 'bg-[#CD0000]/10 text-[#CD0000]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Users className="w-5 h-5" />
            Account Requests
          </button>
          <button
            onClick={() => setActiveMenu('manage')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${activeMenu === 'manage' ? 'bg-[#CD0000]/10 text-[#CD0000]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <UserPlus className="w-5 h-5" />
            Manage Users
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link to="/login" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            <LogOut className="w-5 h-5" />
            Sign Out
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 h-screen overflow-auto">
        <header className="bg-white border-b border-gray-200 px-6 sm:px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{activeMenu === 'overview' ? 'Overview' : 'Manage Users'}</h1>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right leading-tight">
              <div className="font-semibold text-gray-900">System Admin</div>
              <div className="text-xs text-gray-500">admin@snsgroups.com</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#CD0000] text-white flex items-center justify-center font-bold shadow-sm">A</div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {activeMenu === 'overview' ? <OverviewTab /> : <ManageUsersTab />}
        </div>
      </main>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PendingRequestsSection />
    </div>
  );
}

function PendingRequestsSection() {
  const [requests, setRequests] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingEmail, setWorkingEmail] = useState<string | null>(null);

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from('user_directory')
      .select('email, full_name, role, department, created_at, access_status, status')
      .eq('access_status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (!error) {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
    const channel = supabase
      .channel('admin-pending-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_directory' }, loadRequests)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const approveRequest = async (email: string) => {
    setWorkingEmail(email);
    const { error } = await supabase
      .from('user_directory')
      .update({
        access_status: 'approved',
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (!error) {
      const invokeResult = await supabase.functions.invoke('admin-user-mailer', {
        body: { action: 'approved', email },
      });

      if (invokeResult.error) {
        alert('Approval saved, but the approval mailer is not configured.');
      }
    }

    if (error) {
      alert('Failed to approve request');
      console.error(error);
    }

    setWorkingEmail(null);
  };

  const rejectRequest = async (email: string) => {
    setWorkingEmail(email);
    const { error } = await supabase
      .from('user_directory')
      .update({
        access_status: 'rejected',
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (!error) {
      const invokeResult = await supabase.functions.invoke('admin-user-mailer', {
        body: { action: 'rejected', email },
      });

      if (invokeResult.error) {
        alert('Rejection saved, but the rejection mailer is not configured.');
      }
    }

    if (error) {
      alert('Failed to reject request');
      console.error(error);
    }

    setWorkingEmail(null);
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/60">
        <h2 className="text-xl font-bold text-gray-900">Pending Account Requests</h2>
        <p className="mt-1 text-sm text-gray-600">Review and approve requests received from students and other roles.</p>
      </div>

      {loading ? (
        <div className="p-12 flex items-center justify-center text-gray-600">
          <Loader className="w-5 h-5 mr-2 animate-spin" /> Loading...
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center text-gray-500">No pending requests</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">User Details</th>
                <th className="px-6 py-4 font-semibold">Requested Role</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.email} className="hover:bg-gray-50/60">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{request.full_name || 'New Applicant'}</div>
                    <div className="text-sm text-gray-500">{request.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#CD0000]/10 text-[#CD0000] capitalize">
                      {request.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{request.department || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{request.created_at ? new Date(request.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={workingEmail !== null}
                        onClick={() => approveRequest(request.email)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                        title="Approve"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        disabled={workingEmail !== null}
                        onClick={() => rejectRequest(request.email)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        title="Reject"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ManageUsersTab() {
  const [activeTab, setActiveTab] = useState<'verify' | 'directory'>('verify');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex gap-2 p-1.5 bg-gray-200/50 rounded-xl w-fit border border-gray-200 shadow-sm">
        <button
          onClick={() => setActiveTab('verify')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'verify' ? 'bg-white text-[#CD0000] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Verify & Add Users
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'directory' ? 'bg-white text-[#CD0000] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Manage Accounts Directory
        </button>
      </div>

      {activeTab === 'verify' ? <VerifyAndAddUsersSection /> : <DirectorySection />}
    </div>
  );
}

function VerifyAndAddUsersSection() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleTab>('student');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [verifiedUsers, setVerifiedUsers] = useState<DirectoryUser[]>([]);
  const [loadingVerified, setLoadingVerified] = useState(true);

  const loadVerifiedUsers = async () => {
    const { data, error } = await supabase
      .from('user_directory')
      .select('email, full_name, role, department, room_number, created_at, access_status, onboarding_complete, status')
      .eq('access_status', 'approved')
      .eq('onboarding_complete', false)
      .order('created_at', { ascending: false });

    if (!error) {
      setVerifiedUsers(data || []);
    }
    setLoadingVerified(false);
  };

  useEffect(() => {
    loadVerifiedUsers();
    const channel = supabase
      .channel('admin-verified-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_directory' }, loadVerifiedUsers)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setMessage('Email address is required');
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    const invokeResult = await supabase.functions.invoke('admin-user-mailer', {
      body: {
        action: 'manual_add',
        email: trimmedEmail,
        role,
      },
    });

    if (invokeResult.error) {
      setMessage(invokeResult.error.message || 'Unable to add user.');
      setIsError(true);
      setLoading(false);
      return;
    }

    setEmail('');
    setRole('student');
    setMessage('User verified successfully. The create-password email has been sent.');
    setIsError(false);
    await loadVerifiedUsers();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/60">
          <h2 className="text-xl font-bold text-gray-900">Pre-Approve Accounts</h2>
          <p className="mt-1 text-sm text-gray-600">Enter the user&apos;s Gmail domain address and assign their role. These verified users can then create an account, and their role will be fixed in the onboarding details.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid gap-4 lg:grid-cols-[1.3fr_1fr_auto] items-end">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Email Address (Domain Gmail)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@snsgroups.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Assign Role</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleTab)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 outline-none appearance-none transition-all cursor-pointer"
              >
                <option value="student">Student</option>
                <option value="mentor">Teacher</option>
                <option value="advisor">Advisor</option>
                <option value="hod">HOD</option>
                <option value="principal">Principal</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#CD0000] text-white font-bold shadow-sm hover:bg-[#b50000] disabled:opacity-60 transition-all"
          >
            {loading ? 'Adding...' : 'Verify & Add User'}
          </button>
        </form>

        {message && (
          <div className={`mx-6 mb-6 p-3 rounded-xl text-sm font-semibold ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recently Verified Users</h2>
            <p className="mt-1 text-sm text-gray-600">These users are approved, but still have onboarding pending.</p>
          </div>
          <span className="px-2.5 py-1 bg-[#CD0000] text-white text-xs font-bold rounded-full">{verifiedUsers.length}</span>
        </div>

        {loadingVerified ? (
          <div className="p-10 flex items-center justify-center text-gray-600">
            <Loader className="w-5 h-5 mr-2 animate-spin" /> Loading...
          </div>
        ) : verifiedUsers.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No recently verified users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">User Details</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Department</th>
                  <th className="px-6 py-4 font-semibold">Room No.</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {verifiedUsers.map((user) => (
                  <tr key={user.email} className="hover:bg-gray-50/60">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{user.full_name || 'Verified User'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 capitalize">{user.role}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.department || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.room_number || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Not Onboarded</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={async () => {
                          const { error } = await supabase.functions.invoke('admin-user-mailer', {
                            body: { action: 'resend_create_password', email: user.email },
                          });
                          if (error) {
                            alert('Unable to resend create-password email.');
                          }
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-[#CD0000] hover:bg-[#CD0000]/10"
                      >
                        <RefreshCw className="w-4 h-4" /> Resend Link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function DirectorySection() {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<RoleTab>('student');
  const [studentGender, setStudentGender] = useState<GenderFilter>('boys');
  const [department, setDepartment] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [searchText, setSearchText] = useState('');

  const departments = ['CSE', 'CSD', 'CST', 'MECH', 'MCT', 'IT', 'AIDS', 'AIML'];

  const loadDirectory = async () => {
    const { data, error } = await supabase
      .from('user_directory')
      .select('email, full_name, role, gender, department, room_number, status, access_status, onboarding_complete, created_at')
      .eq('access_status', 'approved')
      .order('created_at', { ascending: false });

    if (!error) {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDirectory();
    const channel = supabase
      .channel('admin-directory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_directory' }, loadDirectory)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedRoom = roomNumber.trim().toLowerCase();
    const normalizedSearch = searchText.trim().toLowerCase();

    return users.filter((user) => {
      if (user.role !== activeRole) return false;
      if (department && (user.department || '') !== department) return false;

      if (activeRole === 'student') {
        const gender = (user.gender || '').toLowerCase();
        if (studentGender === 'boys' && !['male', 'm', 'boy', 'boys'].includes(gender)) return false;
        if (studentGender === 'girls' && !['female', 'f', 'girl', 'girls'].includes(gender)) return false;
        if (normalizedRoom && (user.room_number || '').toLowerCase() !== normalizedRoom) return false;
      }

      if (normalizedSearch) {
        const text = `${user.full_name || ''} ${user.email}`.toLowerCase();
        if (!text.includes(normalizedSearch)) return false;
      }

      return true;
    });
  }, [users, activeRole, studentGender, department, roomNumber, searchText]);

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50/60">
        {roleTabs.map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`px-7 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeRole === role ? 'border-[#CD0000] text-[#CD0000] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            {role === 'student' ? 'Students' : role === 'mentor' ? 'Mentors' : role === 'advisor' ? 'Advisor' : role === 'hod' ? 'HOD' : 'Principal'}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeRole === 'student' ? (
          <>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between mb-5">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Manage Students ({studentGender === 'boys' ? 'Boys' : 'Girls'})</h3>
                <div className="mt-4 inline-flex p-1 rounded-xl bg-gray-100 border border-gray-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setStudentGender('boys')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${studentGender === 'boys' ? 'bg-white text-[#CD0000] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Boys
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentGender('girls')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${studentGender === 'girls' ? 'bg-white text-[#CD0000] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Girls
                  </button>
                </div>
              </div>

              <div className="grid gap-3 w-full xl:w-auto xl:grid-cols-3">
                <div className="relative">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full xl:w-56 pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20"
                  >
                    <option value="">All Departments</option>
                    {departments.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="All Rooms"
                    className="w-full xl:w-40 pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20"
                  />
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search accounts..."
                    className="w-full xl:w-80 pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between mb-5">
            <h3 className="text-2xl font-bold text-gray-900">Manage {roleLabel(activeRole)}s</h3>
            <div className="relative w-full xl:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search accounts..."
                className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20"
              />
            </div>
          </div>
        )}

        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-10 flex items-center justify-center text-gray-600">
              <Loader className="w-5 h-5 mr-2 animate-spin" /> Loading...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="px-6 py-4 font-semibold">User Details</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold">Department</th>
                    {activeRole === 'student' && <th className="px-6 py-4 font-semibold">Room No.</th>}
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={activeRole === 'student' ? 5 : 4} className="px-6 py-10 text-center text-gray-500">
                        No users found for selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.email} className="hover:bg-gray-50/60">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{user.full_name || 'User'}</div>
                          <div className="text-sm text-gray-500">{user.email}{user.gender ? ` • ${user.gender}` : ''}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700 capitalize">{user.role}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{user.department || '-'}</td>
                        {activeRole === 'student' && <td className="px-6 py-4 text-sm text-gray-700">{user.room_number || '-'}</td>}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${user.onboarding_complete ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {user.onboarding_complete ? 'Active' : 'Not Onboarded'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function roleLabel(role: RoleTab) {
  if (role === 'mentor') return 'Teacher';
  return role.charAt(0).toUpperCase() + role.slice(1);
}
