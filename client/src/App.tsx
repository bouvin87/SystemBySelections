import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import SuperAdmin from "@/pages/SuperAdmin";
import ChecklistEditor from "@/pages/checklist-editor";
import ChecklistStart from "@/pages/checklist-start";
import ChecklistDashboard from "@/pages/checklist-dashboard";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Redirect superadmin to super-admin panel
  if (user?.role === 'superadmin') {
    return (
      <Switch>
        <Route path="/" component={SuperAdmin} />
        <Route path="/super-admin" component={SuperAdmin} />
        <Route component={() => <SuperAdmin />} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={Admin} />
      <Route path="/checklist-editor/:id" component={ChecklistEditor} />
      <Route path="/checklist/:id/start" component={ChecklistStart} />
      <Route path="/checklist/:id/dashboard">
        {(params) => <ChecklistDashboard checklistId={params.id} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
