import { useAuth } from "@/hooks/useAuth";
import { useToast } from "../ui/use-toast";
import { useState } from "react";
import { Button } from "../ui/button";
import { UserPlus } from "lucide-react";

export  const AssignToMeButton = ({
    processId,
    onAssign,
  }: {
    processId: string;
    onAssign: () => void;
  }) => {
    const { operator } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
  
    const handleAssign = async () => {
      if (!operator?.id) return;
  
      console.log(operator.id);
  
      try {
        setIsLoading(true);
        const response = await fetch(`/api/process/${processId}/assign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ operatorId: operator.id }),
        });
  
        if (!response.ok) throw new Error("Falha ao atribuir processo");
  
        toast({
          title: "Processo atribuído com sucesso",
          description: "Você agora é o responsável por este processo.",
          variant: "success",
        });
  
        onAssign();
      } catch (error) {
        toast({
          title: "Erro ao atribuir processo",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
        console.log(error)
      } finally {
        setIsLoading(false);
      }
    };
  
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleAssign();
        }}
        disabled={isLoading}
        className="gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
      >
        <UserPlus className="h-4 w-4" />
        {isLoading ? "Atribuindo..." : "Atribuir a mim"}
      </Button>
    );
  };