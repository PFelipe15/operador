"use client"

import Logo from "@/components/layout/Logo"
import { UserProfileModal } from '@/components/modals/UserProfileModal'
import { ThemeToggle } from "@/components/themes/theme-toggle"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from '@/hooks/useAuth'
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Bot,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileText,
  LayoutDashboard,
  Settings,
  Share2,
  Users
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
 
const sidebarLinks = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/operador/dashboard',
    icon: <LayoutDashboard className="text-emerald-600 h-5 dark:text-emerald-400" />
  },
  {
    id: 'processos',
    name: 'Processos',
    href: '/operador/process',
    icon: <FileText className="text-emerald-600 h-5 dark:text-emerald-400" />
  },

  {
    id: 'distribuicao',
    name: 'Distribuição',
    href: '/operador/case-distribution',
    icon: <Share2 className="text-emerald-600 h-5 dark:text-emerald-400" />
  }, 
  {
    id: 'clientes',
    name: 'Clientes',
    href: '/operador/clients',
    icon: <Users className="text-emerald-600 h-5 dark:text-emerald-400" />
  },
  {
    id: 'relatorios',
    name: 'Relatórios',
    href: '/operador/relatorios',
    icon: <BarChart3 className="text-emerald-600 h-5 dark:text-emerald-400" />
  },
  {
    id: 'configuracoes',
    name: 'Configurações',
    href: '/operador/configuracoes',
    icon: <Settings className="text-emerald-600 h-5 dark:text-emerald-400" />
  },{
    id: 'bot',
    name: 'Bot',
    href: '/operador/bot',
    icon: <Bot className="text-emerald-600 h-5 dark:text-emerald-400" />
  }
]



export const Sidebar = ({ className }: { className?: string }) => {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { operator } = useAuth()
  const isAdmin = operator?.role === 'ADMIN'

  // Filtrando os links baseado no papel do usuário
  const filteredSidebarLinks = sidebarLinks.filter(link => {
    if (link.id === 'distribuicao' || link.id === 'bot') {
      return isAdmin
    }
    return true
  })

  return (
    <div 
      className={cn(
        "flex h-screen flex-col bg-white dark:bg-gray-900 relative transition-all duration-300",
        isCollapsed ? "w-20" : "w-72",
        className
      )}
    >
      {/* Botão de Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-6 z-20 h-8 w-8 rounded-full border bg-white dark:bg-gray-900 shadow-md"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-4 w-4" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4" />
        )}
      </Button>

 
      {/* Header do Sidebar */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && <Logo width={150} height={50}  />}
          {!isCollapsed && <ThemeToggle />}
        </div>
      </div>

      {/* Navegação */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-4">
          <nav className="space-y-1">
            {filteredSidebarLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isCollapsed && "justify-center",
                  pathname === link.href
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                )}
                title={isCollapsed ? link.name : undefined}
              >
                <div className={cn(
                  "flex items-center justify-center rounded",
                  isCollapsed ? "w-10 h-10" : "w-6 h-6"
                )}>
                  {link.icon}
                </div>
                {!isCollapsed && <span>{link.name}</span>}
              </Link>
            ))}
          </nav>
        </div>
      </ScrollArea>

      {/* Footer com informações do usuário */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-4">
        <div 
          className={cn(
            "flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors",
            isCollapsed ? "justify-center" : "px-2"
          )}
          onClick={() => setIsProfileOpen(true)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {operator?.name.charAt(0)}
            </span>
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {operator?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {operator?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modal de Perfil */}
      <UserProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  )
}

 
