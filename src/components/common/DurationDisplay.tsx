import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface DurationDisplayProps {
  departureDate: Date | undefined;
  departureTime: string;
  returnDate: Date | undefined;
  returnTime: string;
}

export function DurationDisplay({ departureDate, departureTime, returnDate, returnTime }: DurationDisplayProps) {
  const [durationStr, setDurationStr] = useState<string>('---');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!departureDate || !departureTime || !returnDate || !returnTime) {
      setDurationStr('---');
      setError('');
      return;
    }

    const [depHours, depMinutes] = departureTime.split(':').map(Number);
    const depDateTime = new Date(departureDate);
    depDateTime.setHours(depHours, depMinutes, 0, 0);

    const [retHours, retMinutes] = returnTime.split(':').map(Number);
    const retDateTime = new Date(returnDate);
    retDateTime.setHours(retHours, retMinutes, 0, 0);

    if (isNaN(depDateTime.getTime()) || isNaN(retDateTime.getTime())) {
      setDurationStr('---');
      setError('');
      return;
    }

    if (retDateTime <= depDateTime) {
      setDurationStr('---');
      setError('Return time must be after departure time');
      return;
    }

    setError('');
    
    const diffMs = retDateTime.getTime() - depDateTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const remainingHours = diffHours % 24;
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      if (remainingHours > 0) {
        setDurationStr(`${diffDays} Day${diffDays > 1 ? 's' : ''} ${remainingHours} Hour${remainingHours > 1 ? 's' : ''}`);
      } else {
        setDurationStr(`${diffDays} Day${diffDays > 1 ? 's' : ''}`);
      }
    } else {
      setDurationStr(`${diffHours} Hour${diffHours > 1 ? 's' : ''}`);
    }
  }, [departureDate, departureTime, returnDate, returnTime]);

  return (
    <div className="w-full relative mt-6 mb-2">
      <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm transition-colors ${error ? 'bg-red-50/80 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${error ? 'bg-red-100' : 'bg-white shadow-sm'}`}>
            <Clock className={`w-5 h-5 ${error ? 'text-red-600' : 'text-gray-600'}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</span>
            <span className={`text-xl font-extrabold ${error ? 'text-red-600' : 'text-gray-900'}`}>{durationStr}</span>
          </div>
        </div>
        {error && <span className="text-xs font-semibold text-red-500 bg-red-100 px-2 py-1 rounded">{error}</span>}
      </div>
    </div>
  );
}
