import { Complaint } from '@/types';
import { CheckCircle, Clock, AlertTriangle, ShieldAlert, Eye } from 'lucide-react';

const ComplaintTimeline = ({ complaint: c }: { complaint: Complaint }) => {
  const steps: { label: string; time?: string; icon: React.ReactNode; done: boolean }[] = [
    {
      label: 'Submitted by Student',
      time: c.createdAt,
      icon: <Clock className="w-4 h-4 text-primary" />,
      done: true,
    },
    {
      label: 'Viewed by Warden',
      time: c.createdAt,
      icon: <Eye className="w-4 h-4 text-muted-foreground" />,
      done: true,
    },
    {
      label: 'Escalated to Principal',
      time: c.escalatedAt,
      icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
      done: !!c.escalatedAt,
    },
    {
      label: 'Escalated to Management',
      time: c.escalatedToManagementAt,
      icon: <ShieldAlert className="w-4 h-4 text-destructive" />,
      done: !!c.escalatedToManagementAt,
    },
    {
      label: c.resolvedBy ? `Resolved by ${c.resolvedBy}` : 'Resolved',
      time: c.resolvedAt,
      icon: <CheckCircle className="w-4 h-4 text-success" />,
      done: !!c.resolvedAt,
    },
  ];

  return (
    <div className="space-y-2 mt-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Complaint Timeline</p>
      <div className="relative pl-6 space-y-3">
        <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-border" />
        {steps.map((step, i) => (
          <div key={i} className={`relative flex items-start gap-3 ${!step.done ? 'opacity-40' : ''}`}>
            <div className="absolute -left-6 mt-0.5">{step.icon}</div>
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">{step.label}</span>
              {step.done && step.time && (
                <p className="text-xs text-muted-foreground">{new Date(step.time).toLocaleString()}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplaintTimeline;
