"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  BarChart2,
  Bot,
  Clock,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Smartphone,
  Users,
} from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface BotData {
  qrcode: string | null;
  hasConnected: boolean;
  status: string;
  lastConnection: string | null;
  phoneNumber: string | null;
  batteryLevel: number | null;
  isOnline: boolean;
  errorMessage: string | null;
  messageCount: number;
  activeChats: number;
  responseRate: number;
  averageResponseTime: number;
}

export default function BotPage() {
  const [bot, setBot] = useState<BotData | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchBot = async () => {
      try {
        const response = await fetch("/api/v1/bot");
        const data = await response.json();
        setBot(data);

        if (data?.qrcode) {
          try {
            const qrImage = await QRCode.toDataURL(data.qrcode);
            setQrCodeImage(qrImage);
          } catch (error) {
            console.error("Erro ao gerar QR code:", error);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados do bot:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBot();

    // Atualiza mais frequentemente quando está aguardando conexão
    const interval = setInterval(
      fetchBot,
      bot?.status === "AGUARDANDO_CONEXAO" ? 2000 : 5000
    );

    return () => clearInterval(interval);
  }, [bot?.status]);

  const handleCreateBot = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/bot", {
        method: "POST",
      });
      if (response.ok) {
        // Atualiza os dados após criar o bot
        const data = await response.json();
        setBot(data);
      }
    } catch (error) {
      console.error("Erro ao criar bot:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Bot className="w-6 h-6 text-green-600" />
            Gerenciamento do Bot WhatsApp
          </h1>

          <div className="flex flex-col items-center justify-center p-12">
            <RefreshCw className="w-10 h-10 animate-spin text-green-600" />
            <p className="mt-4 text-gray-600 font-medium">
              Carregando configurações do bot...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Bot className="w-6 h-6 text-green-600" />
            Gerenciamento do Bot WhatsApp
          </h1>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="space-y-6 pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-gray-800">
                    Configuração do Bot WhatsApp
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Configure seu primeiro bot para automatizar o atendimento
                  </CardDescription>
                </div>
                <Image
                  src="/figuras/bot.svg"
                  alt="Bot WhatsApp"
                  width={120}
                  height={120}
                  className="animate-float"
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-blue-800">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    Importante
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Após criar o bot, nossa equipe técnica entrará em contato
                    para auxiliar na configuração e ativação do seu WhatsApp
                    Business.
                  </p>
                  <ul className="space-y-2 text-blue-700">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Suporte personalizado para configuração
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Orientação sobre melhores práticas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Ativação segura do WhatsApp Business
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-800">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    Como funciona?
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        icon: "🔄",
                        text: "Ao criar o bot, você receberá um QR Code",
                      },
                      {
                        icon: "📱",
                        text: "Escaneie o QR Code com seu WhatsApp",
                      },
                      {
                        icon: "✅",
                        text: "O bot estará pronto para uso após a conexão",
                      },
                      {
                        icon: "💬",
                        text: "Gerencie todas as conversas através desta interface",
                      },
                    ].map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-gray-600"
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  onClick={handleCreateBot}
                  disabled={isCreating}
                  className="w-full h-12 text-base bg-green-600 hover:bg-green-700 transition-colors"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Criando bot...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Criar Bot WhatsApp
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (bot?.status === "NOT_CREATED") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Bot className="w-6 h-6 text-green-600" />
            Gerenciamento do Bot WhatsApp
          </h1>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="space-y-6 pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-gray-800">
                    Bot em Configuração
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Aguardando ativação pela equipe STEP.MEI
                  </CardDescription>
                </div>
                <Image
                  src="/figuras/bot.svg"
                  alt="Bot WhatsApp"
                  width={120}
                  height={120}
                  className="animate-float"
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-blue-800">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    Próximos Passos
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">
                          Contato da Equipe
                        </p>
                        <p className="text-blue-600">
                          Nossa equipe entrará em contato para configurar seu
                          WhatsApp Business
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">
                          Configuração Segura
                        </p>
                        <p className="text-blue-600">
                          Auxílio na configuração do WhatsApp Business de forma
                          segura
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">
                          Ativação do Bot
                        </p>
                        <p className="text-blue-600">
                          Configuração das respostas automáticas e fluxos de
                          atendimento
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-800">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    Preparação Necessária
                  </h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      Tenha o WhatsApp Business instalado
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      Conexão estável com a internet
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      Número exclusivo para o bot
                    </li>
                  </ul>
                </div>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium mb-1">
                          Precisa de ajuda?
                        </h3>
                        <p className="text-green-50">
                          Entre em contato com nosso suporte
                        </p>
                      </div>
                      <Button variant="secondary" size="sm">
                        Falar com Suporte
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (bot.status === "AGUARDANDO_CONEXAO") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Bot className="w-6 h-6 text-green-600" />
            Gerenciamento do Bot WhatsApp
          </h1>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="space-y-6 pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-gray-800">
                    Conecte seu WhatsApp
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Escaneie o QR Code para começar a usar o bot
                  </CardDescription>
                </div>
                <Image
                  src="/figuras/bot.svg"
                  alt="Bot WhatsApp"
                  width={120}
                  height={120}
                  className="animate-float"
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {bot.qrcode ? (
                <div className="space-y-6">
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <h3 className="font-medium text-yellow-800 mb-2">
                      Como conectar:
                    </h3>
                    <ol className="space-y-2 text-yellow-700 ml-4 list-decimal">
                      <li>Abra o WhatsApp no seu celular</li>
                      <li>Acesse Configurações/Aparelhos Conectados</li>
                      <li>Toque em &ldquo;Conectar um aparelho&rdquo;</li>
                      <li>Aponte a câmera para o QR Code abaixo</li>
                    </ol>
                  </div>
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-xl shadow-md">
                      <Image
                        src={qrCodeImage}
                        alt="QR Code do WhatsApp"
                        width={280}
                        height={280}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8">
                  <RefreshCw className="w-10 h-10 animate-spin text-green-600" />
                  <p className="mt-4 text-gray-600">Gerando QR Code...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Bot className="w-6 h-6 text-green-600" />
              Gerenciamento do Bot WhatsApp
            </h1>
            <p className="text-gray-600 mt-1">
              Monitore e gerencie seu assistente virtual
            </p>
          </div>

          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar Status
          </Button>
        </div>

        {!bot?.hasConnected ? (
          // Tela de conexão inicial
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="space-y-6 pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-gray-800">
                      Conecte seu WhatsApp
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      Escaneie o QR Code para começar a usar o bot
                    </CardDescription>
                  </div>
                  <Image
                    src="/figuras/bot.svg"
                    alt="Bot WhatsApp"
                    width={120}
                    height={120}
                    className="animate-float"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {qrCodeImage && (
                  <div className="space-y-6">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                      <h3 className="font-medium text-yellow-800 mb-2">
                        Como conectar:
                      </h3>
                      <ol className="space-y-2 text-yellow-700 ml-4 list-decimal">
                        <li>Abra o WhatsApp no seu celular</li>
                        <li>Acesse Configurações/Aparelhos Conectados</li>
                        <li>Toque em &ldquo;Conectar um aparelho&rdquo;</li>
                        <li>Aponte a câmera para o QR Code abaixo</li>
                      </ol>
                    </div>
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-xl shadow-md">
                        <Image
                          src={qrCodeImage}
                          alt="QR Code do WhatsApp"
                          width={280}
                          height={280}
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">
                    Recursos Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      icon: MessageSquare,
                      title: "Respostas Automáticas",
                      desc: "Atendimento 24/7 com respostas instantâneas",
                    },
                    {
                      icon: Users,
                      title: "Multiusuários",
                      desc: "Atenda vários clientes simultaneamente",
                    },
                    {
                      icon: BarChart2,
                      title: "Análise de Conversas",
                      desc: "Métricas e insights das interações",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-4 rounded-lg bg-gray-50"
                    >
                      <div className="p-2 rounded-full bg-green-100">
                        <item.icon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-2">
                    Precisa de ajuda?
                  </h3>
                  <p className="text-green-50 mb-4">
                    Nossa equipe está disponível para auxiliar na configuração
                    do seu bot.
                  </p>
                  <Button variant="secondary" className="w-full">
                    Contatar Suporte
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Dashboard do bot conectado
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Status do Dispositivo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-green-600" />
                    <span className="text-gray-600">{bot.phoneNumber}</span>
                  </div>
                  <Badge
                    className={
                      bot.isOnline
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {bot.isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Bateria</span>
                    <span className="font-medium">{bot.batteryLevel}%</span>
                  </div>
                  <Progress value={bot.batteryLevel || 0} className="h-2" />
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span>
                    Última conexão:{" "}
                    {new Date(bot.lastConnection!).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">
                  Métricas de Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Mensagens</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {bot.messageCount}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Chats Ativos</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {bot.activeChats}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Taxa de Resposta</span>
                    <span className="font-medium">{bot.responseRate}%</span>
                  </div>
                  <Progress value={bot.responseRate} className="h-2" />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Tempo Médio de Resposta
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {bot.averageResponseTime}s
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Gerenciar Respostas
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Users className="w-4 h-4" />
                  Grupos Ativos
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <BarChart2 className="w-4 h-4" />
                  Ver Relatórios
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
