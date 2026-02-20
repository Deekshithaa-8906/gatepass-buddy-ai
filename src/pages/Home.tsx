import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import snsLogo from '@/assets/sns-logo.png';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* 1️⃣ Official SNS Institutional Header */}
      <div className="w-full bg-white border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          {/* Logo placeholder */}
          <div className="flex-shrink-0 h-14 w-14 flex items-center justify-center">
            <img src={snsLogo} alt="SNS Institutions Logo" className="h-14 w-14 object-contain" />
          </div>
          {/* Center text */}
          <div className="flex flex-col leading-tight">
            <span className="text-base sm:text-lg font-bold text-foreground tracking-wide">
              SNS Institutions
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              Hostel Management System
            </span>
          </div>
        </div>
      </div>

      {/* 2️⃣ PassNTrack Navbar */}
      <header className="gradient-hero text-primary-foreground py-3 px-6 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <span className="text-xl font-display font-bold tracking-tight">PassNTrack</span>
        </div>
      </header>

      {/* 3️⃣ Centered Title Section */}
      <section className="bg-muted/40 border-b border-border py-10 px-6 text-center">
        <h1 className="text-4xl sm:text-[42px] font-display font-extrabold text-foreground leading-tight tracking-tight">
          SNS Institutions – Hostel Management System
        </h1>
      </section>

      {/* 4️⃣ Welcome / Login Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full text-center space-y-8">

          <h2 className="text-3xl font-display font-bold text-foreground">
            Welcome
          </h2>

          <p className="text-base text-muted-foreground max-w-md mx-auto">
            Manage outing passes, leave requests, and complaints — streamlined for students, mentors, and administrators.
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

          {/* Role chips */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
            {['Student', 'Mentor', 'Advisor', 'HOD', 'Warden'].map(role => (
              <div key={role} className="card-elevated text-center py-3 px-2">
                <p className="text-sm font-semibold text-foreground">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        © 2026 PassNTrack — SNS Institutions Hostel Management System
      </footer>
    </div>
  );
};

export default Home;
