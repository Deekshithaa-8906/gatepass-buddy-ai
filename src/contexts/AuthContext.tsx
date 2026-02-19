import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => { success: boolean; error?: string };
  register: (data: Omit<User, 'id'>) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

function getUsers(): User[] {
  return JSON.parse(localStorage.getItem('gatepass_users') || '[]');
}
function saveUsers(users: User[]) {
  localStorage.setItem('gatepass_users', JSON.stringify(users));
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('gatepass_current_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = (phone: string, password: string) => {
    const users = getUsers();
    const found = users.find(u => u.phone === phone && u.password === password);
    if (!found) return { success: false, error: 'Invalid phone number or password' };
    setUser(found);
    localStorage.setItem('gatepass_current_user', JSON.stringify(found));
    return { success: true };
  };

  const register = (data: Omit<User, 'id'>) => {
    const users = getUsers();
    if (users.find(u => u.phone === data.phone)) {
      return { success: false, error: 'Phone number already registered' };
    }
    const newUser: User = { ...data, id: crypto.randomUUID() };
    users.push(newUser);
    saveUsers(users);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gatepass_current_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
