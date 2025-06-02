/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import {
  Send,
  User,
  Phone,
  MoreVertical,
  Paperclip,
  Search,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  History,
  MessageSquare,
  Bot,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProcessStatus } from "@prisma/client";
import { toast } from "sonner";

const socket = io("http://localhost:3002");

interface Mensagem {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isOperator?: boolean;
  operatorName?: string;
  botMessage?: boolean;
  pushName?: string;
  status: "enviada" | "entregue" | "lida" | "recebida";
  type: "text" | "image" | "document" | "audio";
  fileUrl?: string;
  fileName?: string;
  isSystemMessage?: boolean;
}

interface Conversa {
  phoneNumber: string;
  nome: string;
  ultimaMensagem: string;
  timestamp: Date;
  mensagens: Mensagem[];
  unreadCount: number;
  status: "online" | "offline" | "typing";
  lastSeen?: Date;
  isAssigned: boolean;
  processId?: string;
  clientInfo?: {
    nome: string;
    cpf?: string;
    email?: string;
    processoAtivo?: string;
  };
}

interface Cliente {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  processes: {
    id: string;
    status: ProcessStatus;
    type: string;
    priority: string;
    progress: number;
    pendingTypeData: string[];
    lastInteractionAt: Date;
    documents?: {
      type: string;
      status: "PENDING" | "SENT" | "VERIFIED" | "REJECTED";
    }[];
  }[];
}

