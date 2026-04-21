import React from 'react';
import { AlertTriangle, Activity } from 'lucide-react';

interface FlagSelectorProps {
  flags: {
    emergency: boolean;
    medical: boolean;
  };
  onChange: (flags: { emergency: boolean; medical: boolean; }) => void;
}

export function FlagSelector({ flags, onChange }: FlagSelectorProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-2">
      <button
        type="button"
        onClick={() => onChange({ ...flags, emergency: !flags.emergency })}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border ${flags.emergency ? 'bg-red-50 hover:bg-red-100 border-red-300 text-red-600 shadow-sm' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-500'}`}
      >
        <AlertTriangle className="w-5 h-5" />
        Emergency Request
      </button>
      <button
        type="button"
        onClick={() => onChange({ ...flags, medical: !flags.medical })}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border ${flags.medical ? 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-600 shadow-sm' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-500'}`}
      >
        <Activity className="w-5 h-5" />
        Medical Reason
      </button>
    </div>
  );
}
