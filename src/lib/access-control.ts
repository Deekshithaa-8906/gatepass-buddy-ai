import { UserRole } from '@/types';

export interface AllowedUser {
  id: string;
  email: string;
  role: UserRole;
  canLogin: boolean;
  canRegister: boolean;
  createdAt: string;
}

const ACCESS_KEY = 'gatepass_allowed_users';
const ADMIN_SESSION_KEY = 'gatepass_admin_session';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getAllowedUsers(): AllowedUser[] {
  return JSON.parse(localStorage.getItem(ACCESS_KEY) || '[]');
}

export function saveAllowedUsers(users: AllowedUser[]) {
  localStorage.setItem(ACCESS_KEY, JSON.stringify(users));
}

export function getAllowedUserByEmail(email: string): AllowedUser | undefined {
  const normalized = normalizeEmail(email);
  return getAllowedUsers().find(u => normalizeEmail(u.email) === normalized);
}

export function upsertAllowedUser(entry: Omit<AllowedUser, 'id' | 'createdAt'>) {
  const users = getAllowedUsers();
  const normalizedEmail = normalizeEmail(entry.email);
  const index = users.findIndex(u => normalizeEmail(u.email) === normalizedEmail);

  if (index >= 0) {
    users[index] = {
      ...users[index],
      email: normalizedEmail,
      role: entry.role,
      canLogin: entry.canLogin,
      canRegister: entry.canRegister,
    };
  } else {
    users.push({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      role: entry.role,
      canLogin: entry.canLogin,
      canRegister: entry.canRegister,
      createdAt: new Date().toISOString(),
    });
  }

  saveAllowedUsers(users);
}

export function removeAllowedUser(id: string) {
  const users = getAllowedUsers().filter(u => u.id !== id);
  saveAllowedUsers(users);
}

export function setAdminSession(active: boolean) {
  if (active) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export function hasAdminSession(): boolean {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}
