/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { AssignToMeButton } from "@/components/layout/assigmeButton";
import { TooltipComponent } from "@/components/layout/infoTootip";
import { AssignOperatorModal } from "@/components/modals/assign-operator-modal";
import { CreateProcessModal } from "@/components/modals/CreateProcessModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  cn,
  formatDate,
  getPriorityColor,
  getProcessStatusColor,
  getSourceColor,
  translatePriority,
  translateProcessStatus,
  translateProcessType,
  translateSource,
} from "@/lib/utils";
import { ProcessStatus } from "@prisma/client";
import {
  ArrowRightLeft,
  Filter,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Plus,
  Search,
  UserCheck,
  UserPlus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
 

interface Address {
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  cep: string;
}

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  activity: string | null;
  occupation: string | null;
  capitalSocial: string | null;
  address: Address | null;
}

interface Client {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
}

interface Document {
  id: string;
  name: string;
  status: string;
}

interface Process {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  priority: string;
  type: string;
  progress: number;
  client: Client;
  company: Company | null;
  documents: Document[];
  operator?: {
    id: string;
    name: string;
  };
  source: string;
}

interface ProcessStats {
  total: number;
  botOrigin: number;
  manualOrigin: number;
  platformOrigin: number;
  byType: {
    [key: string]: number;
  };
  byStatus: {
    [key: string]: number;
  };
}



