"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Users,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Calendar,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Bar, Line, Doughnut, Radar } from "react-chartjs-2";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AdvancedAnalyticsProps {
  data?: any;
}

interface AnalyticsData {
  kpis: {
    efficiency: number;
    satisfaction: number;
    revenue: number;
    growth: number;
    bottlenecks: number;
    predictions: {
      nextMonthProcesses: number;
      efficiency: number;
      potentialIssues: number;
    };
  };
  trends: any;
  operatorPerformance: any;
  bottleneckAnalysis: any;
  predictiveAnalytics: any;
  insights: Array<{
    type: "success" | "warning" | "error" | "info";
    title: string;
    message: string;
    action?: string | null;
  }>;
  systemStats: {
    totalProcesses: number;
    activeProcesses: number;
    completedProcesses: number;
    totalOperators: number;
    totalClients: number;
    pendingNotifications: number;
    avgProgress: number;
    documentStats: Array<{ status: string; count: number }>;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    category: string;
    createdAt: string;
    operatorName?: string;
    clientName?: string;
  }>;
}

export function AdvancedAnalytics({ data }: AdvancedAnalyticsProps) {
  const { operator } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );

  const fetchAnalyticsData = async () => {
    if (!operator?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/v1/admin/analytics?timeRange=${timeRange}&adminId=${operator.id}`
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error("Erro ao carregar analytics:", error);
      toast.error("Erro ao carregar dados de analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, operator?.id]);

  const getStatusColor = (value: number, threshold: number) => {
    if (value >= threshold) return "text-green-600";
    if (value >= threshold * 0.8) return "text-yellow-600";
    return "text-red-600";
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "success":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "info":
        return <Calendar className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin bg-emerald-200 rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-gray-400" />
          <p className="text-gray-500 text-lg">
            Erro ao carregar dados de analytics
          </p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Eficiência Operacional",
      value: analyticsData.kpis.efficiency,
      suffix: "%",
      target: 90,
      icon: Target,
      trend: `${
        analyticsData.kpis.growth > 0 ? "+" : ""
      }${analyticsData.kpis.growth.toFixed(1)}%`,
      trendUp: analyticsData.kpis.growth >= 0,
      description: "Meta: 90%",
    },
    {
      title: "Satisfação do Cliente",
      value: analyticsData.kpis.satisfaction,
      suffix: "%",
      target: 95,
      icon: Users,
      trend: "+2.1%",
      trendUp: true,
      description: "Baseado em feedback",
    },
    {
      title: "Receita do Período",
      value: analyticsData.kpis.revenue,
      prefix: "R$ ",
      target: 150000,
      icon: BarChart3,
      trend: `${
        analyticsData.kpis.growth > 0 ? "+" : ""
      }${analyticsData.kpis.growth.toFixed(1)}%`,
      trendUp: analyticsData.kpis.growth >= 0,
      description: `Últimos ${timeRange}`,
    },
    {
      title: "Gargalos Identificados",
      value: analyticsData.kpis.bottlenecks,
      suffix: " críticos",
      target: 2,
      icon: AlertCircle,
      trend: analyticsData.kpis.bottlenecks <= 2 ? "Normal" : "Alto",
      trendUp: analyticsData.kpis.bottlenecks <= 2,
      description: "Requer atenção",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header com Controles */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Analytics Estratégicos
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Insights avançados e métricas de performance - Dados em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={fetchAnalyticsData}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas do Sistema */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Resumo do Sistema
          </CardTitle>
          <CardDescription>
            Dados totais do sistema - Período atual:{" "}
            {timeRange === "7d"
              ? "7 dias"
              : timeRange === "30d"
              ? "30 dias"
              : timeRange === "90d"
              ? "90 dias"
              : "1 ano"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {analyticsData.systemStats.totalProcesses}
              </p>
              <p className="text-sm text-gray-600">Total de Processos</p>
              <p className="text-xs text-gray-500">(Todos os tempos)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {analyticsData.systemStats.completedProcesses}
              </p>
              <p className="text-sm text-gray-600">Concluídos</p>
              <p className="text-xs text-gray-500">(Todos os tempos)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {analyticsData.systemStats.activeProcesses}
              </p>
              <p className="text-sm text-gray-600">Ativos</p>
              <p className="text-xs text-gray-500">(No momento)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {analyticsData.systemStats.totalOperators}
              </p>
              <p className="text-sm text-gray-600">Operadores</p>
              <p className="text-xs text-gray-500">(Ativos)</p>
            </div>
          </div>

          {/* Informações do período se disponível */}
          {(analyticsData as any).periodInfo && (
            <div className="mt-4 p-3 bg-white/60 rounded-lg border">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-indigo-600">
                    {(analyticsData as any).periodInfo.processesInPeriod}
                  </p>
                  <p className="text-xs text-gray-600">Processos no período</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-600">
                    {(analyticsData as any).periodInfo.completedInPeriod}
                  </p>
                  <p className="text-xs text-gray-600">Concluídos no período</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <kpi.icon className="h-5 w-5 text-gray-500" />
                <div className="flex items-center gap-1">
                  {kpi.trendUp ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      kpi.trendUp ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {kpi.trend}
                  </span>
                </div>
              </div>
              <CardTitle className="text-sm font-medium text-gray-600">
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-3xl font-bold ${getStatusColor(
                      kpi.value,
                      kpi.target
                    )}`}
                  >
                    {kpi.prefix}
                    {typeof kpi.value === "number"
                      ? kpi.value.toLocaleString()
                      : kpi.value}
                    {kpi.suffix}
                  </span>
                </div>
                <Progress
                  value={Math.min((kpi.value / kpi.target) * 100, 100)}
                  className="h-2"
                />
                <p className="text-xs text-gray-500">{kpi.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendências Temporais */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Tendências de Performance
                </CardTitle>
                <CardDescription>
                  Evolução da eficiência e volume de processos
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={
                  analyticsData.kpis.growth >= 0
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }
              >
                {analyticsData.kpis.growth >= 0
                  ? "Tendência Positiva"
                  : "Tendência Negativa"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line
                data={analyticsData.trends}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: "index" as const,
                    intersect: false,
                  },
                  plugins: {
                    legend: {
                      position: "top" as const,
                    },
                  },
                  scales: {
                    x: {
                      display: true,
                      title: {
                        display: true,
                        text: "Período",
                      },
                    },
                    y: {
                      type: "linear" as const,
                      display: true,
                      position: "left" as const,
                      title: {
                        display: true,
                        text: "Eficiência (%)",
                      },
                    },
                    y1: {
                      type: "linear" as const,
                      display: true,
                      position: "right" as const,
                      title: {
                        display: true,
                        text: "Volume de Processos",
                      },
                      grid: {
                        drawOnChartArea: false,
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Performance dos Operadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Ranking de Performance
            </CardTitle>
            <CardDescription>
              Taxa de sucesso por operador (dados reais)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <Bar
                data={analyticsData.operatorPerformance}
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
                      title: {
                        display: true,
                        text: "Taxa de Sucesso (%)",
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Análise de Gargalos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Análise de Gargalos
            </CardTitle>
            <CardDescription>
              Distribuição de processos por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <Bar
                data={analyticsData.bottleneckAnalysis}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: "y" as const,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: "Quantidade de Processos",
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Preditivos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Previsões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Previsões Inteligentes
            </CardTitle>
            <CardDescription>
              Projeções baseadas em dados históricos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Próximo mês</span>
                <span className="font-bold text-lg">
                  {analyticsData.kpis.predictions.nextMonthProcesses} processos
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Eficiência prevista
                </span>
                <span className="font-bold text-lg text-green-600">
                  {analyticsData.kpis.predictions.efficiency}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Problemas potenciais
                </span>
                <Badge
                  variant="outline"
                  className={
                    analyticsData.kpis.predictions.potentialIssues === 0
                      ? "bg-green-50 text-green-700"
                      : "bg-yellow-50 text-yellow-700"
                  }
                >
                  {analyticsData.kpis.predictions.potentialIssues} alertas
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacidade vs Demanda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Capacidade vs Demanda
            </CardTitle>
            <CardDescription>Projeção de recursos necessários</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <Bar
                data={analyticsData.predictiveAnalytics}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom" as const,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Insights Automáticos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Insights Automáticos
            </CardTitle>
            <CardDescription>Análises baseadas em dados reais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.insights.slice(0, 3).map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg ${getInsightColor(
                    insight.type
                  )}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getInsightIcon(insight.type)}
                    <span
                      className={`text-sm font-medium ${
                        insight.type === "success"
                          ? "text-green-800"
                          : insight.type === "warning"
                          ? "text-yellow-800"
                          : insight.type === "error"
                          ? "text-red-800"
                          : "text-blue-800"
                      }`}
                    >
                      {insight.title}
                    </span>
                  </div>
                  <p
                    className={`text-xs ${
                      insight.type === "success"
                        ? "text-green-700"
                        : insight.type === "warning"
                        ? "text-yellow-700"
                        : insight.type === "error"
                        ? "text-red-700"
                        : "text-blue-700"
                    }`}
                  >
                    {insight.message}
                  </p>
                  {insight.action && (
                    <p className="text-xs font-medium mt-1 text-gray-600">
                      💡 {insight.action}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atividades Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Atividades Recentes do Sistema
          </CardTitle>
          <CardDescription>
            Últimas {analyticsData.recentActivity.length} atividades registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {analyticsData.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === "SUCCESS"
                      ? "bg-green-500"
                      : activity.type === "WARNING"
                      ? "bg-yellow-500"
                      : activity.type === "ERROR"
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-xs text-gray-600">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {activity.operatorName && (
                      <span className="text-xs text-gray-500">
                        Por: {activity.operatorName}
                      </span>
                    )}
                    {activity.clientName && (
                      <span className="text-xs text-gray-500">
                        Cliente: {activity.clientName}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(activity.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
