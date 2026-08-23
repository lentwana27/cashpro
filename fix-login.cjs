const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// The file still has {step === 'login' ? ( ... ) : ( ... )}
// Let's replace the whole block

const replacement = `
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
          <div className="mt-8 pt-6 border-t border-[#1e345e] text-center">
`;

code = code.replace(/\{step === 'login' \? \([\s\S]*?\)\s*:\s*\([\s\S]*?\)\s*\}\s*<div className="mt-8 pt-6 border-t border-\[#1e345e\] text-center">/g, replacement);

fs.writeFileSync('src/pages/Login.tsx', code);
