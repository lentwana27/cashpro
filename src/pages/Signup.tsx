import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Activity, Mail, Lock, User, Building2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Send a default role and empty branchId. Admin will properly allocate them.
      await api.post('/auth/signup', { name, email, password, role: 'SUPERVISOR', branchId: '' });
      setSuccess('Access request submitted successfully. Waiting for Admin approval and role assignment.');
      setName(''); setEmail(''); setPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#061121] flex items-center justify-center p-4 relative overflow-hidden font-sans text-slate-200">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#0a192f] border border-[#1e345e] rounded-2xl shadow-2xl p-8 backdrop-blur-xl bg-opacity-80">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">Request Access</h1>
            <p className="text-slate-400 mt-2 text-center text-sm">Join the CashUp Pro platform</p>
          </div>

          {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm text-center mb-6">{error}</div>}
          {success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm text-center mb-6">{success}</div>}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
               <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Full Name</label>
               <input type="text" required value={name} onChange={e => setName(e.target.value)}
                 className="block w-full px-3 py-3 border border-[#1e345e] bg-[#061121] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                 placeholder="Jane Doe" />
            </div>

            <div>
               <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
               <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                 className="block w-full px-3 py-3 border border-[#1e345e] bg-[#061121] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                 placeholder="jane@cashuppro.com" />
            </div>

            <div>
               <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Password</label>
               <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                 className="block w-full px-3 py-3 border border-[#1e345e] bg-[#061121] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                 placeholder="••••••••" />
            </div>

            <div>
               <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Confirm Password</label>
               <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                 className="block w-full px-3 py-3 border border-[#1e345e] bg-[#061121] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                 placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50 mt-6 pt-6">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#1e345e] text-center">
             <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
               ← Back to Login
             </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
