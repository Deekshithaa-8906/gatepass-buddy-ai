import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { AvatarDisplay } from './AvatarDisplay';
import { ProgressTracker, ProgressStep } from './ProgressTracker';
import { PlaneTakeoff, PlaneLanding, Map as MapIcon, X, FileText, AlertTriangle, Activity } from 'lucide-react';
import { UploadedFile } from './FileUploadSection';

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: string;
    type: 'Outing' | 'Leave';
    status: 'Pending' | 'Approved' | 'Rejected';
    departureDate: string;
    departureTime: string;
    returnDate: string;
    returnTime: string;
    duration: string;
    destination: string;
    reason: string;
    description?: string;
    date?: string; 
    studentInfo: {
      name: string;
      avatarUrl?: string;
      registerNumber?: string;
      department: string;
      roomNumber: string;
      campus?: string;
    };
    flags?: {
      emergency: boolean;
      medical: boolean;
    };
    documents?: UploadedFile[];
    progressSteps: ProgressStep[];
  } | null;
  showDecisionForm?: boolean;
  decisionContent?: React.ReactNode;
}

export function RequestDetailsModal({ isOpen, onClose, request, showDecisionForm = false, decisionContent }: RequestDetailsModalProps) {
  if (!request) return null;

  const appliedDate = request.date || "Oct 24, 2023";
  const appliedTime = "10:45 AM";

  const statusColors = {
    Approved: 'bg-green-100 text-green-700',
    Pending: 'bg-orange-100 text-orange-700',
    Rejected: 'bg-red-100 text-red-700'
  } as const;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 bg-white border border-gray-100 rounded-xl shadow-xl sm:rounded-xl hide-scrollbar">
        <DialogTitle className="sr-only">Request Details</DialogTitle>
        <button onClick={onClose} className="absolute right-5 top-5 z-50 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors border border-gray-100">
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-8 space-y-8 font-body">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-start gap-4">
              <AvatarDisplay name={request.studentInfo.name} imageUrl={request.studentInfo.avatarUrl} size="lg" />
              <div>
                <h2 className="text-3xl font-bold font-display text-gray-900 leading-tight tracking-tight">{request.type} Request</h2>
                <div className="flex items-center gap-3 mt-1.5">
                  <p className="text-sm font-medium text-gray-500">Ref ID: {request.id}</p>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusColors[request.status]}`}>
                    {request.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-sm font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
              Applied On {appliedDate} | {appliedTime}
            </div>
          </div>

          {/* Top Card: Student Info */}
          <div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Name</span>
                <span className="block text-sm font-bold text-gray-900">{request.studentInfo.name}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Register No</span>
                <span className="block text-sm font-bold text-gray-900">{request.studentInfo.registerNumber || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Department</span>
                <span className="block text-sm font-bold text-gray-900 truncate">{request.studentInfo.department}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Room/Block</span>
                <span className="block text-sm font-bold text-gray-900 truncate">{request.studentInfo.roomNumber}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Campus</span>
                <span className="block text-sm font-bold text-gray-900 truncate">{request.studentInfo.campus || "Main Campus"}</span>
              </div>
            </div>
          </div>

          {/* Grid Details & Flags */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                <PlaneTakeoff className="w-6 h-6 text-gray-400" />
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Departure</span>
                  <span className="block text-sm font-bold text-gray-900 mt-1">{request.departureDate}</span>
                  <span className="block text-xs font-medium text-gray-500">{request.departureTime}</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                <PlaneLanding className="w-6 h-6 text-gray-400" />
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Return</span>
                  <span className="block text-sm font-bold text-gray-900 mt-1">{request.returnDate}</span>
                  <span className="block text-xs font-medium text-gray-500">{request.returnTime}</span>
                </div>
              </div>
              <div className="bg-[#CD0000] p-5 rounded-xl shadow-sm text-center flex flex-col justify-center items-center h-full">
                <span className="block text-xs font-bold text-white/80 uppercase tracking-widest">Duration</span>
                <span className="block text-xl font-black text-white mt-1">{request.duration}</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                <MapIcon className="w-6 h-6 text-gray-400" />
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Destination</span>
                  <span className="block text-sm font-bold text-gray-900 mt-1 line-clamp-2">{request.destination}</span>
                </div>
              </div>
            </div>

            {request.flags && (request.flags.emergency || request.flags.medical) && (
              <div className="flex gap-3">
                {request.flags.emergency && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#CD0000] px-4 py-2.5 rounded-lg font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" /> Priority: Emergency
                  </div>
                )}
                {request.flags.medical && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-lg font-bold text-sm">
                    <Activity className="w-4 h-4" /> Priority: Medical
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reason Section */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Reason for {request.type}</h3>
            <div className="bg-white p-5 text-sm font-medium text-gray-700 leading-relaxed border border-gray-100 rounded-xl shadow-sm">
              {request.description || request.reason}
            </div>
          </div>

          {/* Supporting Documents */}
          {request.documents && request.documents.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Supporting Documents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {request.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-[#CD0000]/30 transition-colors cursor-pointer group">
                    <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-[#CD0000]/5 text-gray-400 group-hover:text-[#CD0000] transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="text-sm font-bold text-gray-900 truncate">{doc.name}</span>
                      <span className="text-xs text-[#CD0000] font-semibold mt-0.5">Click to view/download</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Separator */}
          <div className="h-px w-full bg-gray-100" />

          {/* Approval Workflow */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-5 uppercase tracking-wide">Approval Workflow Status</h3>
            <ProgressTracker steps={request.progressSteps} />
          </div>

          {/* Separator */}
          <div className="h-px w-full bg-gray-100" />

          {/* Official Remarks & Decision */}
          {showDecisionForm && decisionContent && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">Official Remarks & Decision</h3>
              {decisionContent}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
