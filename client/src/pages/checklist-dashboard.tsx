import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import { ArrowLeft, Filter, Search, Calendar } from "lucide-react";
import { useState } from "react";
import type { ChecklistResponse, Checklist, WorkTask, WorkStation, Shift } from "@shared/schema";

interface DashboardStats {
  totalResponses: number;
  recentResponses: ChecklistResponse[];
}

interface ChecklistDashboardProps {
  checklistId: string;
}

export default function ChecklistDashboard({ checklistId }: ChecklistDashboardProps) {
  const id = parseInt(checklistId);
  
  // Filter state
  const [filters, setFilters] = useState({
    workTaskId: "all",
    workStationId: "all",
    shiftId: "all",
    startDate: "",
    endDate: "",
    search: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  const { data: checklist } = useQuery<Checklist>({
    queryKey: ["/api/checklists", id],
    queryFn: async () => {
      const response = await fetch(`/api/checklists/${id}`);
      if (!response.ok) throw new Error("Failed to fetch checklist");
      return response.json();
    },
  });

  // Fetch filter data
  const { data: workTasks = [] } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
    enabled: checklist?.includeWorkTasks,
  });

  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
    enabled: checklist?.includeWorkStations,
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
    enabled: checklist?.includeShifts,
  });

  // Build query parameters for filtering
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set('checklistId', id.toString());
    
    if (filters.workTaskId && filters.workTaskId !== "all") params.set('workTaskId', filters.workTaskId);
    if (filters.workStationId && filters.workStationId !== "all") params.set('workStationId', filters.workStationId);
    if (filters.shiftId && filters.shiftId !== "all") params.set('shiftId', filters.shiftId);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.search) params.set('search', filters.search);
    
    return params.toString();
  };

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", id, filters],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/stats?${buildQueryParams()}`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: responses = [] } = useQuery<ChecklistResponse[]>({
    queryKey: ["/api/responses", id, filters],
    queryFn: async () => {
      const response = await fetch(`/api/responses?${buildQueryParams()}`);
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

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard - {checklist.name}
          </h1>
          <Button 
            onClick={() => setShowFilters(!showFilters)} 
            variant="outline"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        {showFilters && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter alternativ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <Label htmlFor="search">Sök operatör</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Sök på operatörsnamn..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <Label htmlFor="startDate">Från datum</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Till datum</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>

                {/* Work Task Filter */}
                {checklist.includeWorkTasks && (
                  <div>
                    <Label>Arbetsmoment</Label>
                    <Select
                      value={filters.workTaskId}
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        workTaskId: value,
                        workStationId: "all" // Reset station when task changes
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Alla arbetsmoment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alla arbetsmoment</SelectItem>
                        {workTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id.toString()}>
                            {task.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Work Station Filter */}
                {checklist.includeWorkStations && (
                  <div>
                    <Label>Station</Label>
                    <Select
                      value={filters.workStationId}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, workStationId: value }))}
                      disabled={!filters.workTaskId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Alla stationer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alla stationer</SelectItem>
                        {workStations
                          .filter(station => filters.workTaskId === "all" || !filters.workTaskId || station.workTaskId === parseInt(filters.workTaskId))
                          .map((station) => (
                            <SelectItem key={station.id} value={station.id.toString()}>
                              {station.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Shift Filter */}
                {checklist.includeShifts && (
                  <div>
                    <Label>Skift</Label>
                    <Select
                      value={filters.shiftId}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, shiftId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Alla skift" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alla skift</SelectItem>
                        {shifts.map((shift) => (
                          <SelectItem key={shift.id} value={shift.id.toString()}>
                            {shift.name} ({shift.startTime}-{shift.endTime})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({
                    workTaskId: "all",
                    workStationId: "all",
                    shiftId: "all",
                    startDate: "",
                    endDate: "",
                    search: "",
                  })}
                >
                  Rensa filter
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="mb-8">
          <Card className="w-full max-w-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Totala svar (filtrerat)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalResponses || 0}</div>
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