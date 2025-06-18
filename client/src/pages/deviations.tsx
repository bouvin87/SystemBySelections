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

interface Deviation {
  id: number;
  tenantId: number;
  title: string;
  description?: string;
  deviationTypeId: number;
  priority: "low" | "medium" | "high" | "critical";
  status: "new" | "in_progress" | "done";
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

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const statusColors = {
  new: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
};

const priorityLabels = {
  low: "Låg",
  medium: "Medium",
  high: "Hög",
  critical: "Kritisk",
};

const statusLabels = {
  new: "Ny",
  in_progress: "Pågående",
  done: "Klar",
};

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
                    <SelectItem value="new">Nya</SelectItem>
                    <SelectItem value="in_progress">Pågående</SelectItem>
                    <SelectItem value="done">Klara</SelectItem>
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
                    <SelectItem value="critical">Kritisk</SelectItem>
                    <SelectItem value="high">Hög</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Låg</SelectItem>
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
                          <Badge className={priorityColors[deviation.priority]}>
                            {priorityLabels[deviation.priority]}
                          </Badge>
                          <Badge className={statusColors[deviation.status]}>
                            {statusLabels[deviation.status]}
                          </Badge>
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
                  <Badge className={priorityColors[selectedDeviation.priority]}>
                    {priorityLabels[selectedDeviation.priority]}
                  </Badge>
                  <Badge className={statusColors[selectedDeviation.status]}>
                    {statusLabels[selectedDeviation.status]}
                  </Badge>
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
