const fs = require('fs');

let code = fs.readFileSync('src/components/AuthProvider.tsx', 'utf8');

code = code.replace(
  `  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cashup_session');
    if (saved) {
      try { return JSON.parse(saved).user; } catch (e) { return null; }
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem('cashup_session');
    if (saved) {
      try { return JSON.parse(saved).token; } catch (e) { return null; }
    }
    return null;
  });`,
  `  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);`
);

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
  };`
);

fs.writeFileSync('src/components/AuthProvider.tsx', code);
