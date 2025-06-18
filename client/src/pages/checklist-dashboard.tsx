import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import DashboardQuestionCard from "@/components/DashboardQuestionCard";
import ResponseViewModal from "@/components/ResponseViewModal";
import { Link } from "wouter";
import { ArrowLeft, Filter, Search, Calendar, Eye, BarChart3, Activity, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import type { ChecklistResponse, Checklist, WorkTask, WorkStation, Shift, Question } from "@shared/schema";

interface DashboardStats {
  totalResponses: number;
  recentResponses: ChecklistResponse[];
}

interface ChecklistDashboardProps {
  checklistId: string;
}

export default function ChecklistDashboard({ checklistId }: ChecklistDashboardProps) {
  const { t } = useTranslation();
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

  // Response view modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  const { data: checklist } = useQuery<Checklist>({
    queryKey: [`/api/checklists/${id}`],
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
    queryKey: [`/api/dashboard/stats?${buildQueryParams()}`],
  });

  const { data: responses = [] } = useQuery<ChecklistResponse[]>({
    queryKey: [`/api/responses?${buildQueryParams()}`],
  });

  const { data: dashboardQuestions = [] } = useQuery<Question[]>({
    queryKey: [`/api/dashboard/questions?checklistId=${id}`],
  });

  if (!checklist) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96" />
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
                {t('dashboard.dashboardNotEnabled')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('dashboard.dashboardNotEnabledDescription')}
              </p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('dashboard.backToHome')}
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
              {t('dashboard.back')}
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {checklist.name}
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('dashboard.title')}
            </p>
          </div>
          <Button 
            onClick={() => setShowFilters(!showFilters)} 
            variant="outline"
          >
            <Filter className="mr-2 h-4 w-4" />
            {t('common.filter')}
          </Button>
        </div>

        {showFilters && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t('dashboard.filterOptions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <Label htmlFor="search">{t('dashboard.searchOperator')}</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder={t('dashboard.searchOperatorPlaceholder')}
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <Label htmlFor="startDate">{t('dashboard.fromDate')}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">{t('dashboard.toDate')}</Label>
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
                    <Label>{t('common.workTask')}</Label>
                    <Select
                      value={filters.workTaskId}
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        workTaskId: value,
                        workStationId: "all" // Reset station when task changes
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.allWorkTasks')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allWorkTasks')}</SelectItem>
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
                    <Label>{t('common.workStation')}</Label>
                    <Select
                      value={filters.workStationId}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, workStationId: value }))}
                      disabled={!filters.workTaskId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.allWorkStations')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allWorkStations')}</SelectItem>
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
                    <Label>{t('common.shift')}</Label>
                    <Select
                      value={filters.shiftId}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, shiftId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.allShifts')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allShifts')}</SelectItem>
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
                  {t('common.clearFilters')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.totalResponsesFiltered')}
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalResponses || 0}</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.responsesSinceStart')}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.recentActivity')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.recentResponses?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.responsesToday')}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.questionMetrics')}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardQuestions.length}</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.questionsTracked')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{t('dashboard.overview')}</TabsTrigger>
            <TabsTrigger value="questions">{t('dashboard.questionStatistics')}</TabsTrigger>
            <TabsTrigger value="responses">{t('dashboard.responseHistory')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.quickSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t('dashboard.totalResponses')}</span>
                    <Badge variant="secondary">{stats?.totalResponses || 0}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t('dashboard.questionsWithData')}</span>
                    <Badge variant="secondary">{dashboardQuestions.length}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t('dashboard.checklistStatus')}</span>
                    <Badge variant={checklist.isActive ? "default" : "secondary"}>
                      {checklist.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.latestActivity')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {stats?.recentResponses?.slice(0, 5).map((response) => (
                        <div key={response.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium text-sm">{response.operatorName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(response.createdAt).toLocaleDateString('sv-SE')} {new Date(response.createdAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedResponseId(response.id);
                            setViewModalOpen(true);
                          }}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {!stats?.recentResponses?.length && (
                        <p className="text-center text-muted-foreground py-8 text-sm">
                          {t('dashboard.noRecentActivity')}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="questions" className="space-y-6">
            {dashboardQuestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardQuestions.map((item: any) => (
                  <DashboardQuestionCard
                    key={item.questions.id}
                    question={item.questions}
                    responses={responses}
                    filters={filters}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {t('dashboard.noQuestionsForDashboard')}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t('dashboard.noQuestionsDescription')}
                  </p>
                  <Link href="/admin">
                    <Button>
                      {t('dashboard.goToAdmin')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="responses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.allResponses')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {responses.map((response) => (
                      <div key={response.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-medium">{response.operatorName}</p>
                            <Badge variant="outline" className="text-xs">
                              ID: {response.id}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(response.createdAt).toLocaleDateString('sv-SE')} {new Date(response.createdAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedResponseId(response.id);
                            setViewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('common.view')}
                        </Button>
                      </div>
                    ))}
                    {responses.length === 0 && (
                      <div className="text-center py-12">
                        <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">{t('dashboard.noResponsesYet')}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ResponseViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedResponseId(null);
        }}
        responseId={selectedResponseId}
      />
    </div>
  );
}