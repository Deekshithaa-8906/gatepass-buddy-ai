import { createBrowserRouter } from "react-router";
import { Home } from "./components/Home";
import { Login } from "./components/Login";
import { CreateAccount } from "./components/CreateAccount";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminLogin } from "./components/AdminLogin";
import { StudentOnboarding } from "./components/StudentOnboarding";
import { StudentDashboard } from "./components/StudentDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/create-account",
    Component: CreateAccount,
  },
  {
    path: "/admin-login",
    Component: AdminLogin,
  },
  {
    path: "/admin",
    Component: AdminDashboard,
  },
  {
    path: "/onboarding/student",
    Component: StudentOnboarding,
  },
  {
    path: "/student-dashboard",
    Component: StudentDashboard,
  }
]);
