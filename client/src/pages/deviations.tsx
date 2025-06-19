import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navigation } from "@/components/Navigation";
import DeviationModal from "@/components/DeviationModal";
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  MapPin,
  Clock,
  MessageSquare,
  History,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

// Types based on our schema
interface DeviationType {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface DeviationPriority {
  id: number;
  tenantId: number;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
}

interface DeviationStatus {
  id: number;
  tenantId: number;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  isDefault: boolean;
}

interface Deviation {
  id: number;
  tenantId: number;
  title: string;
  description?: string;
  deviationTypeId: number;
  priorityId?: number;
  statusId?: number;
  assignedToUserId?: number;
  createdByUserId: number;
  dueDate?: string;
  completedAt?: string;
  workTaskId?: number;
  locationId?: number;
  createdAt: string;
  updatedAt: string;
}

interface DeviationStats {
  total: number;
  new: number;
  inProgress: number;
  done: number;
  overdue: number;
  highPriority: number;
}

interface WorkTask {
  id: number;
  name: string;
}

interface WorkStation {
  id: number;
  name: string;
}

interface DeviationUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface DeviationLog {
  id: number;
  deviationId: number;
  userId: number;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  createdAt: string;
}

// Activity Log Component
function DeviationActivityLog({ deviationId }: { deviationId: number }) {
  const { data: logs = [], isLoading } = useQuery<DeviationLog[]>({
    queryKey: [`/api/deviations/${deviationId}/logs`],
  });

  const { data: users = [] } = useQuery<DeviationUser[]>({
    queryKey: ["/api/users"],
  });

  if (isLoading) {
    return <div className="text-sm text-gray-500">Laddar aktivitetslogg...</div>;
  }

  if (logs.length === 0) {
    return <div className="text-sm text-gray-500">Inga aktiviteter ännu</div>;
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {logs.map((log) => {
        const user = users.find((u) => u.id === log.userId);
        const userName = user
          ? `${user.firstName} ${user.lastName}`.trim() || user.email
          : "Okänd användare";

        return (
          <div key={log.id} className="border-l-2 border-gray-200 pl-3 pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{log.description}</p>
              <span className="text-xs text-gray-500">
                {format(new Date(log.createdAt), "d MMM yyyy HH:mm", {
                  locale: sv,
                })}
              </span>
            </div>
            <p className="text-xs text-gray-600">av {userName}</p>
            {log.oldValue && log.newValue && (
              <div className="text-xs text-gray-500 mt-1">
                <span className="line-through">{log.oldValue}</span> → {log.newValue}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DeviationsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignedToUserId: "",
    workTaskId: "",
    search: "",
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDeviation, setSelectedDeviation] = useState<Deviation | null>(
    null,
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch deviation stats
  const { data: stats } = useQuery<DeviationStats>({
    queryKey: ["/api/deviations/stats"],
  });

  // Fetch deviation types
  const { data: deviationTypes = [] } = useQuery<DeviationType[]>({
    queryKey: ["/api/deviations/types"],
  });

  // Fetch deviation priorities
  const { data: deviationPriorities = [] } = useQuery<DeviationPriority[]>({
    queryKey: ["/api/deviations/priorities"],
  });

  // Fetch deviation statuses
  const { data: deviationStatuses = [] } = useQuery<DeviationStatus[]>({
    queryKey: ["/api/deviations/statuses"],
  });

  // Fetch work tasks
  const { data: workTasks = [] } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
  });

  // Fetch work stations
  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
  });

  const { data: users = [] } = useQuery<DeviationUser[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/users");
        return response.json();
      } catch (error) {
        // If no access to users endpoint, return empty array
        console.warn("No access to users endpoint:", error);
        return [];
      }
    },
  });

  // Build query parameters for filtering
  const queryParams = new URLSearchParams();

  // Add filters to query params
  Object.entries(filters).forEach(([key, value]) => {
    const filterValue = filters[key as keyof typeof filters];
    if (filterValue && filterValue !== "all") {
      queryParams.append(key, filterValue);
    }
  });

  // Fetch deviations with filters
  const { data: deviations = [], isLoading } = useQuery<Deviation[]>({
    queryKey: ["/api/deviations", queryParams.toString()],
    queryFn: async () => {
      const url = `/api/deviations${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });

  const openDeviationDetail = (deviation: Deviation) => {
    setSelectedDeviation(deviation);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              Avvikelser
            </h1>
            <p className="text-gray-600 mt-1">
              Hantera och följ upp avvikelser i produktionen
            </p>
          </div>

          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ny avvikelse
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">
                  {stats.total}
                </CardTitle>
                <CardDescription>Totalt</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-gray-600">
                  {stats.new}
                </CardTitle>
                <CardDescription>Nya</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-blue-600">
                  {stats.inProgress}
                </CardTitle>
                <CardDescription>Pågående</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-green-600">
                  {stats.done}
                </CardTitle>
                <CardDescription>Klara</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-red-600">
                  {stats.overdue}
                </CardTitle>
                <CardDescription>Försenade</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-orange-600">
                  {stats.highPriority}
                </CardTitle>
                <CardDescription>Hög prioritet</CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label>Sök</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Sök avvikelser..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alla statusar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla statusar</SelectItem>
                    {deviationStatuses
                      .filter(status => status.isActive)
                      .sort((a, b) => a.order - b.order)
                      .map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prioritet</Label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alla prioriteter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla prioriteter</SelectItem>
                    {deviationPriorities
                      .filter(priority => priority.isActive)
                      .sort((a, b) => a.order - b.order)
                      .map((priority) => (
                      <SelectItem key={priority.id} value={priority.id.toString()}>
                        {priority.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tilldelad till</Label>
                <Select
                  value={filters.assignedToUserId}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, assignedToUserId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alla användare" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla användare</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Arbetsmoment</Label>
                <Select
                  value={filters.workTaskId}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, workTaskId: value }))
                  }
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
            </div>
          </CardContent>
        </Card>

        {/* Deviations List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : deviations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Inga avvikelser hittades</p>
              </CardContent>
            </Card>
          ) : (
            deviations.map((deviation) => {
              const deviationType = deviationTypes.find(
                (t) => t.id === deviation.deviationTypeId,
              );
              const priority = deviationPriorities.find(
                (p) => p.id === deviation.priorityId,
              );
              const status = deviationStatuses.find(
                (s) => s.id === deviation.statusId,
              );
              return (
                <Card
                  key={deviation.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openDeviationDetail(deviation)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {deviationType && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: deviationType.color }}
                            />
                          )}
                          <h3 className="font-semibold">{deviation.title}</h3>
                          {priority && (
                            <Badge style={{ backgroundColor: priority.color, color: 'white' }}>
                              {priority.name}
                            </Badge>
                          )}
                          {status && (
                            <Badge style={{ backgroundColor: status.color, color: 'white' }}>
                              {status.name}
                            </Badge>
                          )}
                        </div>

                        {deviation.description && (
                          <p className="text-gray-600 text-sm mb-2">
                            {deviation.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(
                              new Date(deviation.createdAt),
                              "d MMM yyyy",
                              { locale: sv },
                            )}
                          </div>
                          {deviation.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Deadline:{" "}
                              {format(
                                new Date(deviation.dueDate),
                                "d MMM yyyy",
                                { locale: sv },
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Deviation Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedDeviation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {selectedDeviation.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  {(() => {
                    const priority = deviationPriorities.find(
                      (p) => p.id === selectedDeviation.priorityId,
                    );
                    const status = deviationStatuses.find(
                      (s) => s.id === selectedDeviation.statusId,
                    );
                    return (
                      <>
                        {priority && (
                          <Badge style={{ backgroundColor: priority.color, color: 'white' }}>
                            {priority.name}
                          </Badge>
                        )}
                        {status && (
                          <Badge style={{ backgroundColor: status.color, color: 'white' }}>
                            {status.name}
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                </div>

                {selectedDeviation.description && (
                  <div>
                    <Label>Beskrivning</Label>
                    <p className="text-gray-700">
                      {selectedDeviation.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Skapad</Label>
                    <p className="text-gray-700">
                      {format(
                        new Date(selectedDeviation.createdAt),
                        "d MMM yyyy HH:mm",
                        { locale: sv },
                      )}
                    </p>
                  </div>

                  {selectedDeviation.dueDate && (
                    <div>
                      <Label>Deadline</Label>
                      <p className="text-gray-700">
                        {format(
                          new Date(selectedDeviation.dueDate),
                          "d MMM yyyy HH:mm",
                          { locale: sv },
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Activity Log */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <History className="h-4 w-4" />
                    Aktivitetslogg
                  </Label>
                  <DeviationActivityLog deviationId={selectedDeviation.id} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DeviationModal Component */}
      <DeviationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Refresh the deviations list after creating
          queryClient.invalidateQueries({ queryKey: ["/api/deviations"] });
        }}
      />
    </div>
  );
}
