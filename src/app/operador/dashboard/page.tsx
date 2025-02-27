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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CheckCircle,
  Clock,
  Clock4,
  Download,
  Files,
  FileText,
  ListFilter,
  RefreshCw,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, Doughnut, Pie } from "react-chartjs-2";

interface DashboardStatsOperator {
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
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = operator?.role === "ADMIN";

  useEffect(() => {
    const fetchStats = async () => {
      if (!operator?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/dashboard/stats/${operator.id}`);
        const data = await response.json();

         if (!response.ok) throw new Error(data.error);
        setStats(data);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [operator?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-gray-400" />
          <p className="text-gray-500 text-lg">Não há dados disponíveis para exibição no momento</p>
          <p className="text-gray-400 text-sm">Tente novamente mais tarde ou entre em contato com o suporte</p>
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

  const priorityData = {
    labels: stats?.priorityData?.labels || [],
    datasets: [
      {
        data: stats?.priorityData?.datasets[0].data || [],
        backgroundColor: ["#EF4444", "#F59E0B", "#10B981"],
      },
    ],
  };

  const documentStatusData = {
    labels: stats?.documentStatusData?.labels || [],
    datasets: [
      {
        data: stats?.documentStatusData?.datasets[0].data || [],
        backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
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
          "#3B82F6", // Azul
          "#10B981", // Verde
          "#F59E0B", // Amarelo
          "#EF4444", // Vermelho
          "#8B5CF6", // Roxo
          "#EC4899", // Rosa
        ],
      },
    ],
  };

  const statusCards = [
    {
      title: "Processos Ativos",
      value: stats.activeProcesses || 0,
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
      textColor: "text-blue-600",
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
      color: "bg-yellow-50 text-yellow-600",
      textColor: "text-yellow-600",
    },
    {
      title: "Taxa de Sucesso",
      value: `${stats.performanceRate || 0}%`,
      icon: Activity,
      color: "bg-purple-50 text-purple-600",
      textColor: "text-purple-600",
    },
  ];

  const metricCards = [
    {
      title: "Processos Urgentes",
      value: stats.urgentProcesses || 0,
      icon: AlertTriangle,
      color: "bg-red-50 text-red-600",
      textColor: "text-red-600",
    },
    {
      title: "Tempo Médio",
      value: `${stats.averageCompletionTime.toFixed(2)} dias`,
      icon: Clock4,
      color: "bg-indigo-50 text-indigo-600",
      textColor: "text-indigo-600",
    },
    {
      title: "Média Documentos",
      value: stats.averageDocuments.toFixed(2) || 0,
      icon: Files,
      color: "bg-teal-50 text-teal-600",
      textColor: "text-teal-600",
    },
    {
      title: "Processos Parados",
      value: stats.staleProcesses || 0,
      icon: AlertOctagon,
      color: "bg-orange-50 text-orange-600",
      textColor: "text-orange-600",
    },
  ];

  if (!isAdmin) {
    return (
      <div className="min-h-screen ">
        <div className="max-w-[1600px] mx-auto  space-y-6">
          {/* Header */}
          <div className="bg-white  rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Dashboard
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Bem-vindo ao seu painel de controle, {operator?.name}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <NotificationFeed />

                <Clock className="h-4 w-4" />
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </div>
            </div>
          </div>

          {/* Cards Principais - 2 linhas de 4 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statusCards.map((card, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {card.title}
                    </p>
                    <p className={`text-xl font-bold ${card.textColor}`}>
                      {card.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {metricCards.map((card, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {card.title}
                    </p>
                    <p className={`text-xl font-bold ${card.textColor}`}>
                      {card.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grid de Gráficos e Informações */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Status dos Processos */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <ListFilter className="h-5 w-5 text-gray-500" />
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
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
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

            {/* Gráfico de Prioridades */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <AlertOctagon className="h-5 w-5 text-gray-500" />
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                  Distribuição por Prioridade
                </h3>
              </div>
              <div className="h-[300px]">
                <Doughnut
                  data={priorityData}
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

            {/* Gráfico de Documentos por Status */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="h-5 w-5 text-gray-500" />
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                  Status dos Documentos
                </h3>
              </div>
              <div className="h-[300px]">
                <Bar
                  data={documentStatusData}
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
        </div>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-gradient-to-br  ">
        <div className="max-w-[1600px] mx-auto  space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Painel Administrativo
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Visão geral do sistema e métricas
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Exportar Relatório
                </Button>
                <Button className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Atualizar Dados
                </Button>
              </div>
            </div>
          </div>

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total de Operadores"
              value={stats.totalOperators}
              icon={Users}
              color="blue"
            />
            <MetricCard
              title="Total de Clientes"
              value={stats.totalClients}
              icon={Users}
              color="green"
            />
            <MetricCard
              title="Processos Ativos"
              value={stats.activeProcesses}
              icon={FileText}
              color="yellow"
            />
            <MetricCard
              title="Taxa de Conclusão"
              value={`${stats.processCompletionRate.toFixed(1)}%`}
              icon={CheckCircle}
              color="emerald"
            />
          </div>

          {/* Gráficos Principais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900 ">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold">
                      Origem dos Processos
                    </CardTitle>
                    <CardDescription>
                      Distribuição por canal de entrada
                    </CardDescription>
                  </div>
                  <Select defaultValue="month">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Última Semana</SelectItem>
                      <SelectItem value="month">Último Mês</SelectItem>
                      <SelectItem value="year">Último Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px]">
                  <Doughnut
                    data={stats.sourceDistribution}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900 ">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold">
                      Performance dos Operadores
                    </CardTitle>
                    <CardDescription>
                      Taxa de sucesso por operador
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px]">
                  <Bar
                    data={stats.operatorPerformance}
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
                          max: 100,
                          ticks: {
                            callback: (value) => `${value}%`,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métricas de Eficiência */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900  ">
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-500">
                    Tempo Médio de Conclusão
                  </span>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-gray-800">
                      {stats.averageProcessTime.toFixed(1)}
                    </span>
                    <span className="text-gray-500 mb-1">dias</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <span className="text-sm text-gray-500">Meta: 7 dias</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900 ">
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-500">
                    Taxa de Verificação
                  </span>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-gray-800">
                      {stats?.documentVerificationRate?.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={stats?.documentVerificationRate}
                    className="h-2"
                  />
                  <span className="text-sm text-gray-500">Meta: 95%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900 ">
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-500">
                    Processos por Operador
                  </span>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-gray-800">
                      {stats.processesPerOperator.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <span className="text-sm text-gray-500">
                    Meta: 15 processos
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
}
