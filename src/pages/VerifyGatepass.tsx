import { useParams } from 'react-router-dom';
import { getRequests } from '@/lib/storage';
import { MapPin, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const VerifyGatepass = () => {
  const { id } = useParams<{ id: string }>();
  const requests = getRequests();
  const request = requests.find(r => r.id === id);

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="card-elevated text-center max-w-md w-full py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Gatepass Not Found</h1>
          <p className="text-muted-foreground">This gatepass ID is invalid or does not exist.</p>
          <Badge className="mt-4 bg-destructive/20 text-destructive border border-destructive/30 text-lg px-4 py-1">INVALID</Badge>
        </div>
      </div>
    );
  }

  const now = new Date();
  const inDate = new Date(request.inDateTime);
  const isExpired = request.status === 'approved' && now > inDate;
  const isValid = request.status === 'approved' && !isExpired;
  const isDenied = request.status === 'declined';

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-primary mb-2">
            <MapPin className="w-8 h-8" />
            <span className="text-xl font-display font-bold">PassNTrack</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Gatepass Verification</h1>
        </div>

        <div className="card-elevated">
          {/* Status Banner */}
          <div className={`text-center py-4 rounded-lg mb-4 ${
            isValid ? 'bg-[#28A745]/10' : isDenied ? 'bg-[#FF0000]/10' : 'bg-warning/10'
          }`}>
            {isValid && <CheckCircle className="w-12 h-12 mx-auto mb-2 text-[#28A745]" />}
            {isDenied && <XCircle className="w-12 h-12 mx-auto mb-2 text-[#FF0000]" />}
            {isExpired && <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-warning" />}
            <h2 className="text-xl font-bold" style={{ color: isValid ? '#28A745' : isDenied ? '#FF0000' : undefined }}>
              {isValid ? 'VALID GATEPASS' : isDenied ? 'DENIED' : 'EXPIRED'}
            </h2>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            {[
              ['Gatepass ID', request.id.slice(0, 8).toUpperCase()],
              ['Name', request.name],
              ['Registration No', request.regNumber],
              ['Institution', request.institution],
              ['Room Number', request.roomNumber],
              ['Type', request.type === 'leave' ? 'Leave Pass' : 'Outing Pass'],
              ['Out Date & Time', new Date(request.outDateTime).toLocaleString()],
              ['In Date & Time', new Date(request.inDateTime).toLocaleString()],
              ['Status', request.status.toUpperCase()],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1 border-b border-border">
                <span className="font-semibold text-foreground">{label}</span>
                <span className="text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyGatepass;
