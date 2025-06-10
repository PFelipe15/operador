"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  FileText,
  Eye,
  PenTool,
  Trophy,
  Ban,
  AlertTriangle,
  CreditCard,
  Play,
} from "lucide-react";

// Dados dos status (mesmos do StatusService)
const STATUS_DATA = {
  // Status iniciais
  INICIADO: {
    title: "Processo Iniciado",
    description: "Processo de abertura de MEI foi iniciado pelo cliente",
    userMessage: "Seu processo de abertura de MEI foi iniciado com sucesso!",
    action: "Aguardando informações do cliente",
    color: "blue",
    icon: "🚀",
    category: "inicial",
  },

  // Status de cadastro
  AWAITING_PAYMENT: {
    title: "Aguardando Pagamento",
    description:
      "Cliente preencheu todos os dados e está na etapa de escolha do método de pagamento",
    userMessage:
      "Tudo pronto! Agora precisamos apenas do pagamento para iniciar seu MEI.",
    action: "Cliente deve escolher método de pagamento",
    color: "orange",
    icon: "💳",
    category: "pagamento",
  },

  PAYMENT_PENDING: {
    title: "Pagamento Pendente",
    description: "Cliente escolheu método de pagamento mas ainda não confirmou",
    userMessage:
      "Vimos que você está interessado em abrir seu MEI! Falta apenas confirmar o pagamento para darmos início ao processo.",
    action: "Aguardando confirmação de pagamento",
    color: "yellow",
    icon: "⏳",
    category: "pagamento",
  },

  PAYMENT_CONFIRMED: {
    title: "Pagamento Confirmado",
    description:
      "Pagamento foi confirmado e processo pode iniciar efetivamente",
    userMessage:
      "Pagamento confirmado! Nossa equipe já iniciou o processo de abertura do seu MEI.",
    action: "Equipe pode iniciar o processo",
    color: "green",
    icon: "✅",
    category: "pagamento",
  },

  PAYMENT_FAILED: {
    title: "Pagamento Rejeitado",
    description: "Pagamento foi rejeitado ou cancelado pelo cliente",
    userMessage:
      "Houve um problema com seu pagamento. Você pode tentar novamente quando quiser!",
    action: "Cliente pode tentar novo pagamento",
    color: "red",
    icon: "❌",
    category: "pagamento",
  },

  // Status de processamento
  IN_PROGRESS: {
    title: "Em Andamento",
    description: "Equipe está processando a abertura do MEI",
    userMessage: "Sua abertura de MEI está sendo processada pela nossa equipe!",
    action: "Aguardando conclusão da equipe",
    color: "blue",
    icon: "⚙️",
    category: "processamento",
  },

  AWAITING_DOCUMENTS: {
    title: "Aguardando Documentos",
    description: "Processo precisa de documentos adicionais do cliente",
    userMessage:
      "Precisamos de alguns documentos adicionais para continuar seu MEI.",
    action: "Cliente deve enviar documentos solicitados",
    color: "orange",
    icon: "📄",
    category: "processamento",
  },

  UNDER_REVIEW: {
    title: "Em Análise",
    description: "Documentos estão sendo analisados pela equipe",
    userMessage: "Seus documentos estão sendo analisados pela nossa equipe!",
    action: "Equipe analisando documentação",
    color: "purple",
    icon: "🔍",
    category: "processamento",
  },

  AWAITING_SIGNATURE: {
    title: "Aguardando Assinatura",
    description: "Cliente precisa assinar documentos",
    userMessage: "Tudo pronto! Agora preciso que você assine os documentos.",
    action: "Cliente deve assinar documentos",
    color: "orange",
    icon: "✍️",
    category: "processamento",
  },

  // Status de finalização
  COMPLETED: {
    title: "Concluído",
    description: "MEI foi aberto com sucesso",
    userMessage: "Parabéns! Seu MEI foi aberto com sucesso! 🎉",
    action: "Processo finalizado com sucesso",
    color: "green",
    icon: "🎉",
    category: "finalizacao",
  },

  CANCELLED: {
    title: "Cancelado",
    description: "Processo foi cancelado pelo cliente ou sistema",
    userMessage:
      "Seu processo foi cancelado. Você pode iniciar um novo quando quiser!",
    action: "Processo cancelado",
    color: "gray",
    icon: "🚫",
    category: "finalizacao",
  },

  ERROR: {
    title: "Erro no Processo",
    description: "Ocorreu um erro que impede a continuação",
    userMessage:
      "Ops! Ocorreu um erro no seu processo. Nossa equipe foi notificada.",
    action: "Verificar erro e corrigir",
    color: "red",
    icon: "⚠️",
    category: "finalizacao",
  },
};

