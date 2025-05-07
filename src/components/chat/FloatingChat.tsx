/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Bot,
  Clock,
  MessageSquare,
  Send,
  Shield,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  sender: string;
  isOperator: boolean;
  operatorName?: string;
  pushName?: string;
}

interface ActiveChat {
  phoneNumber: string;
  clientName: string;
  clientId: string;
  messages: ChatMessage[];
  unreadCount: number;
  isMinimized: boolean;
  isOpen: boolean;
}

export function FloatingChat() {
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [isOperatorMode, setIsOperatorMode] = useState<Record<string, boolean>>(
    {}
  );
  const { operator } = useAuth();

  useEffect(() => {
    const socketInstance = io("ws://localhost:3001");
    setSocket(socketInstance);

    // Atualizado para usar a nova estrutura de dados
    const carregarClientes = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/v1/operators/${operator?.id}`
        );
        const data = await response.json();

        if (!data.processes || data.processes.length === 0) {
          toast.error("Nenhum cliente encontrado");
          return;
        }

        const chatsIniciais = data.processes.map((process: any) => ({
          phoneNumber: process.client.phone,
          clientName: process.client.name,
          clientId: process.client.id,
          messages: [],
          unreadCount: 0,
          isMinimized: true,
          isOpen: false,
        }));

        setActiveChats(chatsIniciais);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        toast.error("Erro ao carregar conversas");
      }
    };

    if (operator?.id) {
      carregarClientes();
    }

    // Recebe novas mensagens
    socketInstance.on("novaMensagem", (data) => {
      console.log("Mensagem recebida:", data);
      const { sender, text, timestamp, pushName, isOperator, operatorName } =
        data;
      const phoneNumber = sender.split("@")[0];

      setActiveChats((prev) => {
        return prev.map((chat) => {
          if (chat.phoneNumber === phoneNumber) {
            return {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: Date.now().toString(),
                  text,
                  timestamp: new Date(timestamp),
                  sender: isOperator
                    ? operator?.name || "Operador"
                    : phoneNumber,
                  isOperator,
                  operatorName: isOperator ? operatorName : undefined,
                  pushName,
                },
              ],
              unreadCount: chat.isMinimized ? chat.unreadCount + 1 : 0,
            };
          }
          return chat;
        });
      });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [operator?.id]);

  // Função para carregar histórico de mensagens
  const loadChatHistory = async (phoneNumber: string) => {
    try {
      console.log("Carregando histórico para:", phoneNumber);

      const response = await fetch(
        `http://localhost:3000/api/v1/messages/${phoneNumber}`
      );
      const data = await response.json();

      console.log("Resposta do histórico:", data);

      if (!data.success) {
        toast.error("Erro ao carregar histórico");
        return;
      }

      // Converte as mensagens do histórico para o formato do chat
      const historicMessages: ChatMessage[] = data.messages.map((msg: any) => ({
        id: msg.id,
        text: msg.content,
        timestamp: new Date(msg.timestamp),
        sender: msg.fromMe
          ? operator?.name || "Operador"
          : msg.remoteJid.split("@")[0],
        isOperator: msg.fromMe,
        operatorName: msg.fromMe ? msg.operator?.name || "Operador" : undefined,
        pushName: msg.pushName,
      }));

      console.log("Mensagens convertidas:", historicMessages);

      setActiveChats((prev) =>
        prev.map((chat) =>
          chat.phoneNumber === phoneNumber
            ? {
                ...chat,
                messages: historicMessages,
                isOpen: true,
                isMinimized: false,
              }
            : chat
        )
      );
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      toast.error("Erro ao carregar histórico de mensagens");
    }
  };

  // Modifique a função handleOpenChat
  const handleOpenChat = (phoneNumber: string) => {
    loadChatHistory(phoneNumber);
  };

  // Gerencia o início/fim do atendimento
  const handleManageAtendimento = (phoneNumber: string) => {
    const isCurrentlyOperator = isOperatorMode[phoneNumber];

    if (!isCurrentlyOperator) {
      // Inicia atendimento com operador
      socket?.emit("transferirParaOperador", {
        phoneNumber,
        operador: {
          id: operator?.id,
          name: operator?.name,
        },
      });

      toast.success("Atendimento iniciado");
    } else {
      // Retorna para o bot
      socket?.emit("reativarBot", {
        phoneNumber,
        operador: {
          id: operator?.id,
          name: operator?.name,
        },
      });

      toast.success("Atendimento finalizado");
    }

    setIsOperatorMode((prev) => ({
      ...prev,
      [phoneNumber]: !isCurrentlyOperator,
    }));
  };

  // Fecha o chat visualmente
  const handleCloseChat = (phoneNumber: string) => {
    setActiveChats((prev) =>
      prev.map((chat) =>
        chat.phoneNumber === phoneNumber
          ? { ...chat, isOpen: false, messages: [] }
          : chat
      )
    );
  };

  const closedProcesses = activeChats.filter((p) => !p.isOpen);
  const openProcesses = activeChats.filter((p) => p.isOpen);

  // Validação se pode enviar mensagem
  const canSendMessage = (phoneNumber: string) => {
    return isOperatorMode[phoneNumber] === true;
  };

  const handleSendMessage = async (phoneNumber: string) => {
    if (!canSendMessage(phoneNumber)) {
      toast.error("Inicie o atendimento primeiro!");
      return;
    }

    const currentMessage = messages[phoneNumber];
    if (!currentMessage?.trim()) return;

    try {
      // Envia para o socket e aguarda confirmação
      await new Promise((resolve, reject) => {
        socket?.emit(
          "enviarMensagem",
          {
            destinatario: phoneNumber,
            mensagem: {
              text: currentMessage,
              senderName: operator?.name,
              isOperator: true,
            },
          },
          (response: any) => {
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error("Falha ao enviar mensagem"));
            }
          }
        );

        // Timeout de segurança
        setTimeout(() => reject(new Error("Timeout ao enviar mensagem")), 5000);
      });

      // Se chegou aqui, a mensagem foi enviada com sucesso
      const newMessage = {
        id: Date.now().toString(),
        text: currentMessage,
        timestamp: new Date(),
        sender: phoneNumber,
        isOperator: true,
        operatorName: operator?.name,
      };

      // Atualiza o estado local após confirmação
      setActiveChats((prev) =>
        prev.map((chat) =>
          chat.phoneNumber === phoneNumber
            ? {
                ...chat,
                messages: [...chat.messages, newMessage],
              }
            : chat
        )
      );

      // Limpa o input
      setMessages((prev) => ({ ...prev, [phoneNumber]: "" }));
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex items-end gap-4">
      {/* Chats Abertos */}
      {openProcesses.map((process) => (
        <Card
          key={process.clientId}
          className="w-[380px] shadow-2xl border-0 bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden"
        >
          {/* Header redesenhado */}
          <div className="border-b bg-gradient-to-r from-emerald-600 to-emerald-500 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold leading-none mb-1 text-lg">
                      {process.clientName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <span className="font-medium">
                        #{process.clientId.slice(0, 8)}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-white/40" />
                      <span className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                        Online
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões de ação redesenhados */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={
                      isOperatorMode[process.phoneNumber]
                        ? "destructive"
                        : "secondary"
                    }
                    size="sm"
                    className={cn(
                      "h-9 px-4 rounded-full text-xs font-medium transition-all duration-200",
                      isOperatorMode[process.phoneNumber]
                        ? "bg-red-800/90 hover:bg-red-800 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    )}
                    onClick={() => handleManageAtendimento(process.phoneNumber)}
                  >
                    {isOperatorMode[process.phoneNumber] ? (
                      <>Encerrar</>
                    ) : (
                      <>
                        <Bot className="h-3 w-3 mr-1.5" />
                        Atender
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full hover:bg-white/20 text-white"
                    onClick={() => handleCloseChat(process.phoneNumber)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {!process.isMinimized && (
            <>
              {/* Área de mensagens com novo design */}
              <div className="h-[420px] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
                {process.messages.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    Nenhuma mensagem encontrada
                  </div>
                )}

                {process.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3 max-w-[85%] group transition-all",
                      msg.isOperator ? "ml-auto flex-row-reverse" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-sm font-semibold shadow-sm",
                        msg.isOperator
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {msg.isOperator ? "OP" : "CL"}
                    </div>
                    <div
                      className={cn(
                        "flex flex-col gap-1.5 rounded-2xl p-3 shadow-sm",
                        msg.isOperator
                          ? "bg-emerald-500 text-white rounded-br-none"
                          : "bg-gray-100 text-gray-700 rounded-bl-none"
                      )}
                    >
                      <p className="text-sm leading-relaxed break-words">
                        {msg.text}
                      </p>
                      <span
                        className={cn(
                          "text-[10px] opacity-70",
                          msg.isOperator ? "text-white/70" : "text-gray-500"
                        )}
                      >
                        {msg.timestamp.toLocaleString()}
                        {msg.operatorName && ` - ${msg.operatorName}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input redesenhado */}
              <div className="p-4 border-t bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={messages[process.phoneNumber] || ""}
                      onChange={(e) =>
                        setMessages((prev) => ({
                          ...prev,
                          [process.phoneNumber]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(process.phoneNumber);
                        }
                      }}
                      className="pr-12 border-gray-200 focus:border-emerald-500/20 focus:ring-emerald-500/20 rounded-full bg-gray-50/50"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-10 w-10 p-0 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                    onClick={() => handleSendMessage(process.phoneNumber)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Atalhos redesenhados */}
                <div className="flex items-center justify-between mt-3 px-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 hover:text-emerald-600 cursor-pointer transition-colors">
                      <Bot className="h-3 w-3" />
                      /bot
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />5 min
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-500">
                    <Shield className="h-3 w-3" />
                    Seguro
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      ))}

      {/* Botão de Chats Fechados redesenhado */}
      {closedProcesses.length > 0 && (
        <Button
          onClick={() =>
            closedProcesses.forEach((p) => handleOpenChat(p.phoneNumber))
          }
          className="h-12 px-5 rounded-full shadow-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200"
        >
          <MessageSquare className="h-5 w-5 mr-2" />
          Atendimentos
          <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
            {closedProcesses.length}
          </Badge>
        </Button>
      )}
    </div>
  );
}
