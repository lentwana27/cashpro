import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { api } from '../lib/api';
import { Activity, Mail, Lock, Loader2, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

export function Login() {
  const [step, setStep] = useState<'login' | '2fa'>(() => sessionStorage.getItem('cashup_temp_token') ? '2fa' : 'login');
  const [isSetup, setIsSetup] = useState<boolean>(() => sessionStorage.getItem('cashup_2fa_setup') === 'true');
  const [tempToken, setTempToken] = useState<string>(() => sessionStorage.getItem('cashup_temp_token') || '');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await api.post('/auth/login', { email, password });
      if (result.requires2FA) {
        sessionStorage.setItem('cashup_temp_token', result.tempToken);
        if (result.isSetup) sessionStorage.setItem('cashup_2fa_setup', 'true');
        setTempToken(result.tempToken);
        setIsSetup(result.isSetup);
        setStep('2fa');
      } else {
        login(result.user, result.token);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { user, token } = await api.post('/auth/verify-2fa', { tempToken, code: twoFactorCode });
      login(user, token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#061121] flex items-center justify-center p-4 relative overflow-hidden font-sans text-slate-200">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#0a192f] border border-[#1e345e] rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 backdrop-blur-xl bg-opacity-80">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6">
              <Activity className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">CashUp Pro</h1>
            <p className="text-slate-400 mt-2 text-center text-sm">Secure reconciliation & accounting access</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm text-center mb-6">
              {error}
            </motion.div>
          )}

          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input 
                    type="email" 
                    autoFocus
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-[#1e345e] bg-[#061121] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                 <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Password</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Lock className="h-5 w-5 text-slate-500" />
                   </div>
                   <input 
                     type="password" 
                     required
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     className="block w-full pl-10 pr-3 py-3 border border-[#1e345e] bg-[#061121] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                     placeholder="••••••••"
                   />
                 </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-[#061121] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2FA} className="space-y-5">
              <div className="mb-4 text-sm text-slate-300 text-center">
                {isSetup 
                  ? "Please set a new 6-digit authentication code to secure your account."
                  : "Please enter your 6-digit authentication code to verify your identity."}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Authentication Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-500" />
                  </div>
                  <input 
                    type="text" 
                    autoFocus
                    required
                    value={twoFactorCode}
                    onChange={e => setTwoFactorCode(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-[#1e345e] bg-[#061121] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors tracking-widest text-lg font-mono text-center"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-[#061121] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSetup ? 'Save & Access' : 'Verify & Access')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('login');
                  setTwoFactorCode('');
                  setError('');
                }}
                className="w-full text-sm text-slate-400 hover:text-white transition-colors"
              >
                Back to Login
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-[#1e345e] text-center">
             <p className="text-sm text-slate-400">
               Need an account? <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium">Request Access</Link>
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
