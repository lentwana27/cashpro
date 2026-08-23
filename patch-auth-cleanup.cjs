const fs = require('fs');
let code = fs.readFileSync('src/components/AuthProvider.tsx', 'utf8');
code = code.replace(
  `  const login = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('cashup_session', JSON.stringify({ user: newUser, token: newToken }));
  };
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cashup_session');
  };`,
  `  const login = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
  };
  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('cashup_temp_token');
    localStorage.removeItem('cashup_session');
  };`
);
fs.writeFileSync('src/components/AuthProvider.tsx', code);
