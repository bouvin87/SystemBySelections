import { AlertTriangle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Icon = ({ name, className }: { name: string; className?: string }) => {
  const LucideIcon = (LucideIcons as any)[name] || LucideIcons["File"];
  return <LucideIcon className={className} />;
};
function getChecklistById(id: number | null, checklists: Checklist[]) {
  return checklists.find((c) => c.id === id);
}

function getLucideIcon(name: string) {
  return (LucideIcons as any)[name] || LucideIcons["File"];
}


interface Deviation {
  id: number;
  title: string;
  status?: {
    name: string;
  };
  createdAt: Date;
}

interface HomeScreenDeviationModuleProps {
  deviations: Deviation[];
  onNewDeviation: () => void;
  onDeviationClick: () => void;
  openDeviations: number;
}

export function HomeScreenDeviationModule({ deviations, onNewDeviation, onDeviationClick, openDeviations }: HomeScreenDeviationModuleProps) {
  

  return (
    <div className="space-y-6">
      {/* Statuskort */}
      <div className="modern-card-grid">
        <div className="modern-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{openDeviations}</p>
              <p className="text-sm text-muted-foreground">Öppna avvikelser</p>
            </div>
            <AlertTriangle className="h-8 w-8 text--accent" />
          </div>
        </div>
      </div>

      {/* Åtgärder */}
      <div className="modern-card-grid">
        <button 
          onClick={onNewDeviation}
          className="modern-action-card text-left"
        >
          <AlertTriangle className="h-5 w-5 mb-2 text-accent" />
          <p className="font-medium text-sm">Rapportera avvikelse</p>
          <p className="text-xs text-muted-foreground">Ny avvikelserapport</p>
        </button>

        <button 
          onClick={onDeviationClick}
          className="modern-action-card text-left"
        >
          <BarChart3 className="h-5 w-5 mb-2 text-primary" />
          <p className="font-medium text-sm">Visa avvikelser</p>
          <p className="text-xs text-muted-foreground">Alla avvikelserapporter</p>
        </button>
      </div>
    </div>
  );
}

import { ClipboardList, Plus, TrendingUp } from "lucide-react";
import { Checklist, ChecklistResponse } from "@shared/schema";


interface HomeScreenChecklistModuleProps {
  activeChecklists: Checklist[];
  responses: ChecklistResponse[];
  checklists: Checklist[];
  onNewChecklist: () => void;
  onChecklistClick: () => void;
}

export function HomeScreenChecklistModule({ activeChecklists, responses, checklists, onNewChecklist, onChecklistClick }: HomeScreenChecklistModuleProps) {
  const today = new Date().toDateString();
  const todayResponses = responses.filter(
    (r) => new Date(r.createdAt).toDateString() === today
  );
  const recentResponses = [...responses]
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 4);
  const getChecklistName = (checklistId: number | null) => {
    if (!checklistId) return "Okänd checklista";
    const found = checklists.find((c) => c.id === checklistId);
    return found?.name || `Checklista #${checklistId}`;
  };

  return (
    <div className="space-y-6">
      {/* Statuskort */}
      <div className="modern-card-grid">
        <div className="modern-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{activeChecklists.length}</p>
              <p className="text-sm text-muted-foreground">Aktiva checklistor</p>
            </div>
            <ClipboardList className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Åtgärder */}
      <div className="modern-card-grid">
        <button 
          onClick={onNewChecklist}
          className="modern-action-card text-left"
        >
          <Plus className="h-5 w-5 mb-2 text-success" />
          <p className="font-medium text-sm">Ny kontroll</p>
          <p className="text-xs text-muted-foreground">Starta en ny checklista</p>
        </button>

        <button 
          onClick={onChecklistClick}
          className="modern-action-card text-left"
        >
          <ClipboardList className="h-5 w-5 mb-2 text-primary" />
          <p className="font-medium text-sm">Checklistor</p>
          <p className="text-xs text-muted-foreground">Visa alla checklistor</p>
        </button>
      </div>

      {/* Senaste aktivitet */}


      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Senaste aktivitet
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 divide-y divide-border ">
          {recentResponses.length > 0 ? (
            recentResponses.map((response, index) => {
              const checklist = getChecklistById(response.checklistId, checklists);
              const IconComponent = checklist?.icon ? getLucideIcon(checklist.icon) : null;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-center space-x-3">
                    {IconComponent ? (
                      <IconComponent className="h-5 w-5 text-success" />
                    ) : (
                      <div className="h-2 w-2 bg-success rounded-full" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{checklist?.name || "Okänd checklista"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(response.createdAt).toLocaleTimeString("sv-SE")}
                      </p>
                    </div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Inga kontroller registrerade idag</p>
              <p className="text-xs">Börja genom att skapa en ny kontroll</p>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}
