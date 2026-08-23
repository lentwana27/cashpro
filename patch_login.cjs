const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

code = code.replace(
`import { Activity, Mail, Lock, Loader2 } from 'lucide-react';`,
`import { Activity, Mail, Lock, Loader2, KeyRound } from 'lucide-react';`
);

code = code.replace(
`  const [email, setEmail] = useState('');
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
      const { user, token } = await api.post('/auth/login', { email, password });
      login(user, token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };`,
`  const [step, setStep] = useState<'login' | '2fa'>('login');
  const [tempToken, setTempToken] = useState<string>('');
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
        setTempToken(result.tempToken);
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
  };`
);

code = code.replace(
`          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm text-center mb-6">
              {error}
            </motion.div>
          )}
          <form onSubmit={handleLogin} className="space-y-5">`,
`          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm text-center mb-6">
              {error}
            </motion.div>
          )}
          
          {step === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-5">`
);

code = code.replace(
`              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Access System'}
            </button>
          </form>`,
`              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
            </button>
          </form>
          ) : (
          <form onSubmit={handle2FA} className="space-y-5">
            <div className="mb-4 text-sm text-slate-300 text-center">
              Please enter the 6-digit authentication code to verify your identity (Hint: 123456).
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Access'}
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
          )}`
);

fs.writeFileSync('src/pages/Login.tsx', code);
