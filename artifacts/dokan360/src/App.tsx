import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Store } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PageSubtitleProvider } from "@/contexts/PageSubtitleContext";
import { AppLayout } from "@/layouts/AppLayout";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// ─── Lazy-loaded page chunks ───────────────────────────────────────────────────
// Each page is a separate JS chunk — only downloaded when the user navigates
// to that route for the first time. Keeps the initial bundle minimal.
const Login    = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Dashboard  = lazy(() => import("@/pages/Dashboard"));
const POS        = lazy(() => import("@/pages/POS"));
const Products   = lazy(() => import("@/pages/Products"));
const Inventory  = lazy(() => import("@/pages/Inventory"));
const Customers  = lazy(() => import("@/pages/Customers"));
const Sales      = lazy(() => import("@/pages/Sales"));
const Reports    = lazy(() => import("@/pages/Reports"));
const Settings   = lazy(() => import("@/pages/Settings"));
const Suppliers  = lazy(() => import("@/pages/Suppliers"));
const Purchases  = lazy(() => import("@/pages/Purchases"));
const AuditLogs  = lazy(() => import("@/pages/AuditLogs"));
const Employees        = lazy(() => import("@/pages/Employees"));
const EmployeeProfile  = lazy(() => import("@/pages/EmployeeProfile"));
const Attendance       = lazy(() => import("@/pages/Attendance"));
const Schedule         = lazy(() => import("@/pages/Schedule"));
const Leaves           = lazy(() => import("@/pages/Leaves"));
const Payroll          = lazy(() => import("@/pages/Payroll"));
const SalaryGrades     = lazy(() => import("@/pages/SalaryGrades"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

// ─── Page-level loading fallback ───────────────────────────────────────────────
// Shown inside the AppLayout content area while a lazy page chunk downloads.
// The sidebar and topbar remain visible — only the content swaps.
function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Store className="h-6 w-6 text-primary/50 animate-pulse" />
    </div>
  );
}

// ─── Global auth loading gate ──────────────────────────────────────────────────
// Shown whenever isLoading=true:
//   • App first loads  (checking saved session)
//   • After login      (fetching user profile from /api/auth/me)
// This prevents ProtectedRoute from flash-redirecting to /login while the
// user profile request is in-flight.
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
            <Store className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <Skeleton className="h-2.5 w-28 rounded-full" />
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Protected route ───────────────────────────────────────────────────────────
// isLoading is always false here (AuthGate renders nothing while loading).
// Suspense is placed INSIDE AppLayout so the sidebar/topbar stay visible
// while the lazy page chunk is being downloaded.
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/login" />;
  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </AppLayout>
  );
}

function Router() {
  const { user } = useAuth();
  return (
    <Suspense fallback={null}>
      <Switch>
        <Route path="/login">
          {user ? <Redirect to="/" /> : <Login />}
        </Route>
        <Route path="/register">
          {user ? <Redirect to="/" /> : <Register />}
        </Route>
        <Route path="/"          component={() => <ProtectedRoute component={Dashboard}  />} />
        <Route path="/pos"       component={() => <ProtectedRoute component={POS}        />} />
        <Route path="/products"  component={() => <ProtectedRoute component={Products}   />} />
        <Route path="/inventory" component={() => <ProtectedRoute component={Inventory}  />} />
        <Route path="/customers" component={() => <ProtectedRoute component={Customers}  />} />
        <Route path="/sales"     component={() => <ProtectedRoute component={Sales}      />} />
        <Route path="/reports"   component={() => <ProtectedRoute component={Reports}    />} />
        <Route path="/settings"   component={() => <ProtectedRoute component={Settings}   />} />
        <Route path="/suppliers"   component={() => <ProtectedRoute component={Suppliers}  />} />
        <Route path="/purchases"   component={() => <ProtectedRoute component={Purchases}  />} />
        <Route path="/audit-logs"  component={() => <ProtectedRoute component={AuditLogs}  />} />
        <Route path="/employees"      component={() => <ProtectedRoute component={Employees}       />} />
        <Route path="/employees/:id"  component={() => <ProtectedRoute component={EmployeeProfile}  />} />
        <Route path="/attendance"     component={() => <ProtectedRoute component={Attendance}        />} />
        <Route path="/schedule"       component={() => <ProtectedRoute component={Schedule}          />} />
        <Route path="/leaves"         component={() => <ProtectedRoute component={Leaves}            />} />
        <Route path="/payroll"        component={() => <ProtectedRoute component={Payroll}           />} />
        <Route path="/salary-grades"  component={() => <ProtectedRoute component={SalaryGrades}      />} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <PageSubtitleProvider>
                  <AuthProvider>
                    <AuthGate>
                      <ErrorBoundary>
                        <Router />
                      </ErrorBoundary>
                    </AuthGate>
                  </AuthProvider>
                </PageSubtitleProvider>
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
