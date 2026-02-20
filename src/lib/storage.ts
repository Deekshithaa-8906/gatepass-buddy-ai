import { OutingRequest, Complaint, GatepassNotification } from '@/types';

const REQUESTS_KEY = 'gatepass_requests';
const COMPLAINTS_KEY = 'gatepass_complaints';
const NOTIFICATIONS_KEY = 'gatepass_notifications';

export function getRequests(): OutingRequest[] {
  return JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
}

export function saveRequests(requests: OutingRequest[]) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function addRequest(request: OutingRequest) {
  const all = getRequests();
  all.push(request);
  saveRequests(all);
}

export function updateRequest(id: string, updater: (r: OutingRequest) => OutingRequest) {
  const all = getRequests();
  const idx = all.findIndex(r => r.id === id);
  if (idx !== -1) {
    all[idx] = updater(all[idx]);
    saveRequests(all);
  }
}

export function getComplaints(): Complaint[] {
  return JSON.parse(localStorage.getItem(COMPLAINTS_KEY) || '[]');
}

export function addComplaint(complaint: Complaint) {
  const all = getComplaints();
  all.push(complaint);
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(all));
}

export function resolveComplaint(id: string) {
  const all = getComplaints();
  const idx = all.findIndex(c => c.id === id);
  if (idx !== -1) {
    all[idx].resolved = true;
    all[idx].resolvedAt = new Date().toISOString();
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(all));
  }
}

export function getNotifications(studentId: string): GatepassNotification[] {
  const all: GatepassNotification[] = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  return all.filter(n => n.studentId === studentId);
}

export function addNotification(notification: GatepassNotification) {
  const all: GatepassNotification[] = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  all.push(notification);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
}

export function markNotificationRead(id: string) {
  const all: GatepassNotification[] = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  const idx = all.findIndex(n => n.id === id);
  if (idx !== -1) {
    all[idx].read = true;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
  }
}
