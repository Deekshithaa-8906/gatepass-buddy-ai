import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Shield, BookOpen, MessageSquare, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import snsLogo from '@/assets/sns-logo.png';
import campusBg from '@/assets/sns-campus-bg.png';

// Seed default admin account on first load
function seedAdmin() {
  const users = JSON.parse(localStorage.getItem('gatepass_users') || '[]');
  if (!users.find((u: any) => u.role === 'admin')) {
    users.push({
      id: crypto.randomUUID(),
      name: 'Admin',
      phone: 'admin',
      email: 'admin@passntrack.com',
      password: 'admin123',
      role: 'admin',
      accountStatus: 'approved',
    });
    localStorage.setItem('gatepass_users', JSON.stringify(users));
  }
}

const ROLES = ['Student', 'Mentor', 'Advisor', 'HOD', 'Warden', 'Principal', 'Management'];

const HERO_TITLE = 'SNS Institutions – Hostel Management System';

const FEATURES = [
  {
    icon: Shield,
    title: 'Gatepass System',
    desc: 'Streamlined outing & leave pass approvals with multi-level authorization.',
  },
  {
    icon: MessageSquare,
    title: 'Complaint Management',
    desc: 'Auto-escalation from Warden to Principal to Management with timeline tracking.',
  },
  {
    icon: BookOpen,
    title: 'Role-Based Access',
    desc: '8 distinct roles with tailored dashboards and secure approval workflows.',
  },
  {
    icon: HomeIcon,
    title: 'Hostel Management',
    desc: 'Comprehensive student records, room allocation, and admin controls.',
  },
];

const letterVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.03, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => { seedAdmin(); }, []);

  const titleLetters = useMemo(() => HERO_TITLE.split(''), []);

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">
      {/* Background with Ken Burns zoom */}
      <motion.div
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 20, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
        className="fixed inset-0 z-0"
      >
        <img src={campusBg} alt="" className="w-full h-full object-cover" />
      </motion.div>
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 z-0 bg-foreground/35" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Institutional Header */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full bg-card/95 backdrop-blur-sm border-b border-border shadow-sm"
        >
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
            <motion.div
              className="flex-shrink-0 h-14 w-14 flex items-center justify-center"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <img src={snsLogo} alt="SNS Institutions Logo" className="h-14 w-14 object-contain" />
            </motion.div>
            <div className="flex flex-col leading-tight">
              <span className="text-base sm:text-lg font-bold text-foreground tracking-wide">SNS Institutions</span>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">Hostel Management System</span>
            </div>
          </div>
        </motion.div>

        {/* PassNTrack Navbar */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="gradient-hero text-primary-foreground py-3 px-6 shadow-lg sticky top-0 z-50 backdrop-blur-md"
        >
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <motion.span
              className="text-xl font-display font-bold tracking-tight"
              whileHover={{ scale: 1.05 }}
            >
              PassNTrack
            </motion.span>
          </div>
        </motion.header>

        {/* Hero Title with letter-by-letter reveal & animated gradient */}
        <section className="bg-card/60 backdrop-blur-sm border-b border-border py-12 px-6 text-center overflow-hidden">
          <h1 className="text-3xl sm:text-4xl md:text-[42px] font-display font-extrabold leading-tight tracking-tight">
            {titleLetters.map((letter, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={letterVariants}
                initial="hidden"
                animate="visible"
                className="inline-block animated-gradient-text"
                style={{ whiteSpace: letter === ' ' ? 'pre' : undefined }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </motion.span>
            ))}
          </h1>
        </section>

        {/* Welcome Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="max-w-2xl w-full text-center space-y-8">
            {/* Welcome with zoom + fade */}
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="text-3xl font-display font-bold text-card bg-card/70 backdrop-blur-sm rounded-xl py-3 px-6 inline-block text-foreground"
            >
              Welcome
            </motion.h2>

            {/* Subtitle slide-up */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.5 }}
              className="text-base font-semibold text-card-foreground bg-card/70 backdrop-blur-sm rounded-lg py-3 px-4 max-w-lg mx-auto"
            >
              Manage outing passes, leave requests, and complaints — streamlined for students, mentors, and administrators.
            </motion.p>

            {/* Buttons with pop-in */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.8, type: 'spring', stiffness: 200 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="btn-hero gap-2 shadow-lg hover:shadow-xl"
                  onClick={() => navigate('/login')}
                >
                  <LogIn className="w-5 h-5" />
                  Login
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 px-8 py-3 text-lg font-semibold bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl"
                  onClick={() => navigate('/register')}
                >
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </Button>
              </motion.div>
            </motion.div>

            {/* Role chips — staggered appearance */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3 pt-4 max-w-2xl mx-auto">
              {ROLES.map((role, i) => (
                <motion.div
                  key={role}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.0 + i * 0.05, duration: 0.4 }}
                  whileHover={{ scale: 1.08, y: -3 }}
                  className="bg-card/90 backdrop-blur-sm rounded-xl border border-border text-center py-3 px-1 cursor-default shadow-sm hover:shadow-md transition-shadow duration-250"
                >
                  <p className="text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">{role}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Features Section with scroll reveal */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7 }}
            className="max-w-5xl w-full mt-20 px-4"
          >
            <h3 className="text-2xl font-display font-bold text-center mb-10 text-card-foreground bg-card/70 backdrop-blur-sm rounded-xl py-3 px-6 inline-block mx-auto w-fit">
              Key Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="bg-card/90 backdrop-blur-sm rounded-xl border border-border p-6 text-center shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-foreground mb-2">{feat.title}</h4>
                  <p className="text-sm text-muted-foreground">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </main>

        <footer className="py-4 text-center text-sm text-card-foreground font-bold border-t border-border bg-card/70 backdrop-blur-sm">
          © 2026 PassNTrack — SNS Institutions Hostel Management System
        </footer>
      </div>
    </div>
  );
};

export default Home;
