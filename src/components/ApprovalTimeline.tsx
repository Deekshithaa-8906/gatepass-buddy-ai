import { ApprovalStep } from '@/types';
import { CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ApprovalTimeline = ({ chain }: { chain: ApprovalStep[] }) => {
  const icon = (s: ApprovalStep) => {
    if (s.status === 'approved') return <CheckCircle className="w-4 h-4 text-success" />;
    if (s.status === 'reconsidered') return <RotateCcw className="w-4 h-4 text-blue-500" />;
    if (s.status === 'declined') return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-warning" />;
  };

  const badgeClass = (status: string) => {
    if (status === 'approved') return 'bg-success/20 text-success border-success/30';
    if (status === 'reconsidered') return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
    if (status === 'declined') return 'bg-destructive/20 text-destructive border-destructive/30';
    return 'bg-warning/20 text-warning border-warning/30';
  };

  return (
    <div className="space-y-2 mt-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Approval Timeline</p>
      <div className="relative pl-6 space-y-3">
        <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-border" />
        {chain.map((step, i) => (
          <div key={i} className="relative flex items-start gap-3">
            <div className="absolute -left-6 mt-0.5">{icon(step)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground capitalize">{step.role}</span>
                <Badge className={`capitalize border text-xs ${badgeClass(step.status)}`}>
                  {step.status === 'reconsidered' ? 'Reconsidered & Approved' : step.status}
                </Badge>
              </div>
              {step.approvedBy && (
                <p className="text-xs text-muted-foreground">
                  by {step.approvedBy}
                  {step.timestamp && ` • ${new Date(step.timestamp).toLocaleString()}`}
                </p>
              )}
              {step.reason && <p className="text-xs text-destructive">Reason: {step.reason}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalTimeline;
