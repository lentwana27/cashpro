const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

code = code.replace(/const \[step, setStep\].*;/g, '');
code = code.replace(/const \[isSetup, setIsSetup\].*;/g, '');
code = code.replace(/const \[tempToken, setTempToken\].*;/g, '');
code = code.replace(/const \[twoFactorCode, setTwoFactorCode\].*;/g, '');

code = code.replace(
  /const handleLogin = async.*?finally \{\s*setLoading\(false\);\s*\}\s*\};/s,
  `const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await api.post('/auth/login', { email, password });
      login(result.user, result.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };`
);

code = code.replace(
  /const handle2FA = async.*?finally \{\s*setLoading\(false\);\s*\}\s*\};/s,
  ''
);

// We need to also remove the `{step === 'login' ? (` and `) : (` rendering part
// Let's just do a simpler search and replace for the UI
