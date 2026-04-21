import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { AvatarDisplay } from './AvatarDisplay';
import { ProgressTracker, ProgressStep } from './ProgressTracker';
import { Clock, MapPin, AlignLeft, Calendar, FileText, AlertTriangle, Activity } from 'lucide-react';
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
    studentInfo: {
      name: string;
      avatarUrl?: string;
      department: string;
      roomNumber: string;
    };
    flags?: {
      emergency: boolean;
      medical: boolean;
    };
    documents?: UploadedFile[];
    progressSteps: ProgressStep[];
  } | null;
}

export function RequestDetailsModal({ isOpen, onClose, request }: RequestDetailsModalProps) {
  if (!request) return null;

  const statusColor = request.status === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' :
                      request.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-orange-100 text-orange-700 border-orange-200';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 sm:rounded-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{request.type} Request</h2>
            <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${statusColor}`}>
              {request.status}
            </span>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{request.id}</span>
        </div>

        <div className="p-6 space-y-8">
          {/* Progress Tracker */}
          <section className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/50">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2 mb-2">Approval Progress</h3>
            <ProgressTracker steps={request.progressSteps} />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Student Info & Flags */}
            <div className="md:col-span-1 space-y-6">
              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Student Info</h3>
                <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex items-center gap-3">
                  <AvatarDisplay name={request.studentInfo.name} imageUrl={request.studentInfo.avatarUrl} size="md" />
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{request.studentInfo.name}</span>
                    <span className="text-xs font-semibold text-gray-500">{request.studentInfo.department} • Room {request.studentInfo.roomNumber}</span>
                  </div>
                </div>
              </section>

              {request.flags && (request.flags.emergency || request.flags.medical) && (
                <section>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Flags</h3>
                  <div className="flex flex-col gap-2">
                    {request.flags.emergency && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg font-bold text-sm">
                        <AlertTriangle className="w-4 h-4" /> Emergency
                      </div>
                    )}
                    {request.flags.medical && (
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 px-3 py-2 rounded-lg font-bold text-sm">
                        <Activity className="w-4 h-4" /> Medical
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Request Details */}
            <div className="md:col-span-2 space-y-6">
              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Request Details</h3>
                <div className="bg-gray-50/50 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  {/* Dates */}
                  <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
                    <div className="p-4 flex gap-3">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 self-start">
                        <Calendar className="w-5 h-5 text-[#CD0000]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-500 uppercase">Departure</span>
                        <span className="font-semibold text-gray-900 mt-0.5">{request.departureDate}</span>
                        <span className="text-sm font-medium text-gray-600">{request.departureTime}</span>
                      </div>
                    </div>
                    <div className="p-4 flex gap-3">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 self-start">
                        <Clock className="w-5 h-5 text-[#CD0000]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-500 uppercase">Return</span>
                        <span className="font-semibold text-gray-900 mt-0.5">{request.returnDate}</span>
                        <span className="text-sm font-medium text-gray-600">{request.returnTime}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Info */}
                  <div className="p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase block">Destination</span>
                        <span className="font-semibold text-gray-900">{request.destination}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <AlignLeft className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase block">Reason</span>
                        <span className="font-semibold text-gray-900">{request.reason}</span>
                        {request.description && (
                          <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-2">
                       <span className="inline-flex py-1 px-3 bg-gray-100 text-gray-800 rounded-lg text-sm font-bold shadow-sm">
                         Duration: {request.duration}
                       </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Documents */}
              {request.documents && request.documents.length > 0 && (
                <section>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Supporting Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {request.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#CD0000]/30 transition-colors cursor-pointer group">
                        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-[#CD0000]/5">
                          <FileText className="w-5 h-5 text-gray-500 group-hover:text-[#CD0000]" />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-sm font-bold text-gray-900 truncate">{doc.name}</span>
                          <span className="text-xs text-gray-500 font-medium">Click to view</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
