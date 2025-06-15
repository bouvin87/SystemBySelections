import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  BarChart3,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface DashboardStats {
  totalChecklists: number;
  completedToday: number;
  pendingTasks: number;
  activeUsers: number;
  completionRate: number;
  trendData: {
    name: string;
    value: number;
    change: number;
  }[];
}

export default function ModernDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    queryFn: () => ({
      totalChecklists: 12,
      completedToday: 8,
      pendingTasks: 4,
      activeUsers: 15,
      completionRate: 87,
      trendData: [
        { name: 'Måndag', value: 85, change: 5 },
        { name: 'Tisdag', value: 92, change: 7 },
        { name: 'Onsdag', value: 78, change: -14 },
        { name: 'Torsdag', value: 95, change: 17 },
        { name: 'Fredag', value: 87, change: -8 },
      ]
    })
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Totala Checklistor',
      value: stats?.totalChecklists || 0,
      icon: CheckCircle,
      trend: '+12%',
      trendUp: true,
      description: 'Från förra månaden',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Slutförda Idag',
      value: stats?.completedToday || 0,
      icon: TrendingUp,
      trend: '+8%',
      trendUp: true,
      description: 'Jämfört med igår',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Väntande Uppgifter',
      value: stats?.pendingTasks || 0,
      icon: AlertTriangle,
      trend: '-3%',
      trendUp: false,
      description: 'Minskning från igår',
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'Aktiva Användare',
      value: stats?.activeUsers || 0,
      icon: Users,
      trend: '+15%',
      trendUp: true,
      description: 'Online nu',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
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
          <Button className="modern-button gradient-bg">
            <Zap className="h-4 w-4 mr-2" />
            Ny checklista
          </Button>
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
                  {card.trendUp ? (
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
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

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rate */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              Slutförandegrad
            </CardTitle>
            <CardDescription>
              Genomsnittlig prestanda denna vecka
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {stats?.completionRate || 0}%
              </span>
              <div className="flex items-center text-green-600">
                <ArrowUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+12%</span>
              </div>
            </div>
            <Progress 
              value={stats?.completionRate || 0} 
              className="h-3"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Mål: 85%</span>
              <span>Nuvarande: {stats?.completionRate || 0}%</span>
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
            <CardDescription>
              Vanliga uppgifter och genvägar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start modern-button">
              <CheckCircle className="h-4 w-4 mr-2" />
              Skapa ny checklista
            </Button>
            <Button variant="outline" className="w-full justify-start modern-button">
              <Users className="h-4 w-4 mr-2" />
              Hantera användare
            </Button>
            <Button variant="outline" className="w-full justify-start modern-button">
              <BarChart3 className="h-4 w-4 mr-2" />
              Visa rapporter
            </Button>
            <Button variant="outline" className="w-full justify-start modern-button">
              <Clock className="h-4 w-4 mr-2" />
              Schemalägg uppgifter
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            Senaste aktivitet
          </CardTitle>
          <CardDescription>
            Nyliga händelser och uppdateringar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'Daglig säkerhetskontroll slutförd', user: 'Anna Andersson', time: '2 min sedan', status: 'success' },
              { action: 'Ny användare registrerad', user: 'Erik Svensson', time: '15 min sedan', status: 'info' },
              { action: 'Kvalitetskontroll påbörjad', user: 'Maria Johansson', time: '1 tim sedan', status: 'warning' },
              { action: 'Veckorapport genererad', user: 'System', time: '2 tim sedan', status: 'success' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}