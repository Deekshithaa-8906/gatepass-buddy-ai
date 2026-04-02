import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from "@/contexts/AuthContext";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import { CreateAccount } from "./pages/Register";
import { VerifyOTP } from "./pages/VerifyOTP";
import { PendingApproval } from "./pages/PendingApproval";
import { CreatePassword } from "./pages/CreatePassword";
import ResetPassword from "./pages/ResetPassword";
import { StudentDashboard } from "./pages/StudentDashboard";
import { StudentOnboarding } from "./pages/StudentOnboarding";
import StaffDashboard from "./pages/StaffDashboard";
import PrincipalDashboard from "./pages/PrincipalDashboard";
import { WardenDashboard } from "./pages/WardenDashboard";
import NotFound from "./pages/NotFound";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminAccess";

const queryClient = new QueryClient();

const App = () => (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<CreateAccount />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/create-password" element={<CreatePassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin/access" element={<AdminDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
            <Route path="/warden-dashboard" element={<WardenDashboard />} />
            <Route path="/principal-dashboard" element={<PrincipalDashboard />} />
            <Route path="/student-onboarding" element={<StudentOnboarding />} />
            <Route path="/onboarding/student" element={<StudentOnboarding />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
