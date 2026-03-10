import { OutingRequest, Complaint, GatepassNotification, PrincipalNotification } from '@/types';

const REQUESTS_KEY = 'gatepass_requests';
const COMPLAINTS_KEY = 'gatepass_complaints';
const NOTIFICATIONS_KEY = 'gatepass_notifications';
const PRINCIPAL_NOTIFICATIONS_KEY = 'gatepass_principal_notifications';

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

export function saveComplaints(complaints: Complaint[]) {
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
}

export function addComplaint(complaint: Complaint) {
  const all = getComplaints();
  all.push(complaint);
  saveComplaints(all);
}

export function resolveComplaint(id: string) {
  const all = getComplaints();
  const idx = all.findIndex(c => c.id === id);
  if (idx !== -1) {
    all[idx].resolved = true;
    all[idx].resolvedAt = new Date().toISOString();
    all[idx].status = 'resolved';
    saveComplaints(all);
  }
}

export function escalateComplaint(id: string) {
  const all = getComplaints();
  const idx = all.findIndex(c => c.id === id);
  if (idx !== -1) {
    all[idx].status = 'escalated';
    all[idx].escalatedAt = new Date().toISOString();
    saveComplaints(all);
  }
}

/** Check and auto-escalate complaints older than 3 days */
export function checkAndEscalateComplaints() {
  const all = getComplaints();
  const now = Date.now();
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  let changed = false;

  for (const c of all) {
    if (!c.resolved && c.status !== 'escalated') {
      const age = now - new Date(c.createdAt).getTime();
      if (age >= THREE_DAYS) {
        c.status = 'escalated';
        c.escalatedAt = new Date().toISOString();
        changed = true;

        // Add principal notification
        addPrincipalNotification({
          id: crypto.randomUUID(),
          complaintId: c.id,
          studentName: c.name,
          roomNumber: c.roomNumber,
          complaintText: c.text,
          escalatedAt: c.escalatedAt,
          read: false,
        });
      }
    }
  }

  if (changed) saveComplaints(all);
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

export function getPrincipalNotifications(): PrincipalNotification[] {
  return JSON.parse(localStorage.getItem(PRINCIPAL_NOTIFICATIONS_KEY) || '[]');
}

export function addPrincipalNotification(notification: PrincipalNotification) {
  const all = getPrincipalNotifications();
  // avoid duplicates
  if (all.some(n => n.complaintId === notification.complaintId)) return;
  all.push(notification);
  localStorage.setItem(PRINCIPAL_NOTIFICATIONS_KEY, JSON.stringify(all));
}

export function markPrincipalNotificationRead(id: string) {
  const all = getPrincipalNotifications();
  const idx = all.findIndex(n => n.id === id);
  if (idx !== -1) {
    all[idx].read = true;
    localStorage.setItem(PRINCIPAL_NOTIFICATIONS_KEY, JSON.stringify(all));
  }
}

export function getUserProfilePhoto(userId: string): string | undefined {
  const users = JSON.parse(localStorage.getItem('gatepass_users') || '[]');
  const user = users.find((u: any) => u.id === userId);
  return user?.profilePhoto;
}
