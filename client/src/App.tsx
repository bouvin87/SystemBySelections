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
import MobileChecklistPage from "@/pages/mobile-checklist";
import MobileDeviationPage from "@/pages/mobile-deviation";
import KanbanOverview from "@/pages/kanban-overview";
import KanbanDetails from "@/pages/kanban-details";
import { useState, useEffect } from "react";
import { ModuleGuard } from "./pages/moduleguard";
import ModuleMissing from "./pages/modulemissing";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [systemAnnouncement, setSystemAnnouncement] = useState<{ message: string } | null>(null);

  // Check for system announcements when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const checkSystemAnnouncement = async () => {
        try {
          const token = localStorage.getItem('authToken');
          if (!token) return;

          const response = await fetch('/api/system/announcements/active', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const announcement = await response.json();
            if (announcement && announcement.message) {
              setSystemAnnouncement(announcement);
            }
          }
        } catch (error) {
          console.error('Error fetching system announcement:', error);
        }
      };

      // Delay to ensure the user is fully logged in
      const timer = setTimeout(checkSystemAnnouncement, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);

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
       
        <Route path="/admin" component={Admin} />
        <Route path="/module-missing" component={ModuleMissing} />
        <Route path="/faq" component={FAQ} />
        
        
        {/* Kanban routes */}
        <Route path="/kanban" component={() => (
          <ModuleGuard module="kanban">
            <KanbanOverview />
          </ModuleGuard>
        )} />
        <Route path="/kanban/:boardId" component={(params) => (
          <ModuleGuard module="kanban">
            <KanbanDetails />
          </ModuleGuard>
        )} />
        
        {/* Checklist routes */}
        <Route path="/checklists" component={(params) => (
          <ModuleGuard module="checklists">
            <Checklists />
          </ModuleGuard>
        )} />
        <Route path="/checklist-editor/:id" component={(params) => (
          <ModuleGuard module="checklists">
            <ChecklistEditor />
          </ModuleGuard>
        )} />
        <Route path="/checklist/:id/start" component={(params) => (
          <ModuleGuard module="checklists">
            <ChecklistStart />
          </ModuleGuard>
        )} />
        <Route path="/checklist/:id/dashboard">
          {(params: { id: string }) => (
            <ModuleGuard module="checklists">
              <ChecklistDashboard checklistId={params.id} />
            </ModuleGuard>
          )}
        </Route>

        {/* Deviations routes */}
        <Route path="/deviations/:id">
          {(params: { id: string }) => (
            <ModuleGuard module="deviations">
              <DeviationDetail />
            </ModuleGuard>
          )}
        </Route>

        <Route path="/deviations">
          {() => (
            <ModuleGuard module="deviations">
              <Deviations />
            </ModuleGuard>
          )}
        </Route>

        
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
