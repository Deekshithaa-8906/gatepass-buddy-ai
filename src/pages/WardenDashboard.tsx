import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  LogOut, 
  ShieldCheck, 
  GraduationCap, 
  Activity,
  AlertTriangle,
  User,
  Bell,
  ArrowRight,
  TrendingUp,
  Inbox,
  UserX,
  FileText
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import bgImage from '../assets/sns-campus-bg.png';

export function WardenDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    // Fetch real Warden data here
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      {[
        { title: 'Total Inmates', count: '1,240', icon: <Users className="w-6 h-6" />, color: 'from-[#CD0000] to-[#FF4D4D]' },
        { title: 'Active Passes', count: '42', icon: <MapPin className="w-6 h-6" />, color: 'from-orange-500 to-yellow-500' },
        { title: 'New Requests', count: '12', icon: <Inbox className="w-6 h-6" />, color: 'from-blue-500 to-indigo-500' },
        { title: 'Issues Logged', count: '5', icon: <AlertTriangle className="w-6 h-6" />, color: 'from-purple-500 to-pink-500' }
      ].map((stat, i) => (
        <div key={i} className={`bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-xl flex items-center gap-5 transition-transform hover:scale-105 group`}>
          <div className={`bg-gradient-to-br ${stat.color} p-4 rounded-2xl text-white shadow-lg shadow-red-200 group-hover:rotate-6 transition-transform`}>
            {stat.icon}
          </div>
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{stat.title}</p>
            <p className="text-3xl font-black text-gray-900 leading-tight">{stat.count}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen relative flex flex-col md:flex-row font-sans overflow-hidden bg-gray-50">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-cover bg-center z-0 transition-transform duration-1000 scale-100 opacity-80" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="fixed inset-0 bg-gradient-to-br from-white/90 via-white/80 to-red-100/30 z-0 backdrop-blur-sm" />

      {/* Modern Side-Nav */}
      <aside className="relative z-20 w-full md:w-72 bg-white/60 backdrop-blur-2xl border-r border-white/50 flex flex-col shadow-2xl h-screen sticky top-0 overflow-y-auto">
        <div className="p-8 border-b border-white/40 flex items-center gap-3">
          <div className="bg-[#CD0000] p-2 rounded-xl shadow-lg ring-1 ring-white/50">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-gray-900 uppercase">Warden<span className="text-[#CD0000]">HQ</span></span>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-3">
          <button onClick={() => setActiveTab('requests')} className={`flex items-center gap-3 w-full px-5 py-4 rounded-2xl font-black transition-all ${activeTab === 'requests' ? 'bg-[#CD0000] text-white shadow-2xl shadow-[#CD0000]/30' : 'text-gray-600 hover:bg-white/80 hover:text-[#CD0000]'}`}>
            <Activity className="w-5 h-5" /> Live Monitoring
          </button>
          <button onClick={() => setActiveTab('inmates')} className={`flex items-center gap-3 w-full px-5 py-4 rounded-2xl font-black transition-all ${activeTab === 'inmates' ? 'bg-[#CD0000] text-white shadow-2xl shadow-[#CD0000]/30' : 'text-gray-600 hover:bg-white/80 hover:text-[#CD0000]'}`}>
            <Users className="w-5 h-5" /> Inmate Directory
          </button>
          <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-3 w-full px-5 py-4 rounded-2xl font-black transition-all ${activeTab === 'reports' ? 'bg-[#CD0000] text-white shadow-2xl shadow-[#CD0000]/30' : 'text-gray-600 hover:bg-white/80 hover:text-[#CD0000]'}`}>
            <TrendingUp className="w-5 h-5" /> Guard Logs
          </button>
          <button onClick={() => setActiveTab('alerts')} className={`flex items-center gap-3 w-full px-5 py-4 rounded-2xl font-black transition-all ${activeTab === 'alerts' ? 'bg-[#CD0000] text-white shadow-2xl shadow-[#CD0000]/30' : 'text-gray-600 hover:bg-white/80 hover:text-[#CD0000]'}`}>
            <Bell className="w-5 h-5" /> Emergency
          </button>
        </nav>

        <div className="p-6 border-t border-white/40 mt-auto">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full px-5 py-4 text-gray-700 hover:text-[#CD0000] hover:bg-white/80 font-black rounded-2xl transition-all shadow-sm">
            <LogOut className="w-5 h-5" /> Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Dashboard Area */}
      <main className="relative z-10 flex-1 h-screen overflow-y-auto px-8 py-10 scroll-smooth">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter">Warden Dashboard</h1>
            <p className="text-gray-600 font-bold uppercase tracking-[0.2em] text-xs mt-2 ml-1">Central Oversight Protocol active</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#CD0000] transition-colors" />
                <input type="text" placeholder="Search Inmates..." className="pl-11 pr-6 py-3.5 bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl outline-none focus:ring-2 focus:ring-[#CD0000]/20 font-bold transition-all w-64 shadow-inner" />
             </div>
             <div className="bg-white/80 backdrop-blur-xl p-3 rounded-2xl border border-white cursor-pointer hover:bg-[#CD0000] group transition-all shadow-sm">
                <Filter className="w-5 h-5 text-gray-600 group-hover:text-white" />
             </div>
          </div>
        </header>

        {renderStats()}

        {/* Content Table Container */}
        <div className="bg-white/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/80 shadow-2xl p-8 transition-all hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)]">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Clock className="w-6 h-6 text-[#CD0000]" /> Recent Security Activity
            </h2>
            <button className="text-[#CD0000] font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
              View History <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-5 font-black text-gray-400 uppercase text-[10px] tracking-[0.15em]">Avatar</th>
                  <th className="pb-5 font-black text-gray-400 uppercase text-[10px] tracking-[0.15em]">Student Name</th>
                  <th className="pb-5 font-black text-gray-400 uppercase text-[10px] tracking-[0.15em]">Block/Room</th>
                  <th className="pb-5 font-black text-gray-400 uppercase text-[10px] tracking-[0.15em]">Pass Type</th>
                  <th className="pb-5 font-black text-gray-400 uppercase text-[10px] tracking-[0.15em]">Status</th>
                  <th className="pb-5 font-black text-gray-400 uppercase text-[10px] tracking-[0.15em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { name: "Rahul Sharma", block: "A-201", type: "Outing", status: "In Gate" },
                  { name: "Sneha Reddy", block: "B-105", type: "Personal", status: "Outside" },
                  { name: "Vikas Kumar", block: "C-302", type: "Leave", status: "Outside" },
                ].map((row, i) => (
                  <tr key={i} className="group hover:bg-red-50/30 transition-colors">
                    <td className="py-5">
                       <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#CD0000] to-[#FF4D4D] flex items-center justify-center text-white font-black shadow-lg">
                         {row.name.charAt(0)}
                       </div>
                    </td>
                    <td className="py-5"><p className="font-black text-gray-900">{row.name}</p><p className="text-[10px] text-gray-500 font-bold uppercase">Reg #ST827{i}</p></td>
                    <td className="py-5 font-bold text-gray-700">{row.block}</td>
                    <td className="py-5">
                       <span className="px-3 py-1 bg-white rounded-lg border border-gray-200 text-[10px] font-black uppercase text-gray-600">{row.type}</span>
                    </td>
                    <td className="py-5">
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${row.status === 'In Gate' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                         {row.status}
                       </span>
                    </td>
                    <td className="py-5">
                       <button className="p-2.5 rounded-xl hover:bg-white text-gray-400 hover:text-[#CD0000] hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
                         <FileText className="w-5 h-5" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
