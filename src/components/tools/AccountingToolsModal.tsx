"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calculator, X } from "lucide-react";
import { AccountingTools } from "./AccountingTools";
import { cn } from "@/lib/utils";

interface AccountingToolsModalProps {
  clientCpf?: string;
  companyCnpj?: string;
  processId?: string;
  trigger?: React.ReactNode;
  className?: string;
}

export function AccountingToolsModal({
  clientCpf,
  companyCnpj,
  processId,
  trigger,
  className,
}: AccountingToolsModalProps) {
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500 hover:from-emerald-600 hover:to-emerald-700 hover:border-emerald-600",
        className
      )}
    >
      <Calculator className="h-4 w-4" />
      Ferramentas Contábeis
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-white">
              <Calculator className="h-5 w-5" />
              Ferramentas Contábeis Avançadas
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-white hover:bg-white/10 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-6">
          <AccountingTools
            clientCpf={clientCpf}
            companyCnpj={companyCnpj}
            processId={processId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
