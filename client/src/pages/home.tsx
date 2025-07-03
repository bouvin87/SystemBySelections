import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { useState } from "react";
import { useLocation } from "wouter";
import { HomeScreenChecklistModule, HomeScreenDeviationModule } from "@/components/HomeScreenModules";
import FormModal from "@/components/FormModal";
import DeviationModal from "@/components/DeviationModal";
import ChecklistSelectionModal from "@/components/ChecklistSelectionModal";
import type { ChecklistResponse, Checklist, Deviation, DeviationStatus } from "@shared/schema";


export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeviationModal, setShowDeviationModal] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);
  const [checklistSelectionOpen, setChecklistSelectionOpen] = useState(false);
  const { data: authData } = useQuery({ queryKey: ["/api/auth/me"], retry: false });
  const hasChecklistsModule = authData?.tenant?.modules?.includes("checklists") ?? false;
  const hasDeviationsModule = authData?.tenant?.modules?.includes("deviations") ?? false;
  const { data: responses = [] } = useQuery<ChecklistResponse[]>({
    
    queryKey: ["/api/responses"],
    retry: false,
  });
  const safeResponses = (responses as unknown as ChecklistResponse[]) || [];


  const { data: deviations = [] } = useQuery<Deviation[]>({
    queryKey: ["/api/deviations"],
    retry: false,
  });
  const { data: statuses = [] } = useQuery<DeviationStatus[]>({
    queryKey: ["/api/deviations/statuses"],
  });

  const { data: activeChecklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists/active"],
    retry: false,
  });
  const { data: allChecklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists"],
    retry: false,
  });

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email;
  
  const openDeviations = deviations.filter((deviation) => {
    const status = statuses.find((s) => s.id === deviation.statusId);
    return !status?.isCompleted;
  });
  // Handlers
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
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navigation />

    
      <main className="max-w-7xl mx-auto px-4 pt-6 pb-32 space-y-6">
        {/* Header */}
        <div className="space-y-1 ">
          <h1 className="text-3xl font-bold">Hej {displayName}</h1>
        </div>

        
        <div className="flex flex-col md:flex-row justify-center gap-8">
        {/* Deviation Section */}
          {hasDeviationsModule && (
            <div className="">
              <HomeScreenDeviationModule
                deviations={deviations}
                openDeviations={openDeviations.length}
                onNewDeviation={handleNewDeviation}
                onDeviationClick={() => setLocation("/deviations")}
              />
            </div>
          )}
        {/* Checklist Section */}
          {hasChecklistsModule && (
            <div className="">
              <HomeScreenChecklistModule
                responses={safeResponses}
                activeChecklists={activeChecklists}
                checklists={allChecklists}
                onNewChecklist={handleNewChecklist}
                onChecklistClick={() => setLocation("/checklists")}
              />
            </div>
          )}

          {!hasChecklistsModule && !hasDeviationsModule && (
            <p className="text-center text-muted-foreground mt-8">
              Inga moduler är tillgängliga för din organisation.
            </p>
          )}
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
