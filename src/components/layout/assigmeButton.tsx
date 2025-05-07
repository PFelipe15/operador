import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Button } from "../ui/button";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

export const AssignToMeButton = ({
  processId,
  onAssignSuccess,
}: {
  processId: string;
  onAssignSuccess?: () => void;
}) => {
  const { operator } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleAssign = async () => {
    if (!operator?.id) return;
    setIsLoading(true);

    try {
      await toast.promise(
        async () => {
          const response = await fetch(
            `/api/v1/processes/${processId}/assign`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ operatorId: operator.id }),
            }
          );

          if (response.ok) {
            // Chama o callback após sucesso
            onAssignSuccess?.();
          }
        },
        {
          loading: "Atribuindo processo...",
          success: "Processo atribuído com sucesso",
          error: "Erro ao atribuir processo",
        }
      );
    } catch (error) {
      console.error("Erro ao atribuir processo:", error);
      toast.error("Erro ao atribuir processo", {
        description: "Não foi possível atribuir o processo.",
      });
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
