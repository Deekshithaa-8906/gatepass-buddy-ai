import React from 'react';
import { Check, X as XIcon } from 'lucide-react';

export type StepStatus = 'completed' | 'current' | 'pending' | 'rejected';

export interface ProgressStep {
  label: string;
  status: StepStatus;
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
}

export function ProgressTracker({ steps }: ProgressTrackerProps) {
  return (
    <div className="w-full py-6">
      <div className="relative flex justify-between items-start w-full">
        {steps.map((step, index) => {
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const isNextCompleteOrCurrent = !isLast && (steps[index + 1].status === 'completed' || steps[index + 1].status === 'current');

          return (
            <div key={index} className="flex flex-col items-center relative z-10 flex-1">
              {/* Left Line */}
              {!isFirst && (
                <div className={`absolute left-0 right-1/2 top-[15px] h-[3px] -z-10 transition-colors ${step.status !== 'pending' ? 'bg-[#FF6464]' : 'bg-gray-200'}`} />
              )}
              {/* Right Line */}
              {!isLast && (
                <div className={`absolute left-1/2 right-0 top-[15px] h-[3px] -z-10 transition-colors ${isNextCompleteOrCurrent ? 'bg-[#FF6464]' : 'bg-gray-200'}`} />
              )}
              
              {/* Circle */}
              <div className="h-8 flex items-center justify-center mb-3">
                <div 
                  className={`rounded-full flex items-center justify-center transition-all ${
                    step.status === 'completed' ? 'bg-[#FF6464] text-white shadow-md border-0 w-8 h-8' :
                    step.status === 'current' ? 'bg-[#FF6464] text-white shadow-md border-0 w-8 h-8' : 
                    step.status === 'rejected' ? 'bg-red-600 text-white shadow-md border-0 w-8 h-8' :
                    'bg-[#2A2B3D] w-3 h-3' // Tiny dark circle for pending
                  }`}
                >
                  {(step.status === 'completed' || step.status === 'current') && <Check className="w-4 h-4 shadow-sm" strokeWidth={3} />}
                  {step.status === 'rejected' && <XIcon className="w-4 h-4 shadow-sm" strokeWidth={3} />}
                </div>
              </div>
              
              {/* Text */}
              <span className={`text-[10px] sm:text-xs font-bold text-center uppercase tracking-wider ${
                step.status === 'completed' || step.status === 'current' ? 'text-gray-700' : 
                step.status === 'pending' ? 'text-gray-500' : 'text-red-600'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
