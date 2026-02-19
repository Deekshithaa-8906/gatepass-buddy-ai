import { OutingRequest, Complaint } from '@/types';

const REQUESTS_KEY = 'gatepass_requests';
const COMPLAINTS_KEY = 'gatepass_complaints';

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