export default function Chat() {
  const [conversas, setConversas] = useState<{ [key: string]: Conversa }>({});
  const [contatoAtivo, setContatoAtivo] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [processoVinculado, setProcessoVinculado] = useState<string | null>(
    null
  );
  const { operator } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showProcessoModal, setShowProcessoModal] = useState(false);

  const resgatarMeusClientes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/v1/bot/clients?id=${operator?.id}`
      );
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resgatarMeusClientes();
  }, []);

  useEffect(() => {
    socket.on("novaMensagem", (data) => {
      // Verifica se é um cliente cadastrado
      const isClienteRegistrado = clientes.some(
        (cliente) => cliente.phone === data.sender.split("@")[0]
      );

      // Se não for cliente registrado, ignora a mensagem
      if (!isClienteRegistrado) return;

      setConversas((prev) => {
        const phoneNumber = data.sender.split("@")[0];
        const cliente = clientes.find((c) => c.phone === phoneNumber);

        // Se não encontrar o cliente, não atualiza as conversas
        if (!cliente) return prev;

        const conversaExistente = prev[phoneNumber] || {
          phoneNumber,
          nome: cliente.name,
          ultimaMensagem: data.text,
          timestamp: new Date(),
          mensagens: [],
          unreadCount: 0,
          status: "online",
          isAssigned: true,
          clientInfo: {
            nome: cliente.name,
            cpf: cliente.cpf,
            email: cliente.email,
            processoAtivo: cliente.processes?.[0]?.id,
          },
        };

        const newUnreadCount =
          contatoAtivo !== phoneNumber ? conversaExistente.unreadCount + 1 : 0;

        return {
          ...prev,
          [phoneNumber]: {
            ...conversaExistente,
            ultimaMensagem: data.text,
            timestamp: new Date(),
            unreadCount: newUnreadCount,
            mensagens: [
              ...conversaExistente.mensagens,
              {
                id: Date.now().toString(),
                sender: data.sender,
                text: data.text,
                timestamp: new Date(),
                isOperator: false,
                status: "recebida",
                type: data.type || "text",
                fileUrl: data.fileUrl,
                fileName: data.fileName,
              },
            ],
          },
        };
      });
    });

    socket.on("statusDigitacao", ({ phoneNumber, status }) => {
      // Verifica se é um cliente cadastrado antes de atualizar o status
      const isClienteRegistrado = clientes.some(
        (cliente) => cliente.phone === phoneNumber
      );

      if (!isClienteRegistrado) return;

      setConversas((prev) => ({
        ...prev,
        [phoneNumber]: {
          ...prev[phoneNumber],
          status: status === "typing" ? "typing" : "online",
        },
      }));
    });

    return () => {
      socket.off("novaMensagem");
      socket.off("statusDigitacao");
    };
  }, [contatoAtivo, clientes]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [contatoAtivo, conversas]);

  const enviarMensagem = () => {
    if (!mensagem.trim() || !contatoAtivo) return;

    const novaMensagem = {
      id: Date.now().toString(),
      sender: "Operador",
      senderName: "Operador",
      text: mensagem,
      timestamp: new Date(),
      isOperator: true,
      status: "enviada",
      type: "text",
    };

    socket.emit("enviarMensagem", {
      destinatario: contatoAtivo,
      mensagem: novaMensagem,
    });

    setConversas((prev: { [key: string]: Conversa }) => ({
      ...prev,
      [contatoAtivo]: {
        ...prev[contatoAtivo],
        ultimaMensagem: mensagem,
        timestamp: new Date(),
        mensagens: [...prev[contatoAtivo].mensagens, novaMensagem],
      },
    }));

    setMensagem("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const conversasFiltradas = Object.values(conversas)
    .filter((conversa) => {
      const nomeMatch =
        conversa.nome?.toLowerCase().includes(pesquisa.toLowerCase()) || false;
      const phoneMatch = conversa.phoneNumber?.includes(pesquisa) || false;
      return nomeMatch || phoneMatch;
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const vincularProcesso = async (phoneNumber: string, processId: string) => {
    try {
      // Aqui você faria a chamada API para vincular o processo
      setConversas((prev) => ({
        ...prev,
        [phoneNumber]: {
          ...prev[phoneNumber],
          processId,
        },
      }));
    } catch (error) {
      console.error("Erro ao vincular processo:", error);
    }
  };

  const enviarArquivo = async (file: File) => {
    if (!contatoAtivo) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Aqui você faria o upload do arquivo e enviaria via socket
      socket.emit("enviarArquivo", {
        destinatario: contatoAtivo,
        arquivo: formData,
        tipo: file.type.startsWith("image/") ? "image" : "document",
      });

      // Atualizar estado local
      setConversas((prev) => ({
        ...prev,
        [contatoAtivo]: {
          ...prev[contatoAtivo],
          mensagens: [
            ...prev[contatoAtivo].mensagens,
            {
              id: Date.now().toString(),
              sender: "Operador",
              text: file.name,
              timestamp: new Date(),
              isOperator: true,
              status: "enviada",
              type: file.type.startsWith("image/") ? "image" : "document",
              fileName: file.name,
            },
          ],
        },
      }));
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
    }
  };

  const selecionarConversa = (phoneNumber: string) => {
    setContatoAtivo(phoneNumber);

    // Verifica se já existe uma conversa, se não, cria uma nova
    setConversas((prev) => {
      if (!prev[phoneNumber]) {
        // Procura o cliente correspondente
        const cliente = clientes.find((c) => c.phone === phoneNumber);

        // Só cria conversa se for um cliente registrado
        if (!cliente) return prev;

        // Cria uma nova conversa
        return {
          ...prev,
          [phoneNumber]: {
            phoneNumber,
            nome: cliente.name,
            ultimaMensagem: "Novo Cliente",
            timestamp: new Date(),
            mensagens: [],
            unreadCount: 0,
            status: "offline",
            isAssigned: true,
            clientInfo: {
              nome: cliente.name,
              cpf: cliente.cpf,
              email: cliente.email,
              processoAtivo: cliente.processes?.[0]?.id,
            },
          },
        };
      }

      // Se a conversa já existe, apenas zera o contador de mensagens não lidas
      return {
        ...prev,
        [phoneNumber]: {
          ...prev[phoneNumber],
          unreadCount: 0,
        },
      };
    });
  };

  // Modificar a lista de conversas para incluir apenas clientes registrados
  const conversasEContatos = [
    ...conversasFiltradas,
    ...clientes
      .filter(
        (cliente) =>
          // Filtra apenas clientes válidos que não têm uma conversa ativa
          cliente.phone && // Verifica se phone existe
          cliente.name && // Verifica se tem nome (é um cliente registrado)
          !conversasFiltradas.some((conv) => conv.phoneNumber === cliente.phone)
      )
      .map((cliente) => ({
        phoneNumber: cliente.phone,
        nome: cliente.name,
        ultimaMensagem: "Novo Cliente",
        timestamp: new Date(),
        mensagens: [],
        unreadCount: 0,
        status: "offline" as const,
        isAssigned: true,
        clientInfo: {
          nome: cliente.name,
          cpf: cliente.cpf,
          email: cliente.email,
          processoAtivo: cliente.processes?.[0]?.id,
        },
      })),
  ].filter((conversa) => {
    if (!conversa) return false;

    // Verifica se é um contato válido
    const isValidContact = Boolean(
      conversa.phoneNumber && // Tem número de telefone
        conversa.nome && // Tem nome
        conversa.nome !== "Cliente sem nome" // Não é um contato não registrado
    );

    // Aplica o filtro de pesquisa
    const matchesSearch =
      conversa.nome?.toLowerCase().includes(pesquisa.toLowerCase()) ||
      conversa.phoneNumber?.includes(pesquisa);

    return isValidContact && matchesSearch;
  });

  useEffect(() => {
    if (clientes.length > 0) {
      // Atualiza as conversas com os novos dados dos clientes
      setConversas((prev) => {
        const newConversas = { ...prev };
        clientes.forEach((cliente) => {
          if (newConversas[cliente.phone]) {
            // Atualiza informações do cliente na conversa existente
            newConversas[cliente.phone].clientInfo = {
              nome: cliente.name,
              cpf: cliente.cpf,
              email: cliente.email,
              processoAtivo: cliente.processes?.[0]?.id,
            };
          }
        });
        return newConversas;
      });
    }
  }, [clientes]);

  const carregarHistorico = useCallback(async (phoneNumber: string) => {
    socket.emit("buscarHistorico", { phoneNumber });
  }, []);

  useEffect(() => {
    socket.on("historicoMensagens", (historico) => {
      if (!contatoAtivo) return;

      setConversas((prev) => ({
        ...prev,
        [contatoAtivo]: {
          ...prev[contatoAtivo],
          mensagens: historico.map((msg) => ({
            id: msg.id,
            sender: msg.sender,
            text: msg.text,
            timestamp: new Date(msg.timestamp),
            isOperator: msg.sender === "OPERATOR",
            status: "lida",
            type: "text",
            botMessage: msg.botMessage,
          })),
        },
      }));
    });

    return () => {
      socket.off("historicoMensagens");
    };
  }, [contatoAtivo]);

  const transferirParaMim = async (phoneNumber: string) => {
    try {
      if (!operator) return;

      await toast.promise(
        () =>
          new Promise((resolve) => {
            socket.emit("transferirParaOperador", {
              phoneNumber,
              operador: {
                id: operator.id,
                name: operator.name,
              },
            });
            resolve(null);
          }),
        {
          loading: "Transferindo atendimento...",
          success: "Atendimento transferido com sucesso",
          error: "Erro ao transferir atendimento",
        }
      );

      // Carregar histórico após transferência
      await carregarHistorico(phoneNumber);
    } catch (error) {
      console.error("Erro ao transferir:", error);
    }
  };

  const finalizarAtendimento = async (phoneNumber: string) => {
    try {
      if (!operator) return;

      await toast.promise(
        () =>
          new Promise((resolve) => {
            socket.emit("reativarBot", {
              phoneNumber,
              operador: {
                id: operator.operator.id,
                name: operator.operator.name,
              },
            });
            resolve(null);
          }),
        {
          loading: "Finalizando atendimento...",
          success: "Atendimento finalizado com sucesso",
          error: "Erro ao finalizar atendimento",
        }
      );

      setContatoAtivo(null);
    } catch (error) {
      console.error("Erro ao finalizar:", error);
    }
  };

  const navegarParaProcesso = (processoId: string) => {
    window.open(`/operador/process/${processoId}`, "_blank");
    // Implementar navegação
  };

  const criarNovoProcesso = async () => {
    // Implementar criação de processo
  };

  const getProcessStatusInfo = (status: ProcessStatus) => {
    const statusMap = {
      CREATED: { label: "Criado", color: "bg-gray-100 text-gray-800" },
      PENDING_DATA: {
        label: "Pendente de Dados",
        color: "bg-yellow-100 text-yellow-800",
      },
      PENDING_DOCS: {
        label: "Pendente de Documentos",
        color: "bg-orange-100 text-orange-800",
      },
      ANALYZING_DATA: {
        label: "Em Análise",
        color: "bg-blue-100 text-blue-800",
      },
      APPROVED: { label: "Aprovado", color: "bg-green-100 text-green-800" },
      REJECTED: { label: "Rejeitado", color: "bg-red-100 text-red-800" },
    };
    return (
      statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
    );
  };

  // Modificar o componente de mensagem para mostrar mensagens do bot
  const MessageBubble = ({ message }: { message: Mensagem }) => {
    if (message.isSystemMessage) {
      return (
        <div className="flex justify-center my-2">
          <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%] text-center">
            <p className="text-sm text-gray-600">{message.text}</p>
            <span className="text-[11px] text-gray-500 mt-1">
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex ${
          message.isOperator || message.sender === "OPERATOR"
            ? "justify-end"
            : "justify-start"
        }`}
      >
        <div
          className={`max-w-[65%] rounded-lg px-3 py-2 ${
            message.botMessage
              ? "bg-purple-100"
              : message.isOperator || message.sender === "OPERATOR"
              ? "bg-[#d9fdd3]"
              : "bg-white"
          } shadow-sm`}
        >
          {message.botMessage && (
            <div className="flex items-center gap-1 mb-1 text-xs text-purple-600">
              <Bot className="h-3 w-3" />
              Assistente Virtual
            </div>
          )}
          <p className="text-sm text-gray-800">{message.text}</p>
          <span className="text-[11px] text-gray-500 float-right mt-1">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Esquerda (Conversas) */}
      <div className="w-[350px] bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Conversas e Contatos
          </h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar conversa ou contato"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Lista de Conversas e Contatos */}
        <div
          className="overflow-y-auto"
          style={{ height: "calc(100vh - 100px)" }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            conversasEContatos.map(
              (conversa) =>
                conversa && ( // Verifica se conversa existe
                  <div
                    key={conversa.phoneNumber}
                    onClick={() =>
                      conversa.phoneNumber &&
                      selecionarConversa(conversa.phoneNumber)
                    }
                    className={`hover:bg-gray-50 cursor-pointer p-3 border-b ${
                      contatoAtivo === conversa.phoneNumber ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 truncate">
                            {conversa.nome || "Cliente sem nome"}
                          </span>
                          {conversa.mensagens?.length === 0 ? (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              Novo Contato
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">
                              {formatTime(conversa.timestamp)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <p className="truncate">
                            {!conversa.mensagens?.length
                              ? `Processo: ${
                                  conversa.clientInfo?.processoAtivo ||
                                  "Sem processo"
                                }`
                              : conversa.ultimaMensagem}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
            )
          )}
        </div>
      </div>

      {/* Chat Principal */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {contatoAtivo && conversas[contatoAtivo] ? (
          <>
            {/* Header do Chat */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-b">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {conversas[contatoAtivo].nome}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{contatoAtivo}</span>
                    {conversas[contatoAtivo].clientInfo?.cpf && (
                      <span>
                        • CPF: {conversas[contatoAtivo].clientInfo.cpf}
                      </span>
                    )}
                    <span
                      className={`w-2 h-2 rounded-full ${
                        conversas[contatoAtivo].status === "online"
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <span
                      className={`w-2 h-2 rounded-full ${
                        conversas[contatoAtivo].status === "online"
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <span
                      className={`w-2 h-2 rounded-full ${
                        conversas[contatoAtivo].status === "online"
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <span>
                      {conversas[contatoAtivo].status === "online"
                        ? "Online"
                        : "Offline"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {processoVinculado ? (
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    Processo: {processoVinculado}
                  </span>
                ) : (
                  <button
                    className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                    onClick={() => {
                      /* Abrir modal para vincular processo */
                    }}
                  >
                    Vincular Processo
                  </button>
                )}
                <button className="text-gray-500 hover:text-gray-600">
                  <Search className="h-5 w-5" />
                </button>
                <button className="text-gray-500 hover:text-gray-600">
                  <Phone className="h-5 w-5" />
                </button>
                <button
                  onClick={() => transferirParaMim(contatoAtivo)}
                  className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                >
                  Transferir para Mim
                </button>
                <button className="text-gray-500 hover:text-gray-600">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Área de Mensagens */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{ backgroundColor: "#f0f2f5" }}
            >
              {contatoAtivo &&
                conversas[contatoAtivo]?.mensagens?.map((msg, index) => (
                  <MessageBubble key={`${msg.id || index}`} message={msg} />
                ))}
            </div>

            {/* Área de Input */}
            <div className="bg-white px-4 py-3 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && enviarArquivo(e.target.files[0])
                  }
                />
                <button
                  onClick={() => document.getElementById("fileInput")?.click()}
                  className="text-gray-500 hover:text-gray-600"
                >
                  <Paperclip className="h-6 w-6" />
                </button>
                <textarea
                  placeholder="Digite uma mensagem"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg resize-none h-[45px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={1}
                />
                <button
                  onClick={enviarMensagem}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                >
                  <Send className="h-6 w-6" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700">
                Bem-vindo ao Chat
              </h3>
              <p className="text-gray-500">
                Selecione uma conversa para começar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Nova Sidebar Direita (Informações do Cliente) */}
      {contatoAtivo && conversas[contatoAtivo] && (
        <div className="w-[300px] bg-white border-l overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Informações do Cliente
            </h3>

            {/* Dados Pessoais */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Dados Pessoais
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Nome:</span>
                  <p className="text-sm text-gray-800">
                    {conversas[contatoAtivo].clientInfo?.nome ||
                      "Não informado"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">CPF:</span>
                  <p className="text-sm text-gray-800">
                    {conversas[contatoAtivo].clientInfo?.cpf || "Não informado"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <p className="text-sm text-gray-800">
                    {conversas[contatoAtivo].clientInfo?.email ||
                      "Não informado"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Telefone:</span>
                  <p className="text-sm text-gray-800">{contatoAtivo}</p>
                </div>
              </div>
            </div>

            {/* Processo Atual */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-600">
                  Processo Atual
                </h4>
                {conversas[contatoAtivo].clientInfo?.processoAtivo && (
                  <button
                    onClick={() =>
                      navegarParaProcesso(
                        conversas[contatoAtivo].clientInfo?.processoAtivo!
                      )
                    }
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Ver Detalhes →
                  </button>
                )}
              </div>

              {conversas[contatoAtivo].clientInfo?.processoAtivo ? (
                <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                  {/* Informações Básicas */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Tipo:</span>
                      <Badge variant="outline">
                        {clientes.find((c) => c.phone === contatoAtivo)
                          ?.processes[0]?.type || "Não definido"}
                      </Badge>
                    </div>

                    <div>
                      <span className="text-sm text-gray-500">Status:</span>
                      <span
                        className={`ml-2 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          getProcessStatusInfo(
                            clientes.find((c) => c.phone === contatoAtivo)
                              ?.processes[0]?.status
                          ).color
                        }`}
                      >
                        {
                          getProcessStatusInfo(
                            clientes.find((c) => c.phone === contatoAtivo)
                              ?.processes[0]?.status
                          ).label
                        }
                      </span>
                    </div>

                    {/* Progresso */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progresso</span>
                        <span
                          className={`${
                            clientes.find((c) => c.phone === contatoAtivo)
                              ?.processes[0]?.progress === 100
                              ? "text-green-500"
                              : "text-yellow-500"
                          }`}
                        >
                          {clientes.find((c) => c.phone === contatoAtivo)
                            ?.processes[0]?.progress || 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          clientes.find((c) => c.phone === contatoAtivo)
                            ?.processes[0]?.progress || 0
                        }
                      />
                    </div>
                  </div>

                  {/* Pendências */}
                  {clientes.find((c) => c.phone === contatoAtivo)?.processes[0]
                    ?.pendingTypeData.length > 0 && (
                    <div className="border-t pt-2">
                      <h5 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1 text-yellow-500" />
                        Pendências
                      </h5>
                      <ul className="space-y-1">
                        {clientes
                          .find((c) => c.phone === contatoAtivo)
                          ?.processes[0]?.pendingTypeData.map((item, index) => (
                            <li
                              key={index}
                              className="text-xs text-gray-600 flex items-center"
                            >
                              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2" />
                              {item}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {/* Documentos */}
                  {clientes.find((c) => c.phone === contatoAtivo)?.processes[0]
                    ?.documents && (
                    <div className="border-t pt-2">
                      <h5 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        Documentos
                      </h5>
                      <div className="space-y-1">
                        {clientes
                          .find((c) => c.phone === contatoAtivo)
                          ?.processes[0].documents.map((doc, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-xs"
                            >
                              <span>{doc.type}</span>
                              {doc.status === "VERIFIED" && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                              {doc.status === "REJECTED" && (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              {doc.status === "PENDING" && (
                                <Clock className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Última Interação */}
                  <div className="border-t pt-2 flex items-center text-xs text-gray-500">
                    <History className="h-4 w-4 mr-1" />
                    Última atualização:{" "}
                    {formatTime(
                      clientes.find((c) => c.phone === contatoAtivo)
                        ?.processes[0]?.lastInteractionAt
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-2">
                    Nenhum processo ativo
                  </p>
                  <button
                    onClick={() => setShowProcessoModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Iniciar Novo Processo
                  </button>
                </div>
              )}
            </div>

            {/* Histórico de Atendimento */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Histórico de Atendimento
              </h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Último contato:</span>
                  <p className="text-gray-800">
                    {formatTime(conversas[contatoAtivo].timestamp)}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Total de mensagens:</span>
                  <p className="text-gray-800">
                    {conversas[contatoAtivo].mensagens.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Ações Rápidas
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    /* Transferir atendimento */
                  }}
                  className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  Transferir Atendimento
                </button>
                <button
                  onClick={() => {
                    /* Finalizar atendimento */
                  }}
                  className="w-full px-3 py-2 text-sm text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
                >
                  Finalizar Atendimento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showProcessoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h3 className="text-lg font-semibold mb-4">Criar Novo Processo</h3>
            {/* Adicionar formulário de criação de processo */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowProcessoModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={criarNovoProcesso}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Criar Processo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
