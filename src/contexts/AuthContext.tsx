import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { getAllowedUserByEmail, normalizeEmail } from '@/lib/access-control';

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string, rememberMe?: boolean) => { success: boolean; error?: string };
  loginWithGoogle: (credential: string) => { success: boolean; error?: string };
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
    const maybeEmail = identifier.includes('@') ? normalizeEmail(identifier) : '';
    if (maybeEmail) {
      const allowed = getAllowedUserByEmail(maybeEmail);
      if (!allowed || !allowed.canLogin) {
        return { success: false, error: 'This email is not on the approved list. Please contact admin.' };
      }
    }

    const users = getUsers();
    const found = users.find(
      u => (u.phone === identifier || u.email === identifier) && u.password === password
    );
    if (!found) return { success: false, error: 'Invalid phone/email or password' };
    setUser(found);
    if (rememberMe) {
      localStorage.setItem('gatepass_current_user', JSON.stringify(found));
    } else {
      sessionStorage.setItem('gatepass_current_user', JSON.stringify(found));
    }
    return { success: true };
  };

  const loginWithGoogle = (credential: string) => {
    try {
      // Decode JWT token from Google
      const payload = JSON.parse(atob(credential.split('.')[1]));
      const googleEmail = normalizeEmail(payload.email || '');
      if (!googleEmail) {
        return { success: false, error: 'Google account email is missing' };
      }

      const allowed = getAllowedUserByEmail(googleEmail);
      if (!allowed || !allowed.canLogin) {
        return { success: false, error: 'This email is not on the approved list. Please contact admin.' };
      }
      
      // Create or find user based on Google email
      const users = getUsers();
      let found = users.find(u => normalizeEmail(u.email) === googleEmail);
      
      if (!found) {
        // Auto-register new user from Google
        found = {
          id: crypto.randomUUID(),
          name: payload.name,
          email: googleEmail,
          phone: '',
          role: allowed.role as UserRole,
          password: '',
        };
        users.push(found);
        saveUsers(users);
      } else if (found.role !== allowed.role) {
        found.role = allowed.role;
        saveUsers(users);
      }
      
      setUser(found);
      localStorage.setItem('gatepass_current_user', JSON.stringify(found));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Google login failed' };
    }
  };

  const register = (data: Omit<User, 'id'>) => {
    const email = normalizeEmail(data.email || '');
    if (!email) {
      return { success: false, error: 'Email is required for registration' };
    }

    const allowed = getAllowedUserByEmail(email);
    if (!allowed || !allowed.canRegister) {
      return { success: false, error: 'This email is not on the approved list. Please contact admin.' };
    }

    const users = getUsers();
    if (users.find(u => u.phone === data.phone)) {
      return { success: false, error: 'Phone number already registered' };
    }
    if (users.find(u => normalizeEmail(u.email) === email)) {
      return { success: false, error: 'Email already registered' };
    }
    const newUser: User = { ...data, email, role: allowed.role, id: crypto.randomUUID() };
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
    <AuthContext.Provider value={{ user, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
