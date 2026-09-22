import React, { ReactNode, useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { LogOut, LayoutDashboard, Building2, Users, FileText, Activity, UserSquare, Sun, Moon, BellRing, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatWidget } from './ChatWidget';
import { UpdatesModal } from './UpdatesModal';
import { api } from '../lib/api';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [showUpdates, setShowUpdates] = React.useState(false);
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [userBranch, setUserBranch] = useState<any>(null);
  
  useEffect(() => {
    if (user?.branchId) {
      api.get('/branches').then(res => {
        const branch = (res || []).find((b: any) => b.id === user.branchId);
        if (branch) setUserBranch(branch);
      }).catch(console.error);
    }
  }, [user]);

  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);


  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen h-[100dvh] bg-[#061121] text-slate-200 overflow-hidden font-sans w-full max-w-[100vw]">
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#1e345e] bg-[#0a192f] z-30 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
            <Activity className="text-emerald-400 w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">CashUp Pro</span>
        </div>
        <button className="p-2 text-slate-400 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className={clsx(
        "hidden md:flex bg-[#0a192f] border-r border-[#1e345e] shadow-2xl flex-col z-40 transition-all duration-300 relative",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-[#112240] border border-[#1e345e] flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors z-50 shadow-lg"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className={clsx("h-20 flex items-center border-b border-[#1e345e]", isSidebarCollapsed ? "justify-center px-2" : "px-6")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50 shrink-0">
              <Activity className="text-emerald-400 w-6 h-6" />
            </div>
            {!isSidebarCollapsed && <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">CashUp Pro</span>}
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 flex flex-col gap-2 overflow-y-auto">
          <Link
            to="/"
            title={isSidebarCollapsed ? "Dashboard" : undefined}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 hover:bg-[#112240] hover:text-emerald-400 text-emerald-400 bg-[#112240]/50 border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.05)]",
              isSidebarCollapsed && "justify-center px-0"
            )}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="font-medium">Dashboard</span>}
          </Link>

          {['ADMIN', 'ACCOUNTANT', 'HEAD_ACCOUNTANT', 'DIRECTOR', 'AUDITOR'].includes(user.role) && (
            <>
              {!isSidebarCollapsed && <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>}
              {isSidebarCollapsed && <div className="mt-6 border-t border-[#1e345e]" />}
              {(user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'AUDITOR') && (
                <Link
                  to="/users"
                  title={isSidebarCollapsed ? "Users" : undefined}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-[#112240] hover:text-emerald-400 transition-colors",
                    isSidebarCollapsed && "justify-center px-0"
                  )}
                >
                  <Users className="w-5 h-5 shrink-0" />
                  {!isSidebarCollapsed && <span className="font-medium">Users</span>}
                </Link>
              )}
              <Link
                to="/branches"
                title={isSidebarCollapsed ? "Branches" : undefined}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-[#112240] hover:text-emerald-400 transition-colors",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <Building2 className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && <span className="font-medium">Branches</span>}
              </Link>
              <Link
                to="/till-operators"
                title={isSidebarCollapsed ? "Till Operators" : undefined}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-[#112240] hover:text-emerald-400 transition-colors",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <UserSquare className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && <span className="font-medium">Till Operators</span>}
              </Link>
            </>
          )}

          <div className="mt-auto pt-6 border-t border-[#1e345e]">
             {isSidebarCollapsed ? (
               <div className="flex justify-center mb-4" title={`${user.name} (${user.role.toLowerCase()})`}>
                 <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-sm font-bold">
                   {(user.name || "").charAt(0).toUpperCase()}
                 </div>
               </div>
             ) : (
               <div className="px-4 mb-4">
                 <div className="text-sm font-medium text-white">{user.name}</div>
                 <div className="text-xs text-emerald-400 capitalize">{user.role.toLowerCase()}</div>
               </div>
             )}

             <button
               onClick={() => setShowUpdates(true)}
               title={isSidebarCollapsed ? "What's New" : undefined}
               className={clsx(
                 "w-full flex items-center px-4 py-3 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors mb-2 border border-amber-500/20",
                 isSidebarCollapsed ? "justify-center px-0" : "justify-between"
               )}
             >
               <div className="flex items-center gap-3">
                 <BellRing className="w-5 h-5 shrink-0" />
                 {!isSidebarCollapsed && <span className="font-medium">What's New</span>}
               </div>
               <span className="flex h-2 w-2 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
               </span>
             </button>
             <button
               onClick={() => setIsLightMode(!isLightMode)}
               title={isSidebarCollapsed ? (isLightMode ? 'Dark Mode' : 'Light Mode') : undefined}
               className={clsx(
                 "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-[#112240] transition-colors mb-2",
                 isSidebarCollapsed && "justify-center px-0"
               )}
             >
               {isLightMode ? <Moon className="w-5 h-5 shrink-0" /> : <Sun className="w-5 h-5 shrink-0" />}
               {!isSidebarCollapsed && <span className="font-medium">{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>}
             </button>

             <button
               onClick={logout}
               title={isSidebarCollapsed ? "Sign Out" : undefined}
               className={clsx(
                 "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors",
                 isSidebarCollapsed && "justify-center px-0"
               )}
             >
               <LogOut className="w-5 h-5 shrink-0" />
               {!isSidebarCollapsed && <span className="font-medium">Sign Out</span>}
             </button>
          </div>
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#0a192f] border-r border-[#1e345e] shadow-2xl flex flex-col z-50 md:hidden"
            >
              <div className="h-20 flex items-center justify-between px-6 border-b border-[#1e345e]">
                <div onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                    <Activity className="text-emerald-400 w-5 h-5" />
                  </div>
                  <span className="text-lg font-bold tracking-tight text-white">CashUp</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
                <Link 
                  to="/" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-400 bg-[#112240]/50 border border-emerald-500/20 shadow-sm"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="font-medium">Dashboard</span>
                </Link>
                
                {['ADMIN', 'ACCOUNTANT', 'HEAD_ACCOUNTANT', 'DIRECTOR', 'AUDITOR'].includes(user.role) && (
                  <>
                    <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>
                    {(user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'AUDITOR') && (
                      <Link to="/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-[#112240] hover:text-emerald-400 transition-colors">
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Users</span>
                      </Link>
                    )}
                    <Link to="/branches" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-[#112240] hover:text-emerald-400 transition-colors">
                      <Building2 className="w-5 h-5" />
                      <span className="font-medium">Branches</span>
              </Link>
              <Link to="/till-operators" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-[#112240] hover:text-emerald-400 transition-colors">
                <UserSquare className="w-5 h-5" />
                <span className="font-medium">Till Operators</span>
              </Link>
                  </>
                )}

                <div className="mt-auto pt-6 border-t border-[#1e345e]">
                   <div className="px-4 mb-4">
                     <div className="text-sm font-medium text-white">{user.name}</div>
                     <div className="text-xs text-emerald-400 capitalize">{user.role.toLowerCase()}</div>
                   </div>
                   <button 
                     onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                     className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                   >
                     <LogOut className="w-5 h-5" />
                     <span className="font-medium">Sign Out</span>
                   </button>
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto relative z-10 w-full overflow-x-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#112240]/40 via-transparent to-transparent pointer-events-none" />
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full relative z-10">
          {user && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between bg-[#112240] p-4 rounded-xl border border-[#1e345e] shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-white">Welcome, {user.name}</h2>
                <p className="text-sm text-emerald-400 capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
              </div>
              {userBranch && (
                <div className="mt-2 sm:mt-0 text-left sm:text-right">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Current Branch</div>
                  <div className="text-sm font-medium text-white">{userBranch.name}</div>
                </div>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <UpdatesModal isOpen={showUpdates} onClose={() => setShowUpdates(false)} />
      {/* Global Chat / Notification Widget */}
      <ChatWidget />
    </div>
  );
}
