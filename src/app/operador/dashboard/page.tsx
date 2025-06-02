"use client";

import NotificationFeed from "@/components/layout/notification";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { translateProcessStatus } from "@/lib/utils";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  ChevronRightIcon,
  Clock,
  Clock4,
  Files,
  FileText,
  Filter,
  MessageCircle,
  RefreshCw,
  Users,
  Shield,
  Settings,
  Zap,
  Target,
  Database,
  Bell,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, Doughnut, Pie } from "react-chartjs-2";
import { AdminActionCenter } from "@/components/admin/AdminActionCenter";
import { AdvancedAnalytics } from "@/components/admin/AdvancedAnalytics";

interface DashboardStatsOperator {
  rejectionReasons: number;
  documentRejectionRate: number;
  totalProcesses: number;
  activeProcesses: number;
  completedProcesses: number;
  inProgressProcesses: number;
  processesByStatus: Array<{
    status: string;
    count: number;
    label: string;
  }>;
  performanceRate: number;
  deadlineMet: number;
  averageCompletionTime: number;
  urgentProcesses: number;
  averageDocuments: number;
  staleProcesses: number;
  monthlyData: Array<{
    month: string;
    total: number;
    completed: number;
    inProgress: number;
  }>;
  processTypeData: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  priorityData: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  documentStatusData: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };

  totalOperators: number;
  totalClients: number;
  totalCompanies: number;
  totalDocuments: number;
  processCompletionRate: number;
  sourceDistribution: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  operatorPerformance: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  averageProcessTime: number;
  documentVerificationRate: number;
  processesPerOperator: number;
  stageTimeData: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  funnelData: {
    created: number;
    docsSent: number;
    inAnalysis: number;
    approved: number;
  };
  activityData: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  documentVerificationByType: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  documentRejectionReasons: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  operatorWorkload: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  responseTime: {
    documents: number;
    analysis: number;
    approval: number;
  };
  botStatus: string;
  botPhoneNumber: string;
  botLastConnection: string;
  botProcesses: number;
  notificationStats: {
    sent: number;
    viewed: number;
  };
  documentProcessingTime?: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
    }>;
  };
  taxaSucesso?: number;

  // Novos campos para dashboard dinâmico
  recentActivities?: Array<{
    id: string;
    type: string;
    status: string;
    statusLabel: string;
    clientName?: string;
    timestamp: string;
    timeAgo: number;
  }>;
  urgentProcessesList?: Array<{
    id: string;
    clientName?: string;
    status: string;
    statusLabel: string;
    createdAt: string;
    daysWaiting: number;
  }>;
  recentDocuments?: Array<{
    id: string;
    type: string;
    status: string;
    statusLabel: string;
    clientName?: string;
    timestamp: string;
    hoursAgo: number;
  }>;
  recentClients?: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    source?: string;
    processes: number;
    joinedAt: string;
  }>;
  todayStats?: {
    processesCreated: number;
    processesCompleted: number;
    documentsReceived: number;
  };
}

