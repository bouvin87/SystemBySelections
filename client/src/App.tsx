import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SystemAnnouncementToast } from "@/components/SystemAnnouncementToast";
import Home from "@/pages/home";
import Checklists from "@/pages/checklists";
import Admin from "@/pages/admin";
import SuperAdmin from "@/pages/SuperAdmin";
import ChecklistEditor from "@/pages/checklist-editor";
import ChecklistStart from "@/pages/checklist-start";
import ChecklistDashboard from "@/pages/checklist-dashboard";
import FAQ from "@/pages/faq";
import Deviations from "@/pages/deviations";
import DeviationDetail from "@/pages/deviation-detail";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [systemAnnouncement, setSystemAnnouncement] = useState<{ message: string } | null>(null);

  // Listen for system announcement events
  useEffect(() => {
    const handleShowAnnouncement = (event: CustomEvent) => {
      const { announcement } = event.detail;
      setSystemAnnouncement(announcement);
    };

    window.addEventListener('show-system-announcement', handleShowAnnouncement as EventListener);
    return () => {
      window.removeEventListener('show-system-announcement', handleShowAnnouncement as EventListener);
    };
  }, []);

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
    <>
      {/* System announcement toast */}
      {systemAnnouncement && (
        <SystemAnnouncementToast
          message={systemAnnouncement.message}
          onClose={() => setSystemAnnouncement(null)}
        />
      )}
      
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/checklists" component={Checklists} />
        <Route path="/admin" component={Admin} />
        <Route path="/checklist-editor/:id" component={ChecklistEditor} />
        <Route path="/checklist/:id/start" component={ChecklistStart} />
        <Route path="/checklist/:id/dashboard">
          {(params) => <ChecklistDashboard checklistId={params.id} />}
        </Route>
        <Route path="/faq" component={FAQ} />
        <Route path="/deviations/:id" component={DeviationDetail} />
        <Route path="/deviations" component={Deviations} />
        <Route component={NotFound} />
      </Switch>
    </>
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
