const fs = require('fs');

let code = fs.readFileSync('src/pages/Signup.tsx', 'utf8');

code = code.replace(
  `const [confirmPassword, setConfirmPassword] = useState('');`,
  `const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');`
);

code = code.replace(
  `await api.post('/auth/signup', { name, email, password, role: 'SUPERVISOR', branchId: '' });`,
  `await api.post('/auth/signup', { name, email, password, role: 'SUPERVISOR', branchId: '', twoFactorCode });`
);

code = code.replace(
  `setName(''); setEmail(''); setPassword(''); setConfirmPassword('');`,
  `setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setTwoFactorCode('');`
);

code = code.replace(
  `<div>
               <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Confirm Password</label>
               <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                 className="block w-full px-3 py-3 border border-[#1e345e] bg-[#061121] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                 placeholder="••••••••" />
            </div>`,
  `<div>
               <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Confirm Password</label>
               <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                 className="block w-full px-3 py-3 border border-[#1e345e] bg-[#061121] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                 placeholder="••••••••" />
            </div>
            <div>
               <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Set 2FA Code (6 Digits)</label>
               <input type="text" required maxLength={6} value={twoFactorCode} onChange={e => setTwoFactorCode(e.target.value)}
                 className="block w-full px-3 py-3 border border-[#1e345e] bg-[#061121] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 tracking-widest font-mono"
                 placeholder="000000" />
            </div>`
);

fs.writeFileSync('src/pages/Signup.tsx', code);
