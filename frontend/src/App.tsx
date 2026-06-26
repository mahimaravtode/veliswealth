import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AnimatePresence, motion } from "framer-motion";
import {
  PieChart,
  Menu,
  X,
  LogOut,
  Users,
  FileText,
  HandCoins,
  Sun,
  Moon,
  LayoutDashboard,
  Briefcase,
  Target as TargetIcon,
  Shield,
  Receipt,
  Wrench,
  ArrowLeftRight,
  Bell,
  ArrowLeftRight as TransactionsIcon,
  Activity,
  UserCircle,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "./hooks/useNotifications";
import Dashboard from "./pages/Dashboard";
import LiveMarket from "./pages/LiveMarket";
import Goals from "./pages/Goals";
import Portfolio from "./pages/Portfolio";
import RiskProfiling from "./pages/RiskProfiling";
import Insurance from "./pages/Insurance";
import FinancialTools from "./pages/FinancialTools";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import InvestFlow from "./pages/InvestFlow";
import Research from "./pages/Research";
import LoanTracker from "./pages/LoanTracker";
import Transactions from "./pages/Transactions";
import MutualFunds from "./pages/MutualFunds";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AIAdvisor from "./pages/AIAdvisor";
import AIChat from "./components/ui/AIChat";
import { useUIStore } from "./store/useUIStore";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeToggle } from "./hooks/useThemeToggle";
import { FinLeapLogo } from "./components/FinLeapLogo";
import { SplashScreen } from "./components/SplashScreen";

function Layout({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { isDark, animatedToggle } = useThemeToggle();
  const { user, logout } = useAuthStore();
  const { notifications, unread, markRead, dismiss } = useNotifications();
  const location = useLocation();
  const isClient = user?.role === "Client";

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/", roles: ["Client"] },
    {
      icon: Users,
      label: "Client Management",
      path: "/employee",
      roles: ["Employee", "Admin"],
    },
    {
      icon: Activity,
      label: "Live Market",
      path: "/live-market",
      roles: ["Client", "Employee", "Admin"],
    },
    {
      icon: Briefcase,
      label: "Mutual Funds",
      path: "/mutual-funds",
      roles: ["Client", "Employee", "Admin"],
    },
    {
      icon: FileText,
      label: "Research",
      path: "/research",
      roles: ["Client", "Employee", "Admin"],
    },
    {
      icon: PieChart,
      label: "Portfolio",
      path: "/portfolio",
      roles: ["Client"],
    },
    { icon: TargetIcon, label: "Goals", path: "/goals", roles: ["Client"] },
    {
      icon: HandCoins,
      label: "Loan Tracker",
      path: "/loans",
      roles: ["Client"],
    },
    {
      icon: ArrowLeftRight,
      label: "Invest",
      path: "/invest",
      roles: ["Client"],
    },
    {
      icon: Receipt,
      label: "Insurance",
      path: "/insurance",
      roles: ["Client"],
    },
    { icon: Shield, label: "Risk Profile", path: "/risk", roles: ["Client"] },
    {
      icon: Wrench,
      label: "Tools",
      path: "/tools",
      roles: ["Client", "Employee", "Admin"],
    },
    {
      icon: TransactionsIcon,
      label: "Transactions",
      path: "/transactions",
      roles: ["Client"],
    },
    {
      icon: Sparkles,
      label: "AI Advisor",
      path: "/ai-advisor",
      roles: ["Client"],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role || "Client"),
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div className="flex h-screen bg-background overflow-hidden">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out",
            "bg-sidebar border-r border-sidebar-border",
            sidebarOpen ? "w-64" : "w-17",
            "md:relative md:translate-x-0",
            !sidebarOpen && "max-md:-translate-x-full",
          )}
        >
          <div
            className={cn(
              "flex items-center h-16 px-4 border-b border-sidebar-border shrink-0 cursor-pointer",
              sidebarOpen ? "justify-between" : "justify-center",
            )}
            onClick={toggleSidebar}
          >
            {sidebarOpen && (
              <Link
                to="/"
                className="flex items-center gap-2.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-1.5 bg-sidebar-primary rounded-lg text-sidebar-primary-foreground">
                  <FinLeapLogo className="h-5 w-5" />
                </div>
                <span className="font-bold text-lg tracking-tight text-sidebar-foreground">
                  FinLeap
                </span>
              </Link>
            )}
            {!sidebarOpen && (
              <Link
                to="/"
                className="p-1.5 bg-sidebar-primary rounded-lg text-sidebar-primary-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <FinLeapLogo className="h-5 w-5" />
              </Link>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {filteredNavItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              const link = (
                <Link key={item.path} to={item.path}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
                      !sidebarOpen && "justify-center",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0",
                        active && "text-sidebar-primary-foreground",
                      )}
                    />
                    {sidebarOpen && (
                      <span
                        className={cn(
                          "text-sm font-medium truncate",
                          active && "font-semibold",
                        )}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>
                </Link>
              );

              if (!sidebarOpen) {
                return (
                  <TooltipProvider key={item.path} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }
              return link;
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 bg-background/80 backdrop-blur-sm border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={toggleSidebar}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            <div className="flex items-center gap-1">
              {/* Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 relative"
                  >
                    <Bell className="h-4.5 w-4.5" />
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unread > 0 && (
                      <span className="text-[10px] font-normal text-muted-foreground">
                        {unread} unread
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                      <Bell className="h-8 w-8 mb-2 opacity-30" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.map((notif) => {
                        const iconMap = {
                          success: (
                            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                          ),
                          warning: (
                            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                          ),
                          info: (
                            <Info className="h-4 w-4 text-primary shrink-0" />
                          ),
                        };
                        return (
                          <div
                            key={notif.id}
                            className={cn(
                              "flex items-start gap-2.5 px-2 py-2.5 cursor-default rounded-sm hover:bg-accent",
                              notif.read && "opacity-50",
                            )}
                          >
                            {iconMap[notif.type]}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium truncate">
                                  {notif.title}
                                </p>
                                {!notif.read && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {notif.time}
                              </p>
                            </div>
                            <div className="flex flex-col gap-0.5 shrink-0">
                              {!notif.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => markRead(notif.id)}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => dismiss(notif.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={animatedToggle}
              >
                {isDark ? (
                  <Sun className="h-4.5 w-4.5" />
                ) : (
                  <Moon className="h-4.5 w-4.5" />
                )}
              </Button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {user?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || user?.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive focus:text-destructive flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>

      {isClient && (
        <>
          <AnimatePresence>
            {!chatOpen && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="fixed bottom-6 right-6 z-50"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      className="relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl"
                      onClick={() => setChatOpen(true)}
                      aria-label="Open FinLeap AI chat"
                    >
                      <Sparkles className="h-6 w-6" />
                      <span className="absolute inset-0 rounded-full ring-2 ring-primary/30 animate-ping opacity-40" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">FinLeap AI Advisor</TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
          <AIChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
        </>
      )}
    </>
  );
}

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" />;

  if (roles && !roles.includes(user?.role || "Client")) {
    return <Navigate to="/" />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
    <Router>
      <TooltipProvider>
        <AnimatePresence mode="wait">
          {showSplash && (
            <SplashScreen onComplete={() => setShowSplash(false)} />
          )}
        </AnimatePresence>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <PrivateRoute roles={["Client"]}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/employee"
            element={
              <PrivateRoute roles={["Employee", "Admin"]}>
                <EmployeeDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/mutual-funds"
            element={
              <PrivateRoute>
                <MutualFunds />
              </PrivateRoute>
            }
          />
          <Route
            path="/live-market"
            element={
              <PrivateRoute>
                <LiveMarket />
              </PrivateRoute>
            }
          />
          <Route
            path="/portfolio"
            element={
              <PrivateRoute roles={["Client"]}>
                <Portfolio />
              </PrivateRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <PrivateRoute roles={["Client"]}>
                <Goals />
              </PrivateRoute>
            }
          />
          <Route
            path="/risk"
            element={
              <PrivateRoute roles={["Client"]}>
                <RiskProfiling />
              </PrivateRoute>
            }
          />
          <Route
            path="/insurance"
            element={
              <PrivateRoute roles={["Client"]}>
                <Insurance />
              </PrivateRoute>
            }
          />
          <Route
            path="/tools"
            element={
              <PrivateRoute>
                <FinancialTools />
              </PrivateRoute>
            }
          />
          <Route
            path="/research"
            element={
              <PrivateRoute>
                <Research />
              </PrivateRoute>
            }
          />
          <Route
            path="/loans"
            element={
              <PrivateRoute roles={["Client"]}>
                <LoanTracker />
              </PrivateRoute>
            }
          />
          <Route
            path="/invest"
            element={
              <PrivateRoute roles={["Client"]}>
                <InvestFlow />
              </PrivateRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <PrivateRoute roles={["Client"]}>
                <Transactions />
              </PrivateRoute>
            }
          />
          <Route
            path="/ai-advisor"
            element={
              <PrivateRoute roles={["Client"]}>
                <AIAdvisor />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </TooltipProvider>
    </Router>
    </GoogleOAuthProvider>
  );
}
