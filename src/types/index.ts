export type UserRole = 'student' | 'mentor' | 'advisor' | 'hod' | 'warden';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole;
}

export type ApprovalStatus = 'pending' | 'approved' | 'declined';

export interface ApprovalStep {
  role: UserRole;
  status: ApprovalStatus;
  approvedBy?: string;
  reason?: string;
  timestamp?: string;
}

export interface OutingRequest {
  id: string;
  type: 'outing' | 'leave';
  studentId: string;
  name: string;
  year: '1st' | '2nd' | '3rd' | '4th';
  branch: string;
  studentPhone: string;
  studentEmail: string;
  institution: string;
  regNumber: string;
  parentPhone: string;
  roomNumber: string;
  outDateTime: string;
  inDateTime: string;
  reason: string;
  approvalChain: ApprovalStep[];
  currentApprover: UserRole | 'completed' | 'declined';
  status: ApprovalStatus;
  createdAt: string;
}

export interface Complaint {
  id: string;
  studentId: string;
  name: string;
  roomNumber: string;
  text: string;
  createdAt: string;
  resolved: boolean;
}

export interface GatepassNotification {
  id: string;
  requestId: string;
  studentId: string;
  method: 'sms' | 'email';
  destination: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export const INSTITUTIONS = [
  'SNS College of Technology',
  'SNS College of Allied Health Science',
  'SNS College of Nursing',
  'SNS College of Pharmacy',
  'SNS College of Arts',
] as const;

export const YEARS = ['1st', '2nd', '3rd', '4th'] as const;

export function getApprovalChain(year: string): UserRole[] {
  if (year === '1st') {
    return ['mentor', 'advisor', 'hod', 'warden'];
  }
  return ['warden'];
}