const ProcessPage: FC = () => {
  const { operator } = useAuth();
  const isAdmin = operator?.role === "ADMIN";
  const operatorId = operator?.id;
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [currentOperator, setCurrentOperator] = useState({ id: "" });
  const [processStats, setProcessStats] = useState<ProcessStats>({
    total: 0,
    botOrigin: 0,
    manualOrigin: 0,
    platformOrigin: 0,
    byType: {},
    byStatus: {},
  });
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");

  useEffect(() => {
    if (typeof operatorId !== "undefined") {
      const fetchProcesses = async () => {
        try {
          const url = isAdmin
            ? "/api/processes"
            : `/api/processes/operator/${operatorId}`;

          const response = await fetch(url);
          const data = await response.json();
          console.log(data)
          setProcesses(data);
        } catch (error) {
          console.error("Erro ao carregar processos:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchProcesses();
    }
  }, [operatorId, isAdmin]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/processes/stats");
        const data = await response.json();
        setProcessStats(data);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    };

    fetchStats();
  }, []);

  const filteredProcesses = processes.filter(
    (process) =>
      process.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProcessClick = (processId: string) => {
    router.push(`/operador/process/${processId}`);
  };

  const handleNewProcess = () => {
    setIsCreateModalOpen(true);
  };

  const AdminActions: FC<{ process: Process }> = ({ process }) => {
    if (!isAdmin) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuLabel>Ações do Administrador</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProcessId(process.id);
              setIsAssignModalOpen(true);
            }}
          >
            {process.operator ? (
              <UserCheck className="mr-2 h-4 w-4" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            {process.operator ? "Transferir Operador" : "Atribuir Operador"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Alterar Prioridade
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const ProcessCard = ({ process }: { process: Process }) => {
    const router = useRouter();

    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => router.push(`/operador/process/${process.id}`)}
      >
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{process.client.name}</h3>
                <p className="text-sm text-gray-500">{process.client.email}</p>
              </div>
              <Badge
                variant="secondary"
                className={`${getProcessStatusColor(process.status)}`}
              >
                {translateProcessStatus(process.status)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">ID</p>
                <p className="font-medium">{process.id.slice(-8)}</p>
              </div>
              <div>
                <p className="text-gray-500">Tipo</p>
                <p className="font-medium">
                  {translateProcessType(process.type)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Empresa</p>
                <p className="font-medium">
                  {process.company?.name || (
                    <span className="text-gray-400 italic">Não definida</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Prioridade</p>
                <Badge
                  variant="outline"
                  className={`${getPriorityColor(process.priority)} mt-1`}
                >
                  {translatePriority(process.priority)}
                </Badge>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Progresso</span>
                <span className="text-sm font-medium">{process.progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${process.progress}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1">
                <span>{`${
                  process.documents.filter((doc) => doc.status === "Enviado")
                    .length
                }/${process.documents.length}`}</span>
                <span className="text-gray-500">documentos</span>
              </div>
              <span className="text-gray-500">
                {formatDate(process.updatedAt)}
              </span>
            </div>

            <div className="pt-4 border-t" onClick={(e) => e.stopPropagation()}>
              {process.operator ? (
                <div className="flex items-center gap-2 text-sm">
                  Responsavel:{" "}
                  <UserCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-gray-600">
                    {" "}
                    {process.operator.name}
                  </span>
                </div>
              ) : (
                <AssignToMeButton
                  processId={process.id}
                  onAssign={() => {
                    window.location.reload();
                  }}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

 

  return (
    <div className="space-y-6  ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          
          <div className="flex items-center gap-2 ">
          <h2 className="text-3xl font-bold tracking-tight">Processos</h2>
          <TooltipComponent text="Essa pagina mostrará os processos em andamentos que estão sem responsvavel 
           ou que estão atribuidos a você!"/>  
          </div>
          <p className="text-muted-foreground">
            Gerencie todos os processos em andamento
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
          onClick={handleNewProcess}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Processo
        </Button>
      </div>

      <div>
        {!loading ? (
          <>
           {/* {isAdmin && <StatsSection />} */}
            {processes.length === 0 ? (
              <div className="flex items-center justify-center">
                <h1>Nenhum processo encontrado</h1>
              </div>
            ) : (
              <>
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            placeholder="Buscar por cliente, ID ou empresa..."
                            className="pl-8 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="hover:bg-gray-50/50"
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                        <div className="border-l pl-2 flex gap-1">
                          <Button
                            variant={viewMode === "table" ? "default" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode("table")}
                            className="hover:bg-gray-50/50"
                          >
                            <LayoutList className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode("grid")}
                            className="hover:bg-gray-50/50"
                          >
                            <LayoutGrid className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                      </div>
                    ) : viewMode === "table" ? (
                      <div className="rounded-md border border-gray-200 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50/50">
                              <TableHead className="w-[100px] font-medium">
                                ID
                              </TableHead>
                              <TableHead className="font-medium">
                                Cliente
                              </TableHead>
                              <TableHead className="font-medium">
                                Empresa
                              </TableHead>
                              <TableHead className="font-medium">
                                Tipo
                              </TableHead>
                              <TableHead className="font-medium">
                                Status
                              </TableHead>
                              <TableHead className="font-medium">
                                Prioridade
                              </TableHead>
                              <TableHead className="font-medium">
                                Progresso
                              </TableHead>
                              <TableHead className="font-medium">
                                Documentos
                              </TableHead>
                              <TableHead className="font-medium">
                                Última Atualização
                              </TableHead>

                              <TableHead className="font-medium">
                                Operador
                              </TableHead>
                              <TableHead className="font-medium">
                                Origem
                              </TableHead>
                              <TableHead className="font-medium">
                                Ações
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredProcesses.map((process) => (
                              <TableRow
                                key={process.id}
                                className="cursor-pointer hover:bg-gray-50/50"
                                onClick={() => handleProcessClick(process.id)}
                              >
                                <TableCell className="font-medium text-sm text-gray-600">
                                  {process.id.slice(-8)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {process.client.name}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {process.client.email}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {process.company?.name || (
                                    <span className="text-gray-400 italic">
                                      Não definida
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-medium">
                                    {translateProcessType(process.type)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      getProcessStatusColor(process.status)
                                    )}
                                  >
                                    {translateProcessStatus(process.status)}
                                  </Badge>
                                </TableCell>

                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      getPriorityColor(process.priority)
                                    )}
                                  >
                                    {translatePriority(process.priority)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-2 bg-emerald-500 rounded-full transition-all"
                                        style={{
                                          width: `${process.progress}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-sm text-gray-600 w-9">
                                      {process.progress}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm">
                                      {`${
                                        process.documents.filter(
                                          (doc) => doc.status === "Enviado"
                                        ).length
                                      }/${process.documents.length}`}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      enviados
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-sm">
                                      {formatDate(process.updatedAt)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(
                                        process.updatedAt
                                      ).toLocaleTimeString("pt-BR")}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  {process.operator ? (
                                    <div className="flex items-center gap-2">
                                      <UserCheck className="h-4 w-4 text-emerald-500" />
                                      <span>{process.operator.name}</span>
                                    </div>
                                  ) : (
                                    <AssignToMeButton
                                      processId={process.id}
                                      onAssign={() => {
                                        // Recarrega os dados após atribuição
                                        window.location.reload();
                                      }}
                                    />
                                  )}
                                </TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Badge
                                    variant="secondary"
                                    className={getSourceColor(process.source)}
                                  >
                                    {translateSource(process.source)}
                                  </Badge>
                                </TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <AdminActions process={process} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProcesses.map((process) => (
                          <ProcessCard key={process.id} process={process} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            <AssignOperatorModal
              isOpen={isAssignModalOpen}
              onClose={() => setIsAssignModalOpen(false)}
              processId={selectedProcessId}
              currentOperatorId={currentOperator.id}
              onAssign={() => {}}
            />

            <CreateProcessModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onSuccess={() => {
                setIsCreateModalOpen(false);
                window.location.reload();
              }}
              operatorId={currentOperator.id}
            />
          </>
        ) : (
          <>
            <div className="flex spinner flex-col h-screen items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProcessPage;
