import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Plus, TrendingUp, Filter, X, Calendar, ArrowLeft } from "lucide-react";
import DeviationModal from "@/components/DeviationModal";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";

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

  const [showFilters, setShowFilters] = useState(false); 


  // Fetch custom field values for all deviations
  const { data: customFieldValuesMap = {} } = useQuery<Record<number, any[]>>({
    queryKey: ["/api/deviations/custom-field-values"],
    queryFn: async () => {
      const values: Record<number, any[]> = {};
      
      // Fetch custom field values for each deviation
      const promises = deviations.map(async (deviation) => {
        try {
          const response = await fetch(`/api/deviations/${deviation.id}/custom-field-values`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            values[deviation.id] = data;
          }
        } catch (error) {
          console.error(`Error fetching custom fields for deviation ${deviation.id}:`, error);
        }
      });
      
      await Promise.all(promises);
      return values;
    },
    enabled: deviations.length > 0,
  });

  // Filter deviations based on current filters
  const filteredDeviations = deviations.filter((deviation) => {
    const matchesSearch = deviation.title
      .toLowerCase()
      .includes(filters.search.toLowerCase());

    const matchesStatus =
      filters.status.length === 0 ||
      filters.status.includes(deviation.statusId?.toString() || "");

    const matchesType =
      filters.type.length === 0 ||
      filters.type.includes(deviation.deviationTypeId?.toString() || "");

    const matchesDepartment =
      filters.department.length === 0 ||
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
    const data: Record<string, { value: number; color: string }> = {};
    filteredDeviations.forEach((deviation) => {
      const dept = departments.find((d) => d.id === deviation.departmentId);
      const deptName = dept?.name || "Okänd";
      if (!data[deptName]) {
        data[deptName] = { value: 0, color: dept?.color || "#6b7280" };
      }
      data[deptName].value += 1;
    });
    return Object.entries(data).map(([name, item]) => ({
      name,
      value: item.value,
      color: item.color,
    }));
  };

  const getTypeChartData = () => {
    const data: Record<string, { value: number; color: string }> = {};
    filteredDeviations.forEach((deviation) => {
      const type = deviationTypes.find(
        (t) => t.id === deviation.deviationTypeId,
      );
      const typeName = type?.name || "Okänd";
      if (!data[typeName]) {
        data[typeName] = {
          value: 0,
          color:
            type?.color ||
            chartColors[Object.keys(data).length % chartColors.length],
        };
      }
      data[typeName].value += 1;
    });
    return Object.entries(data).map(([name, item]) => ({
      name,
      value: item.value,
      color: item.color,
    }));
  };

  const getStatusChartData = () => {
    const data: Record<string, { value: number; color: string }> = {};
    filteredDeviations.forEach((deviation) => {
      const status = deviationStatuses.find((s) => s.id === deviation.statusId);
      const statusName = status?.name || "Ingen status";
      if (!data[statusName]) {
        data[statusName] = { value: 0, color: status?.color || "#9ca3af" };
      }
      data[statusName].value += 1;
    });
    return Object.entries(data).map(([name, item]) => ({
      name,
      value: item.value,
      color: item.color,
    }));
  };

  const getMonthlyData = () => {
    const monthlyData: Record<string, any> = {};

    filteredDeviations.forEach((deviation) => {
      const date = new Date(deviation.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, total: 0 };
        deviationTypes.forEach((type) => {
          monthlyData[monthKey][type.name] = 0;
        });
      }

      monthlyData[monthKey].total += 1;
      const type = deviationTypes.find(
        (t) => t.id === deviation.deviationTypeId,
      );
      if (type) {
        monthlyData[monthKey][type.name] += 1;
      }
    });

    return Object.values(monthlyData).sort((a: any, b: any) =>
      a.month.localeCompare(b.month),
    );
  };

  const getTypeColors = () => {
    const colors: Record<string, string> = {};
    deviationTypes.forEach((type) => {
      colors[type.name] = type.color;
    });
    return colors;
  };

  const chartColors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
  ];

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
    <div className="min-h-screen bg-background text-foreground pb-[theme(spacing.20)]">
      <Navigation />
      {/* Header Row likt ChecklistDashboard */}
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Vänstersida: Tillbaka + Titel */}
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Tillbaka
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Avvikelser</h1>
                <p className="text-sm text-muted-foreground">
                  Översikt över rapporterade avvikelser
                </p>
              </div>
            </div>

            {/* Högersida: Ny + Filter */}
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsCreateModalOpen(true)} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Ny avvikelse
              </Button>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant={showFilters ? "default" : "outline"}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </div>
      </div>


      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        {showFilters && (
        <Card className="bg-card text-foreground rounded-xl shadow">
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
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !filters.type.includes(value)) {
                      setFilters((prev) => ({
                        ...prev,
                        type: [...prev.type, value],
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj typer" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviationTypes
                      .filter(
                        (type) =>
                          type.isActive &&
                          !filters.type.includes(type.id.toString()),
                      )
                      .sort((a, b) => a.order - b.order)
                      .map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    {deviationTypes.filter(
                      (type) =>
                        type.isActive &&
                        !filters.type.includes(type.id.toString()),
                    ).length === 0 && (
                      <SelectItem value="no-options" disabled>
                        Alla typer är redan valda
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {filters.type.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {filters.type.map((typeId) => {
                      const type = deviationTypes.find(
                        (t) => t.id.toString() === typeId,
                      );
                      return type ? (
                        <div
                          key={typeId}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                        >
                          {type.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() =>
                              setFilters((prev) => ({
                                ...prev,
                                type: prev.type.filter((id) => id !== typeId),
                              }))
                            }
                          />
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !filters.status.includes(value)) {
                      setFilters((prev) => ({
                        ...prev,
                        status: [...prev.status, value],
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj statusar" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviationStatuses
                      .filter(
                        (status) =>
                          status.isActive &&
                          !filters.status.includes(status.id.toString()),
                      )
                      .sort((a, b) => a.order - b.order)
                      .map((status) => (
                        <SelectItem
                          key={status.id}
                          value={status.id.toString()}
                        >
                          {status.name}
                        </SelectItem>
                      ))}
                    {deviationStatuses.filter(
                      (status) =>
                        status.isActive &&
                        !filters.status.includes(status.id.toString()),
                    ).length === 0 && (
                      <SelectItem value="no-options" disabled>
                        Alla statusar är redan valda
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {filters.status.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {filters.status.map((statusId) => {
                      const status = deviationStatuses.find(
                        (s) => s.id.toString() === statusId,
                      );
                      return status ? (
                        <div
                          key={statusId}
                          className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                        >
                          {status.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() =>
                              setFilters((prev) => ({
                                ...prev,
                                status: prev.status.filter(
                                  (id) => id !== statusId,
                                ),
                              }))
                            }
                          />
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div>
                <Label>Avdelning</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !filters.department.includes(value)) {
                      setFilters((prev) => ({
                        ...prev,
                        department: [...prev.department, value],
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj avdelningar" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments
                      .filter(
                        (dept) =>
                          dept.isActive &&
                          !filters.department.includes(dept.id.toString()),
                      )
                      .map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    {departments.filter(
                      (dept) =>
                        dept.isActive &&
                        !filters.department.includes(dept.id.toString()),
                    ).length === 0 && (
                      <SelectItem value="no-options" disabled>
                        Alla avdelningar är redan valda
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {filters.department.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {filters.department.map((deptId) => {
                      const dept = departments.find(
                        (d) => d.id.toString() === deptId,
                      );
                      return dept ? (
                        <div
                          key={deptId}
                          className="px-2 py-1 rounded-md text-sm flex items-center gap-1"
                          style={{
                            backgroundColor: dept.color + "20",
                            borderColor: dept.color,
                            color: dept.color,
                            border: `1px solid ${dept.color}`,
                          }}
                        >
                          {dept.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() =>
                              setFilters((prev) => ({
                                ...prev,
                                department: prev.department.filter(
                                  (id) => id !== deptId,
                                ),
                              }))
                            }
                          />
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Datumintervall
                </Label>
                <div className="space-y-2">
                  <DatePicker
                    value={filters.startDate}
                    onChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        startDate: value,
                      }))
                    }
                    placeholder="Från datum"
                  />
                  <DatePicker
                    value={filters.endDate}
                    onChange={(value) =>
                      setFilters((prev) => ({ ...prev, endDate: value }))
                    }
                    placeholder="Till datum"
                  />
                </div>
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
                Visar {filteredDeviations.length} av {deviations.length}{" "}
                avvikelser
              </div>
            </div>
          </CardContent>
        </Card>
        )}
        
        {/* Chart Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Department Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avdelningar
              </CardTitle>
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
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2">
                <span className="text-2xl font-bold">
                  {filteredDeviations.length}
                </span>
                <p className="text-sm text-gray-500">Totalt</p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                {getDepartmentChartData().map((item) => (
                  <div key={item.name} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">
                      {item.name} - {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Type Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Typer
              </CardTitle>
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
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />

                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2">
                <span className="text-2xl font-bold">
                  {filteredDeviations.length}
                </span>
                <p className="text-sm text-gray-500">Totalt</p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                {getTypeChartData().map((item) => (
                  <div key={item.name} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">
                      {item.name} - {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status
              </CardTitle>
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
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2">
                <span className="text-2xl font-bold">
                  {filteredDeviations.length}
                </span>
                <p className="text-sm text-gray-500">Totalt</p>
              </div>
             
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                {getStatusChartData().map((item) => (
                  <div key={item.name} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">
                      {item.name} - {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Chart - spans full width */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inlämnade per månad
              </CardTitle>
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
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#2563eb"
                      strokeWidth={3}
                    />
                    {deviationTypes.map((type) => (
                      <Bar
                        key={type.id}
                        dataKey={type.name}
                        fill={type.color}
                      />
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
                  const deviationType = deviationTypes.find(
                    (t) => t.id === deviation.deviationTypeId,
                  );
                  const status = deviationStatuses.find(
                    (s) => s.id === deviation.statusId,
                  );
                  const department = departments.find(
                    (d) => d.id === deviation.departmentId,
                  );

                  return (
                    <Link
                      key={deviation.id}
                      href={`/deviations/${deviation.id}`}
                    >
                      <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {deviationType && (
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: deviationType.color,
                                  }}
                                />
                              )}
                              <h3 className="font-semibold">
                                {deviation.title}
                              </h3>
                            </div>

                            <div className="flex gap-2 mb-2">
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
                              {department && (
                                <Badge
                                  variant="outline"
                                  style={{
                                    borderColor: department.color,
                                    color: department.color,
                                  }}
                                >
                                  {department.name}
                                </Badge>
                              )}
                            </div>

                            {deviation.description && (
                              <p className="text-sm text-gray-600">
                                {deviation.description}
                              </p>
                            )}

                            {/* Custom Fields */}
                            {customFieldValuesMap[deviation.id] && customFieldValuesMap[deviation.id].length > 0 && (
                              <div className="mt-2 space-y-1">
                                {customFieldValuesMap[deviation.id].map((fieldValue: any) => (
                                  <div key={fieldValue.id} className="text-xs text-gray-500">
                                    <span className="font-medium">{fieldValue.field.name}:</span>{" "}
                                    <span>
                                      {fieldValue.field.fieldType === 'checkbox' 
                                        ? (fieldValue.value === 'true' ? 'Ja' : 'Nej')
                                        : fieldValue.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
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