const PAYMENT_METHODS = {
  pix: {
    name: "PIX",
    icon: "📱",
    description: "Pagamento instantâneo via PIX",
  },
  credit_card: {
    name: "Cartão de Crédito",
    icon: "💳",
    description: "Parcelamento em até 12x",
  },
  debit_card: {
    name: "Cartão de Débito",
    icon: "💳",
    description: "Débito à vista",
  },
  ticket: {
    name: "Boleto Bancário",
    icon: "🏦",
    description: "Vencimento em 3 dias úteis",
  },
};

const getColorClasses = (color: string) => {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    green: "bg-green-50 border-green-200 text-green-800",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
    orange: "bg-orange-50 border-orange-200 text-orange-800",
    red: "bg-red-50 border-red-200 text-red-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
    gray: "bg-gray-50 border-gray-200 text-gray-800",
  };
  return colors[color] || colors.gray;
};

const getCategoryIcon = (category: string) => {
  const icons = {
    inicial: <Play className="w-4 h-4" />,
    pagamento: <CreditCard className="w-4 h-4" />,
    processamento: <Settings className="w-4 h-4" />,
    finalizacao: <Trophy className="w-4 h-4" />,
  };
  return icons[category] || <AlertCircle className="w-4 h-4" />;
};

const StatusGuide = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    {
      id: "all",
      name: "Todos os Status",
      count: Object.keys(STATUS_DATA).length,
    },
    {
      id: "inicial",
      name: "Iniciais",
      count: Object.values(STATUS_DATA).filter((s) => s.category === "inicial")
        .length,
    },
    {
      id: "pagamento",
      name: "Pagamento",
      count: Object.values(STATUS_DATA).filter(
        (s) => s.category === "pagamento"
      ).length,
    },
    {
      id: "processamento",
      name: "Processamento",
      count: Object.values(STATUS_DATA).filter(
        (s) => s.category === "processamento"
      ).length,
    },
    {
      id: "finalizacao",
      name: "Finalização",
      count: Object.values(STATUS_DATA).filter(
        (s) => s.category === "finalizacao"
      ).length,
    },
  ];

  const filteredStatuses = Object.entries(STATUS_DATA).filter(
    ([key, status]) => {
      const matchesSearch =
        key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        status.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        status.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || status.category === selectedCategory;

      return matchesSearch && matchesCategory;
    }
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Guia de Status dos Processos
          </h1>
        </div>
        <p className="text-gray-600">
          Manual completo com explicações de todos os status dos processos de
          abertura de MEI. Use este guia para entender o que cada status
          significa e que ações devem ser tomadas.
        </p>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por status, título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              {getCategoryIcon(category.id)}
              {category.name}
              <Badge variant="secondary" className="ml-1">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Cards dos Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredStatuses.map(([statusKey, status]) => (
          <Card key={statusKey} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{status.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{status.title}</CardTitle>
                    <Badge className={`mt-1 ${getColorClasses(status.color)}`}>
                      {statusKey}
                    </Badge>
                  </div>
                </div>
                {getCategoryIcon(status.category)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">
                  📋 Descrição Técnica:
                </h4>
                <p className="text-sm text-gray-600">{status.description}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">
                  💬 Mensagem para o Cliente:
                </h4>
                <p className="text-sm text-blue-600 italic">
                  "{status.userMessage}"
                </p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">
                  🎯 Ação Necessária:
                </h4>
                <p className="text-sm text-orange-600 font-medium">
                  {status.action}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Seção de Métodos de Pagamento */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Métodos de Pagamento Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
              <div key={key} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{method.icon}</span>
                  <h4 className="font-medium">{method.name}</h4>
                </div>
                <p className="text-sm text-gray-600">{method.description}</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {key.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dicas para Operadores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Dicas para Operadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-green-700">
                ✅ Boas Práticas:
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Sempre verifique o status antes de agir no processo</li>
                <li>• Mantenha o cliente informado sobre mudanças de status</li>
                <li>• Use as mensagens padrão como base para comunicação</li>
                <li>• Documente ações importantes na timeline</li>
                <li>• Monitore processos em PAYMENT_PENDING regularmente</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-red-700">
                ⚠️ Atenção Especial:
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  • <strong>PAYMENT_PENDING:</strong> Acompanhar diariamente
                </li>
                <li>
                  • <strong>AWAITING_DOCUMENTS:</strong> Listar documentos
                  específicos
                </li>
                <li>
                  • <strong>ERROR:</strong> Investigar e resolver rapidamente
                </li>
                <li>
                  • <strong>UNDER_REVIEW:</strong> Não deixar parado por mais de
                  2 dias
                </li>
                <li>
                  • <strong>AWAITING_SIGNATURE:</strong> Enviar lembretes se
                  necessário
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas rápidas */}
      {filteredStatuses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum status encontrado para "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default StatusGuide;
