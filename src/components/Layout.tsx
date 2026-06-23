import { ReactNode, useState } from 'react';
import { useAuth } from './AuthProvider';
import { LogOut, LayoutDashboard, Building2, Users, FileText, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatWidget } from './ChatWidget';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#061121] text-slate-200 overflow-hidden font-sans">
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

      <AnimatePresence>
        {(isMobileMenuOpen || window.innerWidth >= 768) && (
          <motion.aside 
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            exit={{ x: -250 }}
            transition={{ type: "tween", duration: 0.3 }}
            className={clsx(
              "w-64 bg-[#0a192f] border-r border-[#1e345e] shadow-2xl flex flex-col z-40 transition-all",
              "fixed inset-y-0 left-0 md:relative md:translate-x-0",
              !isMobileMenuOpen && "hidden md:flex"
            )}
          >
            <div className="h-20 hidden md:flex items-center px-6 border-b border-[#1e345e]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                  <Activity className="text-emerald-400 w-6 h-6" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">CashUp Pro</span>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 md:py-8 flex flex-col gap-2 overflow-y-auto">
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                  "hover:bg-[#112240] hover:text-emerald-400",
                  "text-emerald-400 bg-[#112240]/50 border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.05)]"
                )}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              
              {['ADMIN', 'ACCOUNTANT', 'HEAD_ACCOUNTANT', 'DIRECTOR', 'AUDITOR'].includes(user.role) && (
                <>
                  <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>
                  {user.role === 'ADMIN' && (
                    <Link to="/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-[#112240] hover:text-emerald-400 transition-colors">
                      <Users className="w-5 h-5" />
                      <span className="font-medium">Users</span>
                    </Link>
                  )}
                  <Link to="/branches" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-[#112240] hover:text-emerald-400 transition-colors">
                    <Building2 className="w-5 h-5" />
                    <span className="font-medium">Branches</span>
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
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-10 w-full overflow-x-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#112240]/40 via-transparent to-transparent pointer-events-none" />
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full relative z-10">
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

      {/* Global Chat / Notification Widget */}
      <ChatWidget />
    </div>
  );
}
