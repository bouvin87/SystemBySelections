import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import type { ChecklistResponse, Checklist } from "@shared/schema";

interface DashboardStats {
  totalResponses: number;
  completedResponses: number;
  recentResponses: ChecklistResponse[];
}

interface ChecklistDashboardProps {
  checklistId: string;
}

export default function ChecklistDashboard({ checklistId }: ChecklistDashboardProps) {
  const id = parseInt(checklistId);

  const { data: checklist } = useQuery<Checklist>({
    queryKey: ["/api/checklists", id],
    queryFn: async () => {
      const response = await fetch(`/api/checklists/${id}`);
      if (!response.ok) throw new Error("Failed to fetch checklist");
      return response.json();
    },
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", id],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/stats?checklistId=${id}`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: responses = [] } = useQuery<ChecklistResponse[]>({
    queryKey: ["/api/responses", id],
    queryFn: async () => {
      const response = await fetch(`/api/responses?checklistId=${id}`);
      if (!response.ok) throw new Error("Failed to fetch responses");
      return response.json();
    },
  });

  if (!checklist) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>Laddar...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!checklist.hasDashboard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Dashboard inte aktiverad
              </h3>
              <p className="text-gray-600 mb-6">
                Denna checklista har inte aktiverad dashboard-funktion.
              </p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Tillbaka till startsidan
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Dashboard - {checklist.name}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Totala svar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalResponses || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Slutförda svar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedResponses || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Genomförandeprocent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalResponses 
                  ? Math.round((stats.completedResponses / stats.totalResponses) * 100) 
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Senaste svar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {responses.slice(0, 10).map((response) => (
                <div key={response.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{response.operatorName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(response.createdAt).toLocaleDateString('sv-SE')} {new Date(response.createdAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge variant={response.isCompleted ? "default" : "secondary"}>
                    {response.isCompleted ? "Slutförd" : "Pågående"}
                  </Badge>
                </div>
              ))}
              {responses.length === 0 && (
                <p className="text-center text-gray-500 py-8">Inga svar ännu</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}