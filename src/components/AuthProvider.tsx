import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../lib/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
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
  });

  useEffect(() => {
    if (!user) return;
    const ping = () => fetch('/api/auth/heartbeat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ userId: user.id })
    }).catch(() => { /* silent */ });
    ping();
    const interval = setInterval(ping, 30000); // 30s heartbeat
    return () => clearInterval(interval);
  }, [user]);

  const login = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('cashup_session', JSON.stringify({ user: newUser, token: newToken }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cashup_session');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
