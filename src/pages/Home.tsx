import { useNavigate } from 'react-router-dom';
import { GraduationCap, Shield, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="gradient-hero text-primary-foreground py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Shield className="w-8 h-8" />
          <h1 className="text-2xl font-display font-bold tracking-tight">SNS Institutions</h1>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <GraduationCap className="w-4 h-4" />
            Hostel Gatepass Management
          </div>

          <h2 className="text-5xl md:text-6xl font-display font-extrabold text-foreground leading-tight">
            Welcome
          </h2>

          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Manage outing passes, leave requests, and complaints — all in one streamlined platform for students, mentors, and administrators.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="btn-hero gap-2"
              onClick={() => navigate('/login')}
            >
              <LogIn className="w-5 h-5" />
              Login
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all px-8 py-3 text-lg font-semibold"
              onClick={() => navigate('/register')}
            >
              <UserPlus className="w-5 h-5" />
              Create Account
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-8">
            {['Student', 'Mentor', 'Advisor', 'HOD', 'Warden'].map(role => (
              <div key={role} className="card-elevated text-center py-3 px-2">
                <p className="text-sm font-medium text-foreground">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        © 2026 SNS Institutions — Hostel Gatepass System
      </footer>
    </div>
  );
};

export default Home;
