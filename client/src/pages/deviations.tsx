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
import DeviationModal from "@/components/DeviationModal";
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

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Filter deviations based on current filters
  const filteredDeviations = deviations.filter((deviation) => {
    const matchesSearch = deviation.title
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status.length === 0 || 
      filters.status.includes(deviation.statusId?.toString() || "");
    
    const matchesType = filters.type.length === 0 ||
      filters.type.includes(deviation.deviationTypeId?.toString() || "");
    
    const matchesDepartment = filters.department.length === 0 ||
      filters.department.includes(deviation.departmentId?.toString() || "");

    // Date filtering
    const matchesDateRange = (() => {
      if (!filters.startDate && !filters.endDate) return true;
      const deviationDate = new Date(deviation.createdAt);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      
      if (startDate && deviationDate < startDate) return false;
      if (endDate && deviationDate > endDate) return false;
      return true;
    })();

    return (
      matchesSearch &&
      matchesStatus &&
      matchesType &&
      matchesDepartment &&
      matchesDateRange
    );
  });

  // Chart data processing
  const getDepartmentChartData = () => {
    const data: Record<string, number> = {};
    filteredDeviations.forEach(deviation => {
      const dept = departments.find(d => d.id === deviation.departmentId);
      const deptName = dept?.name || 'Okänd';
      data[deptName] = (data[deptName] || 0) + 1;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };

  const getTypeChartData = () => {
    const data: Record<string, number> = {};
    filteredDeviations.forEach(deviation => {
      const type = deviationTypes.find(t => t.id === deviation.deviationTypeId);
      const typeName = type?.name || 'Okänd';
      data[typeName] = (data[typeName] || 0) + 1;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };

  const getStatusChartData = () => {
    const data: Record<string, number> = {};
    filteredDeviations.forEach(deviation => {
      const status = deviationStatuses.find(s => s.id === deviation.statusId);
      const statusName = status?.name || 'Okänd status';
      data[statusName] = (data[statusName] || 0) + 1;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };

  const getMonthlyData = () => {
    const monthlyData: Record<string, any> = {};
    
    filteredDeviations.forEach(deviation => {
      const date = new Date(deviation.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, total: 0 };
        deviationTypes.forEach(type => {
          monthlyData[monthKey][type.name] = 0;
        });
      }
      
      monthlyData[monthKey].total += 1;
      const type = deviationTypes.find(t => t.id === deviation.deviationTypeId);
      if (type) {
        monthlyData[monthKey][type.name] += 1;
      }
    });
    
    return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
  };

  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Laddar avvikelser...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Avvikelser</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Skapa avvikelse
          </Button>
        </div>

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
                  <PieChart>
                    <Pie
                      data={getTypeChartData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getTypeChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1">
                {getTypeChartData().map((item, index) => (
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
                {getStatusChartData().map((item, index) => (
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
      </div>
    </div>
  );
}