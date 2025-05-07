/* eslint-disable @typescript-eslint/no-explicit-any */
import { getEventColor } from "@/lib/eventHelpers";
import { EventIcon } from "../process/EventIcons";
import { cn, getProcessStatusColor } from "@/lib/utils";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { getCategoryText } from "@/lib/processHelpers";
import { ArrowRight, User } from "lucide-react";
import { infoDataUpdate, processStatusTranslations } from "@/constants/translate";
import { PendingDataType, ProcessStatus, TimelineEvent as TimelineEventPrisma } from "@prisma/client";
import { translatePendingType } from "./pendent_data";

export function TimelineEvent({ event }: { event: TimelineEventPrisma }) {
    const [isExpanded, setIsExpanded] = useState(false);
  
    return (
      <div className="flex gap-4 relative group">
        {/* Indicador com ícone */}
        <div
          className={cn(
            "relative shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
            getEventColor(event.type)
          )}
        >
          <EventIcon category={event.type} />
        </div>
  
        {/* Conteúdo do evento */}
        <div className="flex-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{event.title}</span>
                <Badge variant="secondary" className="text-xs">
                  {getCategoryText(event.category)}
                </Badge>
              </div>
              <time className="text-xs text-muted-foreground">
                {new Date(event.createdAt).toLocaleDateString("pt-BR")}
              </time>
            </div>
          </button>
  
          {/* Detalhes expandidos */}
          <div
            className={cn(
              "grid transition-all",
              isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="overflow-hidden">
              {event.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {event.description}
                </p>
              )}
  
              {event.createdBy && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{event.createdBy}</span>
                  <span>•</span>
                  <time>
                    {new Date(event.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              )}
  
              {event.category === "STATUS" && event.metadata && (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-3 py-1 text-sm font-medium",
                        getProcessStatusColor(
                          JSON.parse(event.metadata || "{}")
                            .previousStatus as ProcessStatus
                        )
                      )}
                    >
                      {processStatusTranslations[
                        JSON.parse(event.metadata || "{}")
                          .previousStatus as ProcessStatus
                      ] || "Status anterior"}
                    </Badge>
  
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
  
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-3 py-1 text-sm font-medium",
                        getProcessStatusColor(
                          JSON.parse(event.metadata || "{}").newStatus
                        )
                      )}
                    >
                      {processStatusTranslations[
                        JSON.parse(event.metadata || "{}")
                          .newStatus as ProcessStatus
                      ] || "Novo status"}
                    </Badge>
                  </div>
                </div>
              )}

              {event.category === "DATA" && event.metadata && (
                <div className="flex flex-col space-y-2">
                  

                  {/* Exibe itens adicionados/removidos se existirem */}
                  {JSON.parse(event.metadata || "{}").addedItems?.length > 0 && (
                    <div className="flex flex-col gap-1 mt-2">
                      <span className="text-xs text-muted-foreground">Itens Adicionados:</span>
                      <div className="flex flex-wrap gap-1">
                        {JSON.parse(event.metadata || "{}").addedItems.map((item: string, index: number) => (
                          <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {translatePendingType(item as PendingDataType)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {JSON.parse(event.metadata || "{}").removedItems?.length > 0 && (
                    <div className="flex flex-col gap-1 mt-2">
                      <span className="text-xs text-muted-foreground">Itens Removidos:</span>
                      <div className="flex flex-wrap gap-1">
                        {JSON.parse(event.metadata || "{}").removedItems.map((item: string, index: number) => (
                          <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {translatePendingType(item as PendingDataType)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {event.category === "UPDATEFIELD" && event.metadata && (
                <div className="flex flex-col space-y-2 mt-2">
                  <div className="text-xs text-muted-foreground mb-1">
                    Alterações realizadas:
                  </div>
                  
                  <div className="bg-blue-50 rounded-md p-3 border border-blue-100">
                    {(() => {
                      const metadata = JSON.parse(event.metadata || "{}");
                      const fieldName = metadata.field;
                      const oldValue = metadata.oldValue;
                      const newValue = metadata.newValue;
                      
                      // Tradução do nome do campo
                      const displayFieldName = infoDataUpdate[fieldName as keyof typeof infoDataUpdate] || 
                        fieldName?.charAt(0).toUpperCase() + fieldName?.slice(1).replace(/([A-Z])/g, ' $1');
                      
                      return (
                        <div className="flex flex-col gap-2">
                          <div className="font-medium text-sm text-blue-700 mb-1">
                            Campo: <span className="font-bold">{displayFieldName || "Campo"}</span>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-medium">Valor anterior:</span>
                              <span className="text-sm line-through text-gray-500">
                                {oldValue ? (typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue)) : '-'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-blue-700 font-medium">Novo valor:</span>
                              <span className="text-sm text-blue-700 font-medium">
                                {newValue ? (typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)) : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {JSON.parse(event.metadata || "{}").entity && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <span>Entidade atualizada:</span>
                      <Badge variant="outline" className="text-xs">
                        {JSON.parse(event.metadata || "{}").entity}
                      </Badge>
                    </div>
                  )}
                  
                  {JSON.parse(event.metadata || "{}").status && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Status atual:</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          getProcessStatusColor(JSON.parse(event.metadata || "{}").status as ProcessStatus)
                        )}
                      >
                        {processStatusTranslations[JSON.parse(event.metadata || "{}").status as ProcessStatus] || "Status atual"}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }