import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string, rememberMe?: boolean) => { success: boolean; error?: string };
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
    const saved = localStorage.getItem('gatepass_current_user') || sessionStorage.getItem('gatepass_current_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = (identifier: string, password: string, rememberMe = false) => {
    const users = getUsers();
    const found = users.find(
      u => (u.phone === identifier || u.email === identifier) && u.password === password
    );
    if (!found) return { success: false, error: 'Invalid phone/email or password' };
    // Block unapproved students
    if (found.role === 'student' && found.accountStatus !== 'approved') {
      if (found.accountStatus === 'rejected') return { success: false, error: 'Your account has been rejected by the admin.' };
      return { success: false, error: 'Your account is pending admin approval. Please wait.' };
    }
    setUser(found);
    if (rememberMe) {
      localStorage.setItem('gatepass_current_user', JSON.stringify(found));
    } else {
      sessionStorage.setItem('gatepass_current_user', JSON.stringify(found));
    }
    return { success: true };
  };

  const register = (data: Omit<User, 'id'>) => {
    const users = getUsers();
    if (users.find(u => u.phone === data.phone)) {
      return { success: false, error: 'Phone number already registered' };
    }
    if (data.email && users.find(u => u.email === data.email)) {
      return { success: false, error: 'Email already registered' };
    }
    const newUser: User = { ...data, id: crypto.randomUUID() };
    users.push(newUser);
    saveUsers(users);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gatepass_current_user');
    sessionStorage.removeItem('gatepass_current_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
