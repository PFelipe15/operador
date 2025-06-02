"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  BarChart3,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Operator {
  id: string;
  name: string;
  email: string;
  processesCount: number;
  maxProcesses?: number;
  status?: string;
  role?: string;
}

interface Process {
  id: string;
  client: {
    name: string;
    email: string;
  };
  status: string;
  priority: string;
  progress: number;
  operator?: {
    id: string;
    name: string;
  };
}

interface AssignOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  processId?: string;
  processIds?: string[];
  currentOperatorId?: string;
  onAssign: () => void;
  mode?: "single" | "bulk";
}

export function AssignOperatorModal({
  isOpen,
  onClose,
  processId,
  processIds = [],
  currentOperatorId,
  onAssign,
  mode = "single",
}: AssignOperatorModalProps) {
  const { operator: currentUser } = useAuth();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);

  const canManageOperators = hasPermission(currentUser, "MANAGE_OPERATORS");

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        setFetchingData(true);
        const response = await fetch("/api/v1/operators");
        const data = await response.json();
        setOperators(data);
      } catch (error) {
        console.error("Erro ao carregar operadores:", error);
        toast.error("Erro ao carregar operadores");
      } finally {
        setFetchingData(false);
      }
    };

    const fetchProcesses = async () => {
      if (mode === "bulk" && processIds.length > 0) {
        try {
          setFetchingData(true);
          const response = await fetch("/api/v1/processes/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ processIds }),
          });
          const data = await response.json();
          setProcesses(data);
          setSelectedProcesses(processIds);
        } catch (error) {
          console.error("Erro ao carregar processos:", error);
          toast.error("Erro ao carregar processos");
        } finally {
          setFetchingData(false);
        }
      }
    };

    if (isOpen) {
      fetchOperators();
      if (mode === "bulk") {
        fetchProcesses();
      }
    }
  }, [isOpen, mode, processIds]);

  const handleSingleAssign = async () => {
    if (!selectedOperator || !processId) {
      toast.error("Selecione um operador");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/processes/${processId}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ operatorId: selectedOperator }),
      });

      if (!response.ok) throw new Error("Erro ao atribuir operador");

      toast.success("Operador atribuído com sucesso");
      onAssign();
      onClose();
    } catch (error) {
      console.error("Erro ao atribuir operador:", error);
      toast.error("Erro ao atribuir operador");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedOperator || selectedProcesses.length === 0) {
      toast.error("Selecione um operador e pelo menos um processo");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/v1/processes/bulk-assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operatorId: selectedOperator,
          processIds: selectedProcesses,
        }),
      });

      if (!response.ok) throw new Error("Erro ao atribuir processos");

      const result = await response.json();
      toast.success(`${result.assigned} processos atribuídos com sucesso`);
      onAssign();
      onClose();
    } catch (error) {
      console.error("Erro ao atribuir processos:", error);
      toast.error("Erro ao atribuir processos");
    } finally {
      setLoading(false);
    }
  };

  const getOperatorWorkload = (op: Operator) => {
    const maxProcesses = op.maxProcesses || 10;
    const percentage = Math.round((op.processesCount / maxProcesses) * 100);
    return { percentage, maxProcesses };
  };

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  const toggleProcessSelection = (processId: string) => {
    setSelectedProcesses((prev) =>
      prev.includes(processId)
        ? prev.filter((id) => id !== processId)
        : [...prev, processId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={mode === "bulk" ? "max-w-6xl" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "bulk" ? (
              <>
                <Users className="h-5 w-5" />
                Distribuição em Massa de Processos
              </>
            ) : (
              <>
                <UserCheck className="h-5 w-5" />
                {currentOperatorId
                  ? "Transferir Processo"
                  : "Atribuir Operador"}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {mode === "single" ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Selecione o Operador
              </label>
              <Select
                value={selectedOperator}
                onValueChange={setSelectedOperator}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um operador" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => {
                    const { percentage } = getOperatorWorkload(op);
                    return (
                      <SelectItem key={op.id} value={op.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{op.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              ({op.processesCount} processos)
                            </span>
                            <span
                              className={`text-xs font-medium ${getWorkloadColor(
                                percentage
                              )}`}
                            >
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSingleAssign}
              disabled={loading || !selectedOperator}
              className="w-full"
            >
              {loading ? "Processando..." : "Confirmar"}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="selection" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="selection">Seleção de Processos</TabsTrigger>
              <TabsTrigger value="operators">Operadores</TabsTrigger>
              <TabsTrigger value="distribution">Distribuição</TabsTrigger>
            </TabsList>

            <TabsContent value="selection" className="space-y-4">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedProcesses.length === processes.length
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProcesses(processes.map((p) => p.id));
                            } else {
                              setSelectedProcesses([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Operador Atual</TableHead>
                      <TableHead>Progresso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processes.map((process) => (
                      <TableRow key={process.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProcesses.includes(process.id)}
                            onCheckedChange={() =>
                              toggleProcessSelection(process.id)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {process.client.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {process.client.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{process.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {process.operator ? (
                            <span className="text-sm">
                              {process.operator.name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Não atribuído
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${process.progress}%` }}
                              />
                            </div>
                            <span className="text-sm">{process.progress}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="text-sm text-gray-600">
                {selectedProcesses.length} de {processes.length} processos
                selecionados
              </div>
            </TabsContent>

            <TabsContent value="operators" className="space-y-4">
              <div className="grid gap-4">
                {operators.map((op) => {
                  const { percentage, maxProcesses } = getOperatorWorkload(op);
                  return (
                    <div
                      key={op.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedOperator === op.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedOperator(op.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{op.name}</h4>
                          <p className="text-sm text-gray-500">{op.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-gray-400" />
                            <span
                              className={`font-medium ${getWorkloadColor(
                                percentage
                              )}`}
                            >
                              {op.processesCount}/{maxProcesses}
                            </span>
                          </div>
                          <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                            <div
                              className={`h-full rounded-full ${
                                percentage >= 90
                                  ? "bg-red-500"
                                  : percentage >= 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h4 className="font-medium">Resumo da Distribuição</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Processos selecionados:</span>
                    <span className="font-medium">
                      {selectedProcesses.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operador selecionado:</span>
                    <span className="font-medium">
                      {selectedOperator
                        ? operators.find((op) => op.id === selectedOperator)
                            ?.name
                        : "Nenhum"}
                    </span>
                  </div>
                  {selectedOperator && (
                    <div className="flex justify-between">
                      <span>Nova carga de trabalho:</span>
                      <span className="font-medium">
                        {(operators.find((op) => op.id === selectedOperator)
                          ?.processesCount || 0) + selectedProcesses.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleBulkAssign}
                disabled={
                  loading || !selectedOperator || selectedProcesses.length === 0
                }
                className="w-full"
                size="lg"
              >
                {loading
                  ? "Processando..."
                  : `Atribuir ${selectedProcesses.length} processos`}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
