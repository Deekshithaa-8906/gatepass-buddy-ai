import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import snsLogo from '@/assets/sns-logo.png';
import campusBg from '@/assets/sns-campus-bg.png';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Background image with overlay */}
      <div className="fixed inset-0 z-0">
        <img src={campusBg} alt="" className="w-full h-full object-cover opacity-50" />
      </div>
      {/* Content above background */}
      <div className="relative z-10 min-h-screen flex flex-col">

      {/* 1️⃣ Official SNS Institutional Header */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-white border-b border-border shadow-sm"
      >
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex-shrink-0 h-14 w-14 flex items-center justify-center">
            <img src={snsLogo} alt="SNS Institutions Logo" className="h-14 w-14 object-contain" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base sm:text-lg font-bold text-foreground tracking-wide">
              SNS Institutions
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              Hostel Management System
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2️⃣ PassNTrack Navbar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="gradient-hero text-primary-foreground py-3 px-6 shadow-md"
      >
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <span className="text-xl font-display font-bold tracking-tight">PassNTrack</span>
        </div>
      </motion.header>

      {/* 3️⃣ Centered Title Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-muted/40 border-b border-border py-10 px-6 text-center"
      >
        <h1 className="text-4xl sm:text-[42px] font-display font-extrabold text-foreground leading-tight tracking-tight">
          SNS Institutions – Hostel Management System
        </h1>
      </motion.section>

      {/* 4️⃣ Welcome / Login Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="max-w-2xl w-full text-center space-y-8"
        >

          <h2 className="text-3xl font-display font-bold text-foreground">
            Welcome
          </h2>

          <p className="text-base font-bold text-foreground max-w-md mx-auto">
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
              className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 px-8 py-3 text-lg font-semibold hover:scale-105"
              onClick={() => navigate('/register')}
            >
              <UserPlus className="w-5 h-5" />
              Create Account
            </Button>
          </div>

          {/* Role chips */}
          <div className="flex justify-center flex-nowrap gap-3.5 items-center pt-4 overflow-x-auto px-2">
            {['Student', 'Mentor', 'Advisor', 'HOD', 'Warden', 'Principal', 'Management'].map((role, i) => (
              <motion.div
                key={role}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="card-elevated text-center py-3 px-3 min-w-[90px] flex-shrink-0 hover:scale-105 transition-transform duration-200"
              >
                <p className="text-sm font-semibold text-foreground whitespace-nowrap">{role}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <footer className="py-4 text-center text-sm text-foreground font-bold border-t">
        © 2026 PassNTrack — SNS Institutions Hostel Management System
      </footer>
      </div>
    </div>
  );
};

export default Home;
