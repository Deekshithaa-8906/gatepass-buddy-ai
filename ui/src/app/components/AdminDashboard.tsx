import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Check, 
  X,
  Building,
  Mail,
  MoreVertical,
  LogOut
} from 'lucide-react';
import { Link } from 'react-router';

export function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState('overview'); // 'overview' | 'manage'
  
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-20 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-[#CD0000] p-2 rounded-xl shadow-sm">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveMenu('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeMenu === 'overview' ? 'bg-[#CD0000]/10 text-[#CD0000]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Users className="w-5 h-5" />
            Account Requests
          </button>
          <button 
            onClick={() => setActiveMenu('manage')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeMenu === 'manage' ? 'bg-[#CD0000]/10 text-[#CD0000]' : 'text-gray-600 hover:bg-gray-100'}`}
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
      </div>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-auto bg-gray-50/50 flex flex-col relative">
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            {activeMenu === 'overview' ? 'Overview' : 'Manage Users'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-gray-900">System Admin</div>
              <div className="text-xs text-gray-500">admin@snsgroups.com</div>
            </div>
            <div className="w-10 h-10 bg-[#CD0000] rounded-full flex items-center justify-center text-white font-bold shadow-sm">
              A
            </div>
          </div>
        </header>
        
        <div className="p-8 flex-1">
          {activeMenu === 'overview' && <OverviewTab />}
          {activeMenu === 'manage' && <ManageUsersTab />}
        </div>
      </main>
    </div>
  );
}

function OverviewTab() {
  const mockRequests = [
    { id: 1, name: 'Arun Kumar', email: 'arun.k@snsgroups.com', requestedRole: 'Student', date: '2026-03-24', dept: 'CSE' },
    { id: 2, name: 'Priya Raj', email: 'priya.r@snsgroups.com', requestedRole: 'Student', date: '2026-03-24', dept: 'IT' },
    { id: 3, name: 'Dr. Senthil', email: 'senthil@snsgroups.com', requestedRole: 'Mentor', date: '2026-03-23', dept: 'MECH' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Pending Account Requests</h2>
          <p className="text-sm text-gray-500 mt-1">Review and approve requests received from students and other roles.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
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
            {mockRequests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{req.name}</div>
                  <div className="text-sm text-gray-500">{req.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#CD0000]/10 text-[#CD0000]">
                    {req.requestedRole}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{req.dept}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{req.date}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-200" title="Approve">
                      <Check className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200" title="Reject">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ManageUsersTab() {
  const [subTab, setSubTab] = useState('pre-approve'); // 'pre-approve' | 'directory'
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex gap-2 p-1.5 bg-gray-200/50 rounded-xl w-fit border border-gray-200">
        <button 
          onClick={() => setSubTab('pre-approve')} 
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${subTab === 'pre-approve' ? 'bg-white text-[#CD0000] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Verify & Add Users
        </button>
        <button 
          onClick={() => setSubTab('directory')} 
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${subTab === 'directory' ? 'bg-white text-[#CD0000] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Manage Accounts Directory
        </button>
      </div>
      
      {subTab === 'pre-approve' ? <PreApproveSection /> : <DirectorySection />}
    </div>
  )
}

function PreApproveSection() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#CD0000]/5 to-transparent rounded-bl-full pointer-events-none" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pre-Approve Accounts</h2>
        <p className="text-sm text-gray-500 mb-8 max-w-2xl">
          Enter the user's Gmail domain address and assign their role. These verified users can then create an account, and their role will be fixed in the onboarding details.
        </p>
        
        <form className="flex flex-col sm:flex-row gap-5 items-end max-w-4xl" onSubmit={(e) => e.preventDefault()}>
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-semibold text-gray-700 ml-1">Email Address (Domain Gmail)</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="email" 
                placeholder="user@snsgroups.com" 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CD0000]/20 focus:border-[#CD0000] outline-none transition-all text-sm font-medium" 
                required
              />
            </div>
          </div>
          <div className="w-full sm:w-64 space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Assign Role</label>
            <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CD0000]/20 focus:border-[#CD0000] outline-none transition-all appearance-none text-sm font-medium text-gray-700">
              <option value="student">Student</option>
              <option value="mentor">Mentor</option>
              <option value="advisor">Advisor</option>
              <option value="hod">HOD</option>
              <option value="principal">Principal</option>
            </select>
          </div>
          <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-[#CD0000] hover:bg-[#a80000] text-white font-bold rounded-xl transition-all shadow-sm active:scale-95">
            Verify & Add User
          </button>
        </form>
      </div>
      
      {/* List of recently pre-approved */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Recently Verified Users</h3>
        </div>
        <div className="p-6 text-center text-gray-500 text-sm">
          No recently verified users found.
        </div>
      </div>
    </div>
  )
}

function DirectorySection() {
  const [activeRole, setActiveRole] = useState('student');
  const [studentGender, setStudentGender] = useState('boys');
  const [deptFilter, setDeptFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  const roles = [
    { id: 'student', label: 'Students' },
    { id: 'mentor', label: 'Mentors' },
    { id: 'advisor', label: 'Advisor' },
    { id: 'hod', label: 'HOD' },
    { id: 'principal', label: 'Principal' },
  ];

  const departments = ['CSE', 'CSD', 'CST', 'MECH', 'MCT', 'IT', 'AIDS', 'AIML'];
  const mockRooms = ['101', '102', '103', '201', '202', '301'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col min-h-[600px]">
      {/* Role Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar bg-gray-50/50 rounded-t-2xl">
        {roles.map(role => (
          <button 
            key={role.id}
            onClick={() => { setActiveRole(role.id); setDeptFilter(''); setRoomFilter(''); }}
            className={`px-8 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeRole === role.id ? 'border-[#CD0000] text-[#CD0000] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            {role.label}
          </button>
        ))}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* Filters & Sub-tabs Row */}
        <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6 items-start">
          
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap">
              Manage {roles.find(r => r.id === activeRole)?.label} {activeRole === 'student' ? `(${studentGender === 'boys' ? 'Boys' : 'Girls'})` : ''}
            </h2>
            {activeRole === 'student' && (
              <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-inner w-fit">
                <button 
                  onClick={() => setStudentGender('boys')} 
                  className={`px-5 py-1.5 rounded-md text-sm font-bold transition-all ${studentGender === 'boys' ? 'bg-white text-[#CD0000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Boys
                </button>
                <button 
                  onClick={() => setStudentGender('girls')} 
                  className={`px-5 py-1.5 rounded-md text-sm font-bold transition-all ${studentGender === 'girls' ? 'bg-white text-[#CD0000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Girls
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <div className="flex gap-3 w-full justify-start lg:justify-end">
              {activeRole !== 'principal' && (
                <div className="relative flex-1 lg:flex-none">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select 
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full lg:w-48 pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#CD0000]/20 focus:border-[#CD0000] appearance-none cursor-pointer"
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              
              {activeRole === 'student' && (
                <div className="relative flex-1 lg:flex-none">
                  <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select 
                    value={roomFilter}
                    onChange={(e) => setRoomFilter(e.target.value)}
                    className="w-full lg:w-48 pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#CD0000]/20 focus:border-[#CD0000] appearance-none cursor-pointer"
                  >
                    <option value="">All Rooms</option>
                    {mockRooms.map(r => <option key={r} value={r}>Room {r}</option>)}
                  </select>
                </div>
              )}
            </div>
            
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search accounts..." 
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#CD0000]/20 focus:border-[#CD0000]"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden flex-1 shadow-sm flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold">User Details</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  {activeRole !== 'principal' && <th className="px-6 py-4 font-semibold">Department</th>}
                  {activeRole === 'student' && <th className="px-6 py-4 font-semibold">Room No.</th>}
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Mock data row */}
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">Example {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}</div>
                    <div className="text-sm text-gray-500">user@snsgroups.com</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700 capitalize">{activeRole}</td>
                  {activeRole !== 'principal' && <td className="px-6 py-4 text-sm font-medium text-gray-700">{deptFilter || 'CSE'}</td>}
                  {activeRole === 'student' && <td className="px-6 py-4 text-sm font-medium text-gray-700">{roomFilter || '101'}</td>}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-gray-400">
                      <button className="p-1.5 hover:text-[#CD0000] hover:bg-[#CD0000]/10 rounded-lg transition-colors border border-transparent" title="Edit User">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent" title="Delete User">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">Test Account</div>
                    <div className="text-sm text-gray-500">test@snsgroups.com</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700 capitalize">{activeRole}</td>
                  {activeRole !== 'principal' && <td className="px-6 py-4 text-sm font-medium text-gray-700">{deptFilter || 'IT'}</td>}
                  {activeRole === 'student' && <td className="px-6 py-4 text-sm font-medium text-gray-700">{roomFilter || '102'}</td>}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                      Inactive
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-gray-400">
                      <button className="p-1.5 hover:text-[#CD0000] hover:bg-[#CD0000]/10 rounded-lg transition-colors border border-transparent">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
