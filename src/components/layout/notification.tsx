import { Bell, CheckCheck, ArrowRightLeft, FileText, User, ArrowRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useState } from "react"
import { Notification } from "@prisma/client"

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5  " />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-medium text-white">
                {unreadCount}

              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-[380px] p-0"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-red-50 text-red-700">
                {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs hover:text-blue-600"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Marcar como lidas
            </Button>
          )}
        </div>

        {/* Lista de Notificações */}
        <ScrollArea className="max-h-[70vh]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification:Notification) => {
                const metadata = JSON.parse(notification.metadata || '{}')
                const isStatusUpdate = notification.category === 'ANALYSIS'

                return (
                  <Link
                    key={notification.id}
                    href={`/process/${notification.processId}`}
                    className={cn(
                      "block p-4 hover:bg-gray-50 transition-colors",
                      !notification.viewed && "bg-blue-50/50"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        isStatusUpdate ? "bg-violet-50" : "bg-blue-50"
                      )}>
                        {isStatusUpdate ? (
                          <ArrowRightLeft className="h-4 w-4 text-violet-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-blue-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "px-1.5 py-0.5 text-[10px]",
                              isStatusUpdate 
                                ? "bg-violet-50 text-violet-700" 
                                : "bg-blue-50 text-blue-700"
                            )}
                          >
                            {isStatusUpdate ? "Status" : "Documento"}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <p className="text-sm text-gray-900 mb-1">
                          Processo #{metadata.processNumber}
                        </p>

                        {isStatusUpdate ? (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">{metadata.previousStatus}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-violet-600 font-medium">{metadata.newStatus}</span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">
                            {notification.message}
                          </p>
                        )}

                        {metadata.clientName && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                            <User className="h-3.5 w-3.5" />
                            {metadata.clientName}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Rodapé */}
        <div className="p-2 border-t">
          <Link
            href="/notifications"
            className="block text-center text-sm text-blue-600 hover:text-blue-700 py-1"
          >
            Ver todas as notificações
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
