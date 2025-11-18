import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  BarChart3, 
  FolderOpen, 
  Settings as SettingsIcon 
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/analytics", label: "Gráficos", icon: BarChart3 },
  { href: "/categories", label: "Categorías", icon: FolderOpen },
  { href: "/settings", label: "Configuración", icon: SettingsIcon },
];

function Router() {
  return (
    <Switch>
      <Route path="/">
        <DashboardLayout navItems={navItems}>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path="/transactions">
        <DashboardLayout navItems={navItems}>
          <Transactions />
        </DashboardLayout>
      </Route>
      <Route path="/analytics">
        <DashboardLayout navItems={navItems}>
          <Analytics />
        </DashboardLayout>
      </Route>
      <Route path="/categories">
        <DashboardLayout navItems={navItems}>
          <Categories />
        </DashboardLayout>
      </Route>
      <Route path="/settings">
        <DashboardLayout navItems={navItems}>
          <Settings />
        </DashboardLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
