import { getEventColor } from "@/lib/eventHelpers";
import { EventIcon } from "../process/EventIcons";
import { cn, getProcessStatusColor } from "@/lib/utils";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { getCategoryText } from "@/lib/processHelpers";
import { ArrowRight, User } from "lucide-react";
 import { processStatusTranslations } from "@/constants/translate";
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
                            {item}
                          </Badge>
                        ))}
                      </div>
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