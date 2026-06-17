import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {
  BarChart3,
  Sun,
  Moon,
  LogOut,
  User,
  FileText,
  Star,
  Briefcase,
  Calendar,
  LayoutGrid,
  PiggyBank,
  CandlestickChart,
  Newspaper,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingDock } from "@/components/ui/FloatingDock";
import { NavSidebar } from "@/components/ui/NavSidebar";
import Research from "./pages/Research";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import WatchlistPage from "./pages/WatchlistPage";
import PortfolioTrackerPage from "./pages/PortfolioTrackerPage";
import IPOCalendarPage from "./pages/IPOCalendarPage";
import SectorPerformancePage from "./pages/SectorPerformancePage";
import MutualFundsPage from "./pages/MutualFundsPage";
import FNODataPage from "./pages/FNODataPage";
import MarketNewsPage from "./pages/MarketNewsPage";
import MarketHolidaysPage from "./pages/MarketHolidaysPage";
import { useUIStore } from "./store/useUIStore";
import { useAuthStore } from "./store/useAuthStore";

const allNavItems = [
  { icon: <BarChart3 size={20} />, label: "Markets", path: "/", roles: ["Client", "Employee", "Admin"] },
  { icon: <FileText size={20} />, label: "Research", path: "/research", roles: ["Client", "Employee", "Admin"] },
  { icon: <Star size={20} />, label: "Watchlist", path: "/watchlist", roles: ["Client"] },
  { icon: <Briefcase size={20} />, label: "Portfolio", path: "/portfolio-tracker", roles: ["Client"] },
  { icon: <LayoutGrid size={20} />, label: "Sectors", path: "/sectors", roles: ["Client", "Employee", "Admin"] },
  { icon: <PiggyBank size={20} />, label: "Mutual Funds", path: "/mutual-funds", roles: ["Client", "Employee", "Admin"] },
  { icon: <CandlestickChart size={20} />, label: "F&O", path: "/fno", roles: ["Client", "Employee", "Admin"] },
  { icon: <Calendar size={20} />, label: "IPO", path: "/ipo", roles: ["Client", "Employee", "Admin"] },
  { icon: <Newspaper size={20} />, label: "News", path: "/news", roles: ["Client", "Employee", "Admin"] },
  { icon: <CalendarClock size={20} />, label: "Holidays", path: "/holidays", roles: ["Client", "Employee", "Admin"] },
  { icon: <User size={20} />, label: "Profile", path: "/profile", roles: ["Client", "Employee", "Admin"] },
];

function TopBar() {
  const { theme, toggleTheme } = useUIStore();
  const { user, logout } = useAuthStore();

  return (
    <header className="fixed lg:ml-64 top-0 z-40 w-full lg:w-[calc(100%-16rem)] bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="flex items-center justify-between px-4 py-3 md:px-8">
        <div />
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 mr-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {user?.name?.charAt(0)}
              </span>
            </div>
            <span className="text-sm font-semibold text-foreground">{user?.name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-2xl h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-2xl h-9 w-9 text-muted-foreground hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  const filteredItems = allNavItems
    .filter((item) => !item.roles || item.roles.includes(user?.role || "Client"))
    .map((item) => ({
      title: item.label,
      icon: item.icon,
      href: item.path,
    }));

  return (
    <div className="min-h-screen bg-background flex">
      <NavSidebar items={filteredItems} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto lg:ml-64">
          <div className="px-4 pt-16 pb-10 md:px-8 w-full">
            {children}
          </div>
        </main>
      </div>
      <FloatingDock items={filteredItems} desktopClassName="lg:hidden" mobileClassName="lg:hidden" />
    </div>
  );
}

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && !roles.includes(user?.role || "Client")) return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Research /></PrivateRoute>} />
        <Route path="/research" element={<PrivateRoute><Research /></PrivateRoute>} />
        <Route path="/watchlist" element={<PrivateRoute><WatchlistPage /></PrivateRoute>} />
        <Route path="/portfolio-tracker" element={<PrivateRoute><PortfolioTrackerPage /></PrivateRoute>} />
        <Route path="/sectors" element={<PrivateRoute><SectorPerformancePage /></PrivateRoute>} />
        <Route path="/mutual-funds" element={<PrivateRoute><MutualFundsPage /></PrivateRoute>} />
        <Route path="/fno" element={<PrivateRoute><FNODataPage /></PrivateRoute>} />
        <Route path="/ipo" element={<PrivateRoute><IPOCalendarPage /></PrivateRoute>} />
        <Route path="/news" element={<PrivateRoute><MarketNewsPage /></PrivateRoute>} />
        <Route path="/holidays" element={<PrivateRoute><MarketHolidaysPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