// Registrar os componentes do Chart.js
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const { operator } = useAuth();
  const [stats, setStats] = useState<DashboardStatsOperator | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = operator?.role === "ADMIN";

  useEffect(() => {
    const fetchStats = async () => {
      if (!operator?.id) return;
      const operatorId = operator?.id;
      try {
        setLoading(true);
        console.log(operatorId);
        const response = await fetch(`/api/v1/dashboard/${operatorId}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);
        setStats(data);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [operator]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin bg-emerald-200 rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-gray-400" />
          <p className="text-gray-500 text-lg">
            Não há dados disponíveis para exibição no momento
          </p>
          <p className="text-gray-400 text-sm">
            Tente novamente mais tarde ou entre em contato com o suporte
          </p>
        </div>
      </div>
    );
  }

  const processTypeData = {
    labels: stats?.processTypeData?.labels || [],
    datasets: [
      {
        data: stats?.processTypeData?.datasets[0].data || [],
        backgroundColor: ["#3B82F6", "#34D399", "#F59E0B"],
      },
    ],
  };

  const pieChartData = {
    labels:
      stats?.processesByStatus?.map((status) =>
        translateProcessStatus(status.label)
      ) || [],
    datasets: [
      {
        data: stats?.processesByStatus?.map((status) => status.count) || [],
        backgroundColor: [
          "#10B981", // Verde principal
          "#059669", // Verde escuro
          "#34D399", // Verde claro
          "#6EE7B7", // Verde muito claro
          "#A7F3D0", // Verde pastel
          "#D1FAE5", // Verde bem claro
        ],
      },
    ],
  };

  const statusCards = [
    {
      title: "Processos Ativos",
      value: stats.activeProcesses || 0,
      icon: FileText,
      color: "bg-emerald-50 text-emerald-600",
      textColor: "text-emerald-600",
    },
    {
      title: "Concluídos",
      value: stats.completedProcesses || 0,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
      textColor: "text-green-600",
    },
    {
      title: "Em Andamento",
      value: stats.inProgressProcesses || 0,
      icon: Clock,
      color: "bg-emerald-100 text-emerald-700",
      textColor: "text-emerald-700",
    },
    {
      title: "Taxa de Sucesso",
      value: `${stats.performanceRate || 0}%`,
      icon: Activity,
      color: "bg-green-100 text-green-700",
      textColor: "text-green-700",
    },
  ];

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-emerald-950 dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-[1600px] mx-auto p-6 space-y-6">
          {/* Header Administrativo Avançado */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-700 to-emerald-800 rounded-2xl p-6 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-green-600/20 backdrop-blur-sm"></div>
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                    Painel Administrativo Avançado
                </h1>
                </div>
                <p className="text-emerald-100 text-lg mb-3">
                  Controle total do sistema StepMEI
                </p>
                <div className="flex items-center gap-6 text-emerald-200">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="text-sm">Sistema Online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {stats.totalOperators} Operadores
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">
                      Performance: {stats.performanceRate}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Reunião
                </Button>
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar Dados
                </Button>
              </div>
            </div>

            {/* Elementos decorativos aprimorados */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-full translate-y-32 -translate-x-32"></div>
          </div>

          {/* Cards de Status do Sistema */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-700 text-sm font-medium">
                      Sistema
                    </p>
                    <p className="text-2xl font-bold text-emerald-800">100%</p>
                    <p className="text-emerald-600 text-xs">Operacional</p>
                  </div>
                  <div className="p-3 rounded-full bg-emerald-200">
                    <Database className="h-6 w-6 text-emerald-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-700 text-sm font-medium">
                      Operadores
                    </p>
                    <p className="text-2xl font-bold text-emerald-800">
                      {stats.totalOperators}
                    </p>
                    <p className="text-emerald-600 text-xs">Ativos</p>
                  </div>
                  <div className="p-3 rounded-full bg-emerald-200">
                    <Users className="h-6 w-6 text-emerald-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-700 text-sm font-medium">
                      Eficiência
                    </p>
                    <p className="text-2xl font-bold text-emerald-800">
                      {stats.performanceRate}%
                    </p>
                    <p className="text-emerald-600 text-xs">Global</p>
                  </div>
                  <div className="p-3 rounded-full bg-emerald-200">
                    <Target className="h-6 w-6 text-emerald-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-700 text-sm font-medium">
                      Alertas
                    </p>
                    <p className="text-2xl font-bold text-emerald-800">
                      {stats.urgentProcesses}
                    </p>
                    <p className="text-emerald-600 text-xs">Críticos</p>
                  </div>
                  <div className="p-3 rounded-full bg-emerald-200">
                    <AlertTriangle className="h-6 w-6 text-emerald-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Widget de Estatísticas do Dia Expandido */}
          {stats.todayStats && (
            <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-200 text-slate-700">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-slate-800">
                      Resumo Executivo -{" "}
                      {new Date().toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </CardTitle>
                    <CardDescription>
                      Principais métricas das últimas 24 horas
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">
                      {stats.todayStats.processesCreated}
                    </p>
                    <p className="text-sm text-gray-600">Processos Criados</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">+15%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {stats.todayStats.processesCompleted}
                    </p>
                    <p className="text-sm text-gray-600">Concluídos</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">+8%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">
                      {stats.todayStats.documentsReceived}
                    </p>
                    <p className="text-sm text-gray-600">Documentos</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">+22%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">
                      {Math.round(stats.averageCompletionTime * 24)}h
                    </p>
                    <p className="text-sm text-gray-600">Tempo Médio</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <TrendingDown className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">-12%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">
                      R${" "}
                      {(
                        stats.todayStats.processesCompleted * 850
                      ).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Receita Estimada</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">+18%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs Administrativas Expandidas */}
          <Tabs defaultValue="overview" className="w-full">
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 rounded-t-xl">
              <TabsList className="flex h-16 justify-start bg-transparent p-0">
                <TabsTrigger
                  value="overview"
                  className="group relative px-6 h-full border-b-2 border-transparent data-[state=active]:border-emerald-500 bg-transparent"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-data-[state=active]:text-emerald-600">
                      Visão Geral
                    </span>
                  </div>
                </TabsTrigger>

                <TabsTrigger
                  value="analytics"
                  className="group relative px-6 h-full border-b-2 border-transparent data-[state=active]:border-emerald-500 bg-transparent"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-data-[state=active]:text-emerald-600">
                      Analytics Avançados
                    </span>
                  </div>
                </TabsTrigger>

                <TabsTrigger
                  value="actions"
                  className="group relative px-6 h-full border-b-2 border-transparent data-[state=active]:border-emerald-500 bg-transparent"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-data-[state=active]:text-emerald-600">
                      Centro de Ações
                    </span>
                  </div>
                </TabsTrigger>

                <TabsTrigger
                  value="operators"
                  className="group relative px-6 h-full border-b-2 border-transparent data-[state=active]:border-emerald-500 bg-transparent"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-data-[state=active]:text-emerald-600">
                      Gestão de Operadores
                    </span>
                  </div>
                </TabsTrigger>

                <TabsTrigger
                  value="system"
                  className="group relative px-6 h-full border-b-2 border-transparent data-[state=active]:border-emerald-500 bg-transparent"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-data-[state=active]:text-emerald-600">
                      Sistema
                    </span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="py-6 bg-white dark:bg-gray-900 rounded-b-xl">
              {/* Tab: Visão Geral (conteúdo existente otimizado) */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* Métricas Principais */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <MetricCard
                    title="Total de Processos"
                    value={stats.totalProcesses}
                    icon={<Files className="h-5 w-5 text-emerald-500" />}
                    description="Todos os processos no sistema"
                  />
                  <MetricCard
                    title="Processos Ativos"
                    value={stats.activeProcesses}
                    icon={<Activity className="h-5 w-5 text-emerald-500" />}
                    description="Processos em andamento"
                  />
                  <MetricCard
                    title="Processos Concluídos"
                    value={stats.completedProcesses}
                    icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                    description="Processos aprovados"
                  />
                  <MetricCard
                    title="Taxa de Conclusão"
                    value={`${stats.processCompletionRate.toFixed(1)}%`}
                    icon={<Activity className="h-5 w-5 text-emerald-500" />}
                    description="Percentual de processos concluídos"
                  />
                </div>

                {/* Gráficos Principais Otimizados */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de Status */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border">
                    <div className="flex items-center gap-2 mb-6">
                      <Filter className="h-5 w-5 text-gray-500" />
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                        Distribuição de Status
                      </h3>
                    </div>
                    <div className="h-[300px]">
                      <Pie
                        data={pieChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: {
                                padding: 15,
                                usePointStyle: true,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  {/* Gráfico de Tipos de Processo */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border">
                    <div className="flex items-center gap-2 mb-6">
                      <Files className="h-5 w-5 text-gray-500" />
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                        Tipos de Processo
                      </h3>
                    </div>
                    <div className="h-[300px]">
                      <Bar
                        data={processTypeData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                precision: 0,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Analytics Avançados */}
              <TabsContent value="analytics" className="mt-0">
                <AdvancedAnalytics data={stats} />
              </TabsContent>

              {/* Tab: Centro de Ações */}
              <TabsContent value="actions" className="mt-0">
                <AdminActionCenter
                  onAction={(action, result) => {
                    console.log("Admin action executed:", action, result);
                    // Atualizar dados se necessário
                  }}
                />
              </TabsContent>

              {/* Tab: Gestão de Operadores */}
              <TabsContent value="operators" className="mt-0 space-y-6">
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Gestão de Operadores
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Módulo avançado de gestão em desenvolvimento
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <Card className="p-4 text-center">
                      <Users className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-medium">Performance Individual</p>
                      <p className="text-sm text-gray-500">KPIs por operador</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="font-medium">Metas e Objetivos</p>
                      <p className="text-sm text-gray-500">
                        Definição de metas
                      </p>
                    </Card>
                    <Card className="p-4 text-center">
                      <BarChart3 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-medium">Relatórios</p>
                      <p className="text-sm text-gray-500">
                        Análises detalhadas
                      </p>
                    </Card>
                          </div>
                        </div>
              </TabsContent>

              {/* Tab: Sistema */}
              <TabsContent value="system" className="mt-0 space-y-6">
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Configurações do Sistema
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Painel de configurações avançadas em desenvolvimento
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <Card className="p-4 text-center">
                      <Database className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-medium">Backup & Restore</p>
                      <p className="text-sm text-gray-500">Gestão de dados</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <Shield className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-medium">Segurança</p>
                      <p className="text-sm text-gray-500">Logs e auditoria</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <Bell className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-medium">Notificações</p>
                      <p className="text-sm text-gray-500">
                        Configurações globais
                      </p>
                    </Card>
                  </div>
                </div>
              </TabsContent>
                </div>
          </Tabs>
                        </div>
                      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 dark:from-emerald-950 dark:via-gray-900 dark:to-green-950">
        <div className="max-w-[1600px] mx-auto p-6 space-y-6">
          {/* Header Interativo */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-800 rounded-2xl p-6 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-green-600/20 backdrop-blur-sm"></div>
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                  Olá, {operator?.name}! 👋
                </h1>
                <p className="text-emerald-100 text-lg">
                  Você tem{" "}
                  <span className="font-bold text-white">
                    {stats.activeProcesses}
                  </span>{" "}
                  processos ativos
                </p>
                <div className="flex items-center gap-4 mt-3 text-emerald-200">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {new Date().toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      })}
                          </span>
                        </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">Status: Online</span>
                      </div>
                        </div>
                      </div>
              <div className="flex items-center gap-3">
                <NotificationFeed />
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                        </div>
                      </div>
            {/* Elementos decorativos */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-full translate-y-24 -translate-x-24"></div>
                    </div>

          {/* Widget de Estatísticas do Dia */}
          {stats.todayStats && (
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-xl p-4 shadow-lg border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                  Hoje ({new Date().toLocaleDateString("pt-BR")})
                      </h3>
                    </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats.todayStats.processesCreated}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Criados
                  </p>
                    </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {stats.todayStats.processesCompleted}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Concluídos
                  </p>
                  </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats.todayStats.documentsReceived}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Documentos
                  </p>
                    </div>
              </div>
                        </div>
                      )}

          {/* Grid Principal - 3 Colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna 1 - Métricas e Alertas */}
            <div className="space-y-6">
              {/* Cards de Métricas Compactos */}
              <div className="grid grid-cols-2 gap-4">
                {statusCards.map((card, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:scale-105 cursor-pointer"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${
                        index === 0
                          ? "from-emerald-500/5 to-emerald-600/10"
                          : index === 1
                          ? "from-green-500/5 to-green-600/10"
                          : index === 2
                          ? "from-emerald-500/5 to-green-600/10"
                          : "from-emerald-500/5 to-emerald-600/10"
                      } group-hover:opacity-100 opacity-70 transition-opacity`}
                    ></div>

                    <div className="relative z-10">
                      <div
                        className={`p-2 rounded-lg ${card.color} mb-3 w-fit`}
                      >
                        <card.icon className="h-5 w-5" />
                    </div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1">
                        {card.title}
                      </p>
                      <p className={`text-2xl font-bold ${card.textColor}`}>
                        {card.value}
                      </p>
                  </div>
                </div>
                ))}
                </div>

              {/* Widget de Alertas */}
              <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-red-100 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                      </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    Alertas Importantes
                  </h3>
                </div>
                <div className="space-y-3">
                  {stats.urgentProcesses > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">
                          {stats.urgentProcesses} processos urgentes
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Requer atenção imediata
                        </p>
                      </div>
                          </div>
                        )}
                  {stats.staleProcesses > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <Clock4 className="h-4 w-4 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                          {stats.staleProcesses} processos parados
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          Sem atividade há mais de 7 dias
                        </p>
                      </div>
                      </div>
                  )}
                  {stats.urgentProcesses === 0 &&
                    stats.staleProcesses === 0 && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-300">
                            Tudo em ordem! 🎉
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Nenhum alerta no momento
                          </p>
                        </div>
                          </div>
                        )}
                      </div>
                </div>

              {/* Widget de Performance Pessoal */}
              <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                    <Activity className="h-5 w-5" />
                      </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    Sua Performance
                  </h3>
                          </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Taxa de Sucesso
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        {stats.performanceRate}%
                      </span>
                      </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${stats.performanceRate}%` }}
                      ></div>
                      </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Tempo Médio
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        {stats.averageCompletionTime.toFixed(1)} dias
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(
                            (7 / stats.averageCompletionTime) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                          </div>
                      </div>
                </div>
              </div>
              </div>

            {/* Coluna 2 - Gráficos Interativos */}
            <div className="space-y-6">
              {/* Gráfico de Status com Filtros */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                      <BarChart3 className="h-5 w-5" />
                      </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      Status dos Processos
                    </h3>
                    </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar
                    </Button>
                </div>
                <div className="h-[280px]">
                  <Doughnut
                    data={pieChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: { size: 11, weight: "bold" },
                          },
                              },
                            },
                          }}
                        />
                        </div>
                    </div>

              {/* Gráfico de Tipos de Processo */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                    <Files className="h-5 w-5" />
                      </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    Tipos Mais Comuns
                  </h3>
                    </div>
                <div className="h-[280px]">
                  <Bar
                    data={processTypeData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                            scales: {
                              y: {
                                beginAtZero: true,
                          ticks: { precision: 0, font: { weight: "bold" } },
                          grid: { color: "rgba(0,0,0,0.05)" },
                        },
                        x: {
                          ticks: { font: { weight: "bold" } },
                          grid: { display: false },
                              },
                            },
                          }}
                        />
                        </div>
                    </div>
              </div>

            {/* Coluna 3 - Atividades e Processos */}
                    <div className="space-y-6">
              {/* Processos Prioritários */}
              <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-red-100 text-red-600">
                    <AlertOctagon className="h-5 w-5" />
                        </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    Prioridade Alta
                  </h3>
                        </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stats.urgentProcessesList &&
                  stats.urgentProcessesList.length > 0 ? (
                    stats.urgentProcessesList.map((process) => (
                      <div
                        key={process.id}
                        className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                      >
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {process.clientName ||
                              `Processo #${process.id.slice(-4)}`}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {process.statusLabel} · há {process.daysWaiting}{" "}
                            {process.daysWaiting === 1 ? "dia" : "dias"}
                          </p>
                      </div>
                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                        </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Nenhum processo urgente!
                      </p>
                      </div>
                  )}
                      </div>
                    </div>

              {/* Atividades Recentes */}
              <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                    <Activity className="h-5 w-5" />
              </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    Atividades Recentes
                  </h3>
        </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stats.recentActivities &&
                  stats.recentActivities.length > 0 ? (
                    stats.recentActivities.slice(0, 5).map((activity) => {
                      const getActivityIcon = (status: string) => {
                        switch (status) {
                          case "APPROVED":
                            return (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            );
                          case "IN_ANALYSIS":
    return (
                              <FileText className="h-4 w-4 text-emerald-600" />
                            );
                          case "DOCS_SENT":
                            return (
                              <MessageCircle className="h-4 w-4 text-emerald-600" />
                            );
                          default:
                            return (
                              <Activity className="h-4 w-4 text-gray-600" />
                            );
                        }
                      };

                      const getActivityColor = (status: string) => {
                        switch (status) {
                          case "APPROVED":
                            return "bg-green-100";
                          case "IN_ANALYSIS":
                            return "bg-emerald-100";
                          case "DOCS_SENT":
                            return "bg-emerald-100";
                          default:
                            return "bg-gray-100";
                        }
                      };

                      const getTimeLabel = (timeAgo: number) => {
                        if (timeAgo < 60) {
                          return `há ${timeAgo} min`;
                        } else if (timeAgo < 1440) {
                          return `há ${Math.floor(timeAgo / 60)}h`;
                        } else {
                          return `há ${Math.floor(timeAgo / 1440)} dias`;
                        }
                      };

                      return (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                        >
                          <div
                            className={`w-8 h-8 rounded-full ${getActivityColor(
                              activity.status
                            )} flex items-center justify-center`}
                          >
                            {getActivityIcon(activity.status)}
                  </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {activity.statusLabel}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {activity.clientName || "Cliente"} ·{" "}
                              {getTimeLabel(activity.timeAgo)}
                    </p>
                  </div>
                </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Nenhuma atividade recente
                    </p>
                  </div>
                  )}
                </div>
          </div>

              {/* Últimos Clientes */}
              <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    Últimos Clientes
                </h3>
              </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stats.recentClients && stats.recentClients.length > 0 ? (
                    stats.recentClients.slice(0, 6).map((client) => {
                      const joinedDaysAgo = Math.floor(
                        (new Date().getTime() -
                          new Date(client.joinedAt).getTime()) /
                          (1000 * 60 * 60 * 24)
                      );

                      const getSourceColor = (source?: string) => {
                        switch (source) {
                          case "BOT":
                            return "bg-emerald-100 text-emerald-600";
                          case "PLATFORM":
                            return "bg-emerald-100 text-emerald-600";
                          case "MANUAL":
                            return "bg-emerald-100 text-emerald-600";
                          default:
                            return "bg-gray-100 text-gray-600";
                        }
                      };

                      const getSourceLabel = (source?: string) => {
                        switch (source) {
                          case "BOT":
                            return "Bot";
                          case "PLATFORM":
                            return "Plataforma";
                          case "MANUAL":
                            return "Manual";
                          default:
                            return "N/A";
                        }
                      };

                      return (
                        <div
                          key={client.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/70 cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                            {client.name.charAt(0).toUpperCase()}
              </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {client.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(
                                  client.source
                                )}`}
                              >
                                {getSourceLabel(client.source)}
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {client.processes} processo
                                {client.processes !== 1 ? "s" : ""}
                              </span>
              </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {joinedDaysAgo === 0
                                ? "Hoje"
                                : joinedDaysAgo === 1
                                ? "Ontem"
                                : `há ${joinedDaysAgo} dias`}
                            </p>
            </div>
                          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Nenhum cliente recente
                      </p>
              </div>
                  )}
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
