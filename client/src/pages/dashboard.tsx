import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ModernNavigation from "@/components/ModernNavigation";
import { Link } from "wouter";
import { 
  BarChart, 
  TrendingUp, 
  Activity, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Clock,
  ArrowUp,
  Zap,
  Plus
} from "lucide-react";
import { renderIcon } from "@/lib/icon-utils";
import { useTranslation } from 'react-i18next';
import type { Checklist } from "@shared/schema";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: checklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists"],
  });

  // Filter checklists that have dashboard enabled
  const dashboardChecklists = checklists.filter(checklist => 
    checklist.hasDashboard && checklist.isActive
  );

  // Mock statistics for demonstration
  const stats = {
    totalChecklists: checklists.length,
    completedToday: 8,
    pendingTasks: 4,
    activeUsers: 15,
    completionRate: 87
  };

  const statCards = [
    {
      title: 'Totala Checklistor',
      value: stats.totalChecklists,
      icon: CheckCircle,
      trend: '+12%',
      trendUp: true,
      description: 'Från förra månaden',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Slutförda Idag',
      value: stats.completedToday,
      icon: TrendingUp,
      trend: '+8%',
      trendUp: true,
      description: 'Jämfört med igår',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Väntande Uppgifter',
      value: stats.pendingTasks,
      icon: AlertTriangle,
      trend: '-3%',
      trendUp: false,
      description: 'Minskning från igår',
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'Aktiva Användare',
      value: stats.activeUsers,
      icon: Users,
      trend: '+15%',
      trendUp: true,
      description: 'Online nu',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <ModernNavigation />
      <main className="flex-1 md:ml-72 overflow-auto">
        <div className="p-6 space-y-8">
          {/* Welcome Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Välkommen tillbaka! 👋
              </h1>
              <p className="text-gray-600">
                Här är en översikt över din verksamhet idag
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="modern-button">
                <Calendar className="h-4 w-4 mr-2" />
                Denna vecka
              </Button>
              <Link href="/admin">
                <Button className="modern-button gradient-bg">
                  <Plus className="h-4 w-4 mr-2" />
                  Ny checklista
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="modern-card stat-card relative overflow-hidden group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {card.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {card.value}
                    </div>
                    <div className="flex items-center text-sm">
                      <ArrowUp className={`h-4 w-4 mr-1 ${card.trendUp ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
                      <span className={card.trendUp ? 'text-green-600' : 'text-red-600'}>
                        {card.trend}
                      </span>
                      <span className="text-gray-500 ml-1">{card.description}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Dashboard Checklists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="h-5 w-5 mr-2 text-primary" />
                    Tillgängliga Dashboards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardChecklists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dashboardChecklists.map((checklist) => (
                        <Card key={checklist.id} className="modern-card group hover:shadow-lg transition-all duration-300">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              {renderIcon(checklist.icon, "h-5 w-5 text-primary") || <BarChart className="h-5 w-5 text-primary" />}
                              {checklist.name}
                            </CardTitle>
                            {checklist.description && (
                              <p className="text-sm text-gray-600">{checklist.description}</p>
                            )}
                          </CardHeader>
                          <CardContent className="pt-0">
                            <Link href={`/checklist/${checklist.id}/dashboard`}>
                              <Button className="w-full modern-button" size="sm">
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Visa Dashboard
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Inga dashboards tillgängliga
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Skapa checklistor med dashboard-funktionalitet för att se data här
                      </p>
                      <Link href="/admin">
                        <Button className="modern-button">
                          Gå till Administration
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Completion Rate */}
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-primary" />
                    Slutförandegrad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.completionRate}%
                    </span>
                    <div className="flex items-center text-green-600">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">+12%</span>
                    </div>
                  </div>
                  <Progress 
                    value={stats.completionRate} 
                    className="h-3"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Mål: 85%</span>
                    <span>Nuvarande: {stats.completionRate}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-primary" />
                    Snabbåtgärder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/admin">
                    <Button variant="outline" className="w-full justify-start modern-button">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Skapa ny checklista
                    </Button>
                  </Link>
                  <Link href="/admin">
                    <Button variant="outline" className="w-full justify-start modern-button">
                      <Users className="h-4 w-4 mr-2" />
                      Hantera användare
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start modern-button">
                    <BarChart className="h-4 w-4 mr-2" />
                    Visa rapporter
                  </Button>
                  <Button variant="outline" className="w-full justify-start modern-button">
                    <Clock className="h-4 w-4 mr-2" />
                    Schemalägg uppgifter
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}