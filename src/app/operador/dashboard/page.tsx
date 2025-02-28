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
  Clock,
  Clock4,
  Download,
  Files,
  FileText,
  Filter,
  ListFilter,
  MessageSquare,
  RefreshCw,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, Doughnut, Pie } from "react-chartjs-2";

interface DashboardStatsOperator {
  rejectionReasons:   number;
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

      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/stats/${operator.id}`);
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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

  if (isAdmin) {
    return (
      <div className="min-h-screen    dark:from-gray-950 dark:to-gray-900  ">
        <div className="max-w-[1600px]   space-y-6">
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
                <Button className="gap-2"   >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar Dados
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs de Navegação */}
          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="grid grid-cols-4  ">
              <TabsTrigger value="geral">Visão Geral</TabsTrigger>
              <TabsTrigger value="processos">Processos</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="operacional">Desempenho</TabsTrigger>
            </TabsList>

            {/* Tab: Visão Geral */}
            <TabsContent value="geral" className="space-y-6">
              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <MetricCard
                  title="Total de Processos"
                  value={stats.totalProcesses}
                  icon={<Files className="h-5 w-5 text-blue-500" />}
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
                  icon={<Activity className="h-5 w-5 text-indigo-500" />}
                  description="Percentual de processos concluídos"
                />
              </div>

              {/* Gráficos Principais */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Status */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
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
              </div>

              {/* Métricas de Eficiência */}
              <div className="mb-6">
                 
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-gray-500">
                          Tempo Médio de Conclusão
                        </span>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-bold text-gray-800">
                            {stats.averageCompletionTime.toFixed(1)}
                          </span>
                          <span className="text-gray-500 mb-1">dias</span>
                        </div>
                        <Progress 
                          value={Math.min((7 / stats.averageCompletionTime) * 100, 100)} 
                          className="h-2" 
                        />
                        <span className="text-sm text-gray-500">Meta: 7 dias</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900">
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

                  <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900">
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
                        <Progress 
                          value={(stats.processesPerOperator / 15) * 100} 
                          className="h-2" 
                        />
                        <span className="text-sm text-gray-500">
                          Meta: 15 processos
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Processos */}
            <TabsContent value="processos" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <MetricCard
                  title="Processos Urgentes"
                  value={stats.urgentProcesses}
                  icon={<AlertCircle className="h-5 w-5 text-red-500" />}
                  description="Prioridade alta"
                  color="red"
                />
                <MetricCard
                  title="Processos Parados"
                  value={stats.staleProcesses}
                  icon={<Clock className="h-5 w-5 text-yellow-500" />}
                  description="Sem atividade recente"
                  color="yellow"
                />
                <MetricCard
                  title="Em Análise"
                  value={stats.inProgressProcesses}
                  icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
                  description="Processos em análise"
                  color="blue"
                />
                <MetricCard
                  title="Média de Documentos"
                  value={stats.averageDocuments.toFixed(1)}
                  icon={<FileText className="h-5 w-5 text-purple-500" />}
                  description="Por processo"
                  color="purple"
                />
              </div>

              {/* Funil de Conversão */}
              <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900 mb-6">
                <CardHeader>
                  <CardTitle>Funil de Conversão</CardTitle>
                  <CardDescription>Progresso dos processos por etapa</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Criados</span>
                        <span className="text-sm font-medium">{stats.totalProcesses || 0}</span>
                      </div>
                      <Progress value={100} className="h-2 bg-gray-200" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Documentos Enviados</span>
                        <span className="text-sm font-medium">
                          {stats.processesByStatus?.find((s) => s.status === 'DOCS_SENT')?.count || 0}
                        </span>
                      </div>
                      <Progress 
                        value={stats.totalProcesses ? 
                          ((stats.processesByStatus?.find((s) => s.status === 'DOCS_SENT')?.count || 0) / stats.totalProcesses) * 100 : 0} 
                        className="h-2 bg-gray-200" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Em Análise</span>
                        <span className="text-sm font-medium">
                          {stats.processesByStatus?.find((s) => s.status === 'IN_ANALYSIS')?.count || 0}
                        </span>
                      </div>
                      <Progress 
                        value={stats.totalProcesses ? 
                          ((stats.processesByStatus?.find((s) => s.status === 'IN_ANALYSIS')?.count || 0) / stats.totalProcesses) * 100 : 0} 
                        className="h-2 bg-gray-200" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Aprovados</span>
                        <span className="text-sm font-medium">
                          {stats.processesByStatus?.find((s) => s.status === 'APPROVED')?.count || 0}
                        </span>
                      </div>
                      <Progress 
                        value={stats.totalProcesses ? 
                          ((stats.processesByStatus?.find((s) => s.status === 'APPROVED')?.count || 0) / stats.totalProcesses) * 100 : 0} 
                        className="h-2 bg-gray-200" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gráficos de Processos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                {/* Origem dos Processos */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <MessageSquare className="h-5 w-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                      Origem dos Processos
                    </h3>
                  </div>
                  <div className="h-[300px]">
                    {stats.sourceDistribution ? (
                      <Doughnut
                        data={stats.sourceDistribution}
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
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Dados não disponíveis</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Documentos */}
            <TabsContent value="documentos" className="space-y-6">
              {/* Métricas de Documentos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <MetricCard
                  title="Total de Documentos"
                  value={stats.totalDocuments || 0}
                  icon={<FileText className="h-5 w-5 text-blue-500" />}
                  description="Todos os documentos"
                />
                <MetricCard
                  title="Taxa de Verificação"
                  value={`${stats.documentVerificationRate?.toFixed(1) || 0}%`}
                  icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                  description="Documentos verificados"
                  color="green"
                />
                <MetricCard
                  title="Taxa de Rejeição"
                  value={`${stats.documentRejectionRate?.toFixed(1) || 0}%`}
                  icon={<AlertCircle className="h-5 w-5 text-red-500" />}
                  description="Documentos rejeitados"
                  color="red"
                />
              </div>

              {/* Primeira linha de gráficos - lado a lado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Gráfico de Status dos Documentos */}
                <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <CardTitle>Status dos Documentos</CardTitle>
                    </div>
                    <CardDescription>Distribuição por status atual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {stats.documentStatusData ? (
                        <Doughnut
                          data={stats.documentStatusData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: {
                                  padding: 10,
                                  usePointStyle: true,
                                  boxWidth: 10
                                },
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const label = context.label || '';
                                    const value = Number(context.raw) || 0;
                                    const total = context.dataset.data.reduce((a: number, b: number) => (a + b), 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                  }
                                }
                              }
                            },
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">Dados não disponíveis</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Taxa de Verificação por Tipo */}
                <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <CardTitle>Taxa de Verificação por Tipo</CardTitle>
                    </div>
                    <CardDescription>Percentual de documentos verificados por categoria</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {stats.documentVerificationByType ? (
                        <Bar
                          data={stats.documentVerificationByType}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            indexAxis: 'y',
                            plugins: {
                              legend: { display: false }
                            },
                            scales: {
                              x: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                  callback: function(value) {
                                    return value + '%';
                                  }
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">Dados não disponíveis</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Segunda linha de gráficos - lado a lado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Motivos de Rejeição */}
                <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <CardTitle>Motivos de Rejeição</CardTitle>
                    </div>
                    <CardDescription>Principais razões para rejeição de documentos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {stats.rejectionReasons ? (
                        <Bar
                          data={{
                            labels: Array.isArray(stats.rejectionReasons) 
                              ? stats.rejectionReasons.map(item => item.label)
                              : [],
                            datasets: [{
                              label: 'Motivos de Rejeição',
                              data: Array.isArray(stats.rejectionReasons) 
                                ? stats.rejectionReasons.map(item => item.value)
                                : [],
                              backgroundColor: 'rgba(53, 162, 235, 0.5)',
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  precision: 0
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">Dados não disponíveis</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tempo de Processamento de Documentos */}
                <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <CardTitle>Tempo de Processamento</CardTitle>
                    </div>
                    <CardDescription>Tempo médio para verificação por tipo de documento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {stats.documentProcessingTime ? (
                        <Bar
                          data={stats.documentProcessingTime}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: 'Horas'
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">Dados não disponíveis</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Desempenho */}
            <TabsContent value="operacional" className="space-y-6">
              {/* Métricas de Desempenho */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <MetricCard
                  title="Total de Operadores"
                  value={stats.totalOperators || 0}
                  icon={<Users className="h-5 w-5 text-blue-500" />}
                  description="Operadores ativos"
                />
                <MetricCard
                  title="Taxa Média de Sucesso"
                  value={`${stats.taxaSucesso?.toFixed(1) || 0}%`}
                  icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                  description="Dos operadores"
                  color="green"
                />
                <MetricCard
                  title="Tempo Médio de Resposta"
                  value={`${stats.averageProcessTime || 0}h`}
                  icon={<Clock className="h-5 w-5 text-yellow-500" />}
                  description="Primeira ação"
                  color="yellow"
                />
              </div>

              {/* Primeira linha de gráficos - lado a lado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Performance dos Operadores */}
                <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <CardTitle>Performance dos Operadores</CardTitle>
                      </div>
                      <CardDescription>Taxa de sucesso por operador</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Exportar</span>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {stats.operatorPerformance ? (
                        <Bar
                          data={stats.operatorPerformance}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 100,
                                title: {
                                  display: true,
                                  text: 'Taxa de Sucesso (%)'
                                },
                                ticks: {
                                  callback: function(value) {
                                    return value + '%';
                                  }
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">Dados não disponíveis</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Carga de Trabalho */}
                <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-500" />
                        <CardTitle>Carga de Trabalho</CardTitle>
                      </div>
                      <CardDescription>Processos ativos por operador</CardDescription>
                    </div>
                    <Select defaultValue="active">
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue placeholder="Filtrar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Processos Ativos</SelectItem>
                        <SelectItem value="all">Todos Processos</SelectItem>
                        <SelectItem value="completed">Concluídos</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {stats.operatorWorkload ? (
                        <Bar
                          data={stats.operatorWorkload}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: 'Número de Processos'
                                },
                                ticks: {
                                  precision: 0
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">Dados não disponíveis</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Segunda linha de gráficos - lado a lado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tempo de Resposta */}
                <Card className="shadow-sm hover:shadow-md transition-all dark:bg-gray-900">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <CardTitle>Tempo de Resposta</CardTitle>
                    </div>
                    <CardDescription>Média de tempo para primeira ação</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Documentos</span>
                          <span className="text-sm">{stats.responseTime?.documents || 0} horas</span>
                        </div>
                        <Progress 
                          value={Math.min((stats.responseTime?.documents || 0) / 24 * 100, 100)} 
                          className="h-2" 
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0h</span>
                          <span>12h</span>
                          <span>24h+</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Análise</span>
                          <span className="text-sm">{stats.responseTime?.analysis || 0} horas</span>
                        </div>
                        <Progress 
                          value={Math.min((stats.responseTime?.analysis || 0) / 24 * 100, 100)} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Aprovação</span>
                          <span className="text-sm">{stats.responseTime?.approval || 0} horas</span>
                        </div>
                        <Progress 
                          value={Math.min((stats.responseTime?.approval || 0) / 24 * 100, 100)} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  } else {
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
  }
}
