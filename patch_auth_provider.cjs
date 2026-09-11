const fs = require('fs');
let content = fs.readFileSync('src/components/AuthProvider.tsx', 'utf8');

// Replace the state initialization and the rogue useEffect
const newInit = `  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cashup_session');
      if (saved) return JSON.parse(saved).user;
    } catch(e) {}
    return null;
  });
  const [token, setToken] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('cashup_session');
      if (saved) return JSON.parse(saved).token;
    } catch(e) {}
    return null;
  });`;

// Strip out the bad effect and the original state hooks
content = content.replace(/  const \[user, setUser\] = useState<User \| null>\(null\);\s*const \[token, setToken\] = useState<string \| null>\(null\);\s*useEffect\(\(\) => \{\s*localStorage\.removeItem\('cashup_session'\);\s*\}, \[\]\);/g, newInit);

fs.writeFileSync('src/components/AuthProvider.tsx', content);
