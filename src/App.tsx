import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import WardenDashboard from "./pages/WardenDashboard";
import PrincipalDashboard from "./pages/PrincipalDashboard";
import VerifyGatepass from "./pages/VerifyGatepass";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminAccess from "./pages/AdminAccess";

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
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/access" element={<AdminAccess />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/warden" element={<WardenDashboard />} />
            <Route path="/principal" element={<PrincipalDashboard />} />
            <Route path="/verify/:id" element={<VerifyGatepass />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
