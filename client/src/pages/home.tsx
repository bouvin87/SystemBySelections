import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { ClipboardList, AlertTriangle, BarChart3, Plus, TrendingUp } from "lucide-react";
import { useState } from "react";
import FormModal from "@/components/FormModal";
import DeviationModal from "@/components/DeviationModal";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useLocation } from "wouter";
import ChecklistSelectionModal from "@/components/ChecklistSelectionModal";
import AnimatedNav from "@/components/testmenu";

export default function Home() {
  const { user } = useAuth();
  const { isMobile } = useDeviceType();
  const [, setLocation] = useLocation();
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeviationModal, setShowDeviationModal] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);
  const [checklistSelectionOpen, setChecklistSelectionOpen] = useState(false);

  // Query for production statistics
  const { data: responses = [] } = useQuery({
    queryKey: ["/api/responses"],
    retry: false
  });

  const { data: deviations = [] } = useQuery({
    queryKey: ["/api/deviations"],
    retry: false
  });

  const { data: activeChecklists = [] } = useQuery({
    queryKey: ["/api/checklists/active"],
    retry: false
  });

  const displayName = (user as any)?.name || user?.email?.split('@')[0] || "Användare";
  
  // Calculate today's count from responses
  const today = new Date().toDateString();
  const todayCount = (responses as any[]).filter((response: any) => 
    new Date(response.createdAt).toDateString() === today
  ).length;
  
  // Calculate open deviations count
  const openDeviationsCount = (deviations as any[]).filter((deviation: any) => 
    deviation.status?.name !== "Stängd" && deviation.status?.name !== "Löst"
  ).length;

  const handleNewChecklist = () => {

      setChecklistSelectionOpen(true);

  };

  const handleNewDeviation = () => {

      setShowDeviationModal(true);

  };

  const handleChecklistSelect = (checklistId: number) => {

      setSelectedChecklistId(checklistId);
      setShowFormModal(true);
    
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-[theme(spacing.20)]">
      <Navigation />
      
      <main className="max-w-md mx-auto px-4 pt-6 pb-32 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Hej {displayName}</h1>

        </div>

        {/* Status Cards */}
        <div className="modern-card-grid">
          <div className="modern-stats-card bg-pastel-purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{(activeChecklists as any[]).length}</p>
                <p className="text-sm text-muted-foreground">Aktiva checklistor</p>
              </div>
              <ClipboardList className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="modern-stats-card bg-pastel-yellow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{openDeviationsCount}</p>
                <p className="text-sm text-muted-foreground">Öppna avvikelser</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-accent-foreground" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Snabbåtgärder</p>
          <div className="modern-card-grid">
            <button 
              onClick={handleNewChecklist}
              className="modern-action-card bg-pastel-green text-left"
            >
              <Plus className="h-5 w-5 mb-2 text-success" />
              <p className="font-medium text-sm">Ny kontroll</p>
              <p className="text-xs text-muted-foreground">Starta en ny checklista</p>
            </button>

            <button 
              onClick={handleNewDeviation}
              className="modern-action-card bg-pastel-yellow text-left"
            >
              <AlertTriangle className="h-5 w-5 mb-2 text-accent" />
              <p className="font-medium text-sm">Rapportera avvikelse</p>
              <p className="text-xs text-muted-foreground">Ny avvikelserapport</p>
            </button>

            <button 
              onClick={() => setLocation("/deviations")}
              className="rounded-xl bg-pastel-purple p-4 text-left hover:bg-purple-100 transition-colors"
            >
              <BarChart3 className="h-5 w-5 mb-2 text-primary" />
              <p className="font-medium text-sm">Visa avvikelser</p>
              <p className="text-xs text-muted-foreground">Alla avvikelserapporter</p>
            </button>

            <button 
              onClick={() => setLocation("/checklists")}
              className="rounded-xl bg-pastel-gray p-4 text-left hover:bg-surface DEFAULT transition-colors"
            >
              <ClipboardList className="h-5 w-5 mb-2 text-primary" />
              <p className="font-medium text-sm">Checklistor</p>
              <p className="text-xs text-muted-foreground">Visa alla checklistor</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Senaste aktivitet</p>
          <div className="space-y-2">
            {(responses as any[]).filter((response: any) => 
              new Date(response.createdAt).toDateString() === today
            ).slice(0, 3).map((response: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-surface.subtle rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-success rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Kontroll slutförd</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(response.createdAt).toLocaleTimeString('sv-SE')}
                    </p>
                  </div>
                </div>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            ))}

            {todayCount === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Inga kontroller registrerade idag</p>
                <p className="text-xs">Börja genom att skapa en ny kontroll</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <FormModal 
        isOpen={showFormModal} 
        preselectedChecklistId={selectedChecklistId || undefined}
        onClose={() => {
          setShowFormModal(false);
          setSelectedChecklistId(null);
        }} 
      />
      <DeviationModal 
        isOpen={showDeviationModal} 
        onClose={() => setShowDeviationModal(false)} 
      />

      {checklistSelectionOpen && (
        <ChecklistSelectionModal
          isOpen={checklistSelectionOpen}
          onClose={() => setChecklistSelectionOpen(false)}
          onSelectChecklist={(checklistId: number) => {
            setChecklistSelectionOpen(false);
            handleChecklistSelect(checklistId);
          }}
        />
      )}
    </div>
  );

}