import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, TrendingUp, Filter } from "lucide-react";
import { DeviationModal } from "@/components/DeviationModal";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ComposedChart } from 'recharts';

// Types
interface DeviationType {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  color: string;
  order: number;
  isActive: boolean;
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
  isCompleted: boolean;
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
  departmentId?: number;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: number;
  name: string;
  isActive: boolean;
}

export default function DeviationsPage() {
  const [filters, setFilters] = useState({
    search: "",
    status: [] as string[],
    type: [] as string[],
    department: [] as string[],
    startDate: "",
    endDate: "",
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch all data
  const { data: deviations = [], isLoading } = useQuery<Deviation[]>({
    queryKey: ["/api/deviations"],
  });

  const { data: deviationTypes = [] } = useQuery<DeviationType[]>({
    queryKey: ["/api/deviations/types"],
  });

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <Label htmlFor="search">Sök</Label>
                <Input
                  id="search"
                  placeholder="Sök avvikelser..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Typ</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                  {deviationTypes
                    .filter((type) => type.isActive)
                    .sort((a, b) => a.order - b.order)
                    .map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type.id}`}
                          checked={filters.type.includes(type.id.toString())}
                          onCheckedChange={(checked) => {
                            const newTypes = checked
                              ? [...filters.type, type.id.toString()]
                              : filters.type.filter(id => id !== type.id.toString());
                            setFilters(prev => ({ ...prev, type: newTypes }));
                          }}
                        />
                        <Label htmlFor={`type-${type.id}`} className="text-sm">
                          {type.name}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                  {deviationStatuses
                    .filter((status) => status.isActive)
                    .sort((a, b) => a.order - b.order)
                    .map((status) => (
                      <div key={status.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status.id}`}
                          checked={filters.status.includes(status.id.toString())}
                          onCheckedChange={(checked) => {
                            const newStatuses = checked
                              ? [...filters.status, status.id.toString()]
                              : filters.status.filter(id => id !== status.id.toString());
                            setFilters(prev => ({ ...prev, status: newStatuses }));
                          }}
                        />
                        <Label htmlFor={`status-${status.id}`} className="text-sm">
                          {status.name}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <Label>Avdelning</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                  {departments
                    .filter((dept) => dept.isActive)
                    .map((dept) => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${dept.id}`}
                          checked={filters.department.includes(dept.id.toString())}
                          onCheckedChange={(checked) => {
                            const newDepts = checked
                              ? [...filters.department, dept.id.toString()]
                              : filters.department.filter(id => id !== dept.id.toString());
                            setFilters(prev => ({ ...prev, department: newDepts }));
                          }}
                        />
                        <Label htmlFor={`dept-${dept.id}`} className="text-sm">
                          {dept.name}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <Label>Startdatum</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Slutdatum</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({
                    search: "",
                    status: [],
                    type: [],
                    department: [],
                    startDate: "",
                    endDate: "",
                  })
                }
              >
                Rensa filter
              </Button>
              <div className="text-sm text-gray-500 flex items-center">
                Visar {filteredDeviations.length} av {deviations.length} avvikelser
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Department Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Avdelningar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getDepartmentChartData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getDepartmentChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2">
                <span className="text-2xl font-bold">{filteredDeviations.length}</span>
                <p className="text-sm text-gray-500">Totalt</p>
              </div>
              <div className="mt-2 space-y-1">
                {getDepartmentChartData().map((item, index) => (
                  <div key={item.name} className="flex items-center text-xs">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: chartColors[index % chartColors.length] }}
                    />
                    <span>{item.name} - {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Type Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Typer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getTypeChartData()} layout="horizontal">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={60} fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getStatusChartData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getStatusChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#82ca9d' : '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2">
                <span className="text-2xl font-bold">{getStatusChartData().find(item => item.name === 'Klar')?.value || 0}</span>
                <p className="text-sm text-gray-500">Klar</p>
              </div>
              <div className="mt-2 space-y-1">
                {getStatusChartData().map((item, index) => (
                  <div key={item.name} className="flex items-center text-xs">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: index === 0 ? '#82ca9d' : '#8884d8' }}
                    />
                    <span>{item.name} - {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Chart - spans full width */}
          <Card className="md:col-span-2 lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Inlämnade per månad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={getMonthlyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} />
                    {deviationTypes.map((type, index) => (
                      <Bar key={type.id} dataKey={type.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deviations List */}
        <Card>
          <CardHeader>
            <CardTitle>Avvikelser ({filteredDeviations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDeviations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Inga avvikelser hittades med de valda filtren
                </div>
              ) : (
                filteredDeviations.map((deviation) => {
                  const deviationType = deviationTypes.find(t => t.id === deviation.deviationTypeId);
                  const status = deviationStatuses.find(s => s.id === deviation.statusId);
                  const department = departments.find(d => d.id === deviation.departmentId);
                  
                  return (
                    <Link key={deviation.id} href={`/deviations/${deviation.id}`}>
                      <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {deviationType && (
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: deviationType.color }}
                                />
                              )}
                              <h3 className="font-semibold">{deviation.title}</h3>
                            </div>
                            
                            <div className="flex gap-2 mb-2">
                              {status && (
                                <Badge style={{ backgroundColor: status.color, color: 'white' }}>
                                  {status.name}
                                </Badge>
                              )}
                              {department && (
                                <Badge variant="outline">
                                  {department.name}
                                </Badge>
                              )}
                            </div>
                            
                            {deviation.description && (
                              <p className="text-sm text-gray-600">{deviation.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center">
                            <Button size="sm" variant="secondary">
                              <TrendingUp className="mr-2 h-4 w-4" />
                              Visa
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create Modal */}
        <DeviationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            // Refresh data would happen automatically via react-query
          }}
          mode="create"
        />
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
                      .filter((priority) => priority.isActive)
                      .sort((a, b) => a.order - b.order)
                      .map((priority) => (
                        <SelectItem
                          key={priority.id}
                          value={priority.id.toString()}
                        >
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
                    <div className="flex items-center justify-between">
                      {/* Vänster innehåll */}
                      <div className="flex-1">
                        {/* Titel */}
                        <div className="flex items-center gap-2 mb-1">
                          {deviationType && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: deviationType.color }}
                            />
                          )}
                          <h3 className="font-semibold text-base">{deviation.title}</h3>
                        </div>

                        {/* Beskrivning */}
                        {deviation.description && (
                          <p className="text-gray-600 text-sm mb-2">{deviation.description}</p>
                        )}

                        {/* Metadata-rad: datum, deadline, badge */}
                        <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(deviation.createdAt), "d MMM yyyy", { locale: sv })}
                          </div>

                          {deviation.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Deadline:{" "}
                              {format(new Date(deviation.dueDate), "d MMM yyyy", { locale: sv })}
                            </div>
                          )}

                          {/* Priority och Status badges */}
                          {priority && (
                            <Badge
                              style={{ backgroundColor: priority.color, color: "white" }}
                              className="text-xs"
                            >
                              {priority.name}
                            </Badge>
                          )}
                          {status && (
                            <Badge
                              style={{ backgroundColor: status.color, color: "white" }}
                              className="text-xs"
                            >
                              {status.name}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Visa-knapp högerställd och centrerad vertikalt */}
                      <div className="ml-4 flex items-center">
                        <Link href={`/deviations/${deviation.id}`}>
                          <Button size="sm" variant="secondary">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            {t("common.view")}
                          </Button>
                        </Link>
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
                          <Badge
                            style={{
                              backgroundColor: priority.color,
                              color: "white",
                            }}
                          >
                            {priority.name}
                          </Badge>
                        )}
                        {status && (
                          <Badge
                            style={{
                              backgroundColor: status.color,
                              color: "white",
                            }}
                          >
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
