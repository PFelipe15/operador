"use client";

import Logo from "@/components/layout/Logo";
import { UserProfileModal } from "@/components/modals/UserProfileModal";
import { ThemeToggle } from "@/components/themes/theme-toggle";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bot,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  Share2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const sidebarLinks = [
  {
    id: "dashboard",
    name: "Dashboard",
    href: "/operador/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    gradient: "from-emerald-500 to-green-600",
  },
  {
    id: "processos",
    name: "Processos",
    href: "/operador/process",
    icon: <FileText className="h-5 w-5" />,
    gradient: "from-emerald-600 to-green-700",
  },
  {
    id: "distribuicao",
    name: "Distribuição",
    href: "/operador/case-distribution",
    icon: <Share2 className="h-5 w-5" />,
    gradient: "from-green-500 to-emerald-600",
  },
  {
    id: "clientes",
    name: "Clientes",
    href: "/operador/clients",
    icon: <Users className="h-5 w-5" />,
    gradient: "from-emerald-400 to-green-500",
  },
  {
    id: "relatorios",
    name: "Relatórios",
    href: "/operador/relatorios",
    icon: <BarChart3 className="h-5 w-5" />,
    gradient: "from-green-600 to-emerald-700",
  },
  {
    id: "chats",
    name: "Chats",
    href: "/operador/chats",
    icon: <MessageCircle className="h-5 w-5" />,
    gradient: "from-emerald-500 to-green-600",
  },
  {
    id: "configuracoes",
    name: "Configurações",
    href: "/operador/configuracoes",
    icon: <Settings className="h-5 w-5" />,
    gradient: "from-gray-500 to-gray-600",
  },
  {
    id: "bot",
    name: "Bot",
    href: "/operador/bot",
    icon: <Bot className="h-5 w-5" />,
    gradient: "from-emerald-600 to-green-700",
  },
];

export const Sidebar = ({ className }: { className?: string }) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { operator, logout } = useAuth();
  const isAdmin = operator?.role === "ADMIN";

  // Filtrando os links baseado no papel do usuário
  const filteredSidebarLinks = sidebarLinks.filter((link) => {
    if (link.id === "distribuicao" || link.id === "bot") {
      return isAdmin;
    }
    return true;
  });

  return (
    <div
      className={cn(
        "flex h-screen flex-col relative transition-all duration-300 ease-in-out",
        "bg-gradient-to-b from-emerald-50/50 via-white to-green-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950/50",
        "border-r border-emerald-100/50 dark:border-emerald-800/30 shadow-xl",
        isCollapsed ? "w-20" : "w-72",
        className
      )}
    >
      {/* Overlay Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-500/5 pointer-events-none"></div>

      {/* Botão de Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-8 z-20 h-8 w-8 rounded-full border bg-white/90 dark:bg-gray-800/90 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-700/50"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        )}
      </Button>

      {/* Header do Sidebar */}
      <div className="relative z-10 px-6 py-6 border-b border-emerald-100/50 dark:border-emerald-800/30">
        <div
          className={cn(
            "flex items-center transition-all duration-300",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <Logo width={165} height={52} />
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">S</span>
            </div>
          )}
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          )}
        </div>
      </div>

      {/* Navegação */}
      <ScrollArea className="flex-1 relative z-10">
        <div className="px-4 py-6">
          <nav className="space-y-2">
            {filteredSidebarLinks.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 overflow-hidden",
                    isCollapsed && "justify-center px-3",
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/50 hover:shadow-md hover:scale-[1.02]"
                  )}
                  title={isCollapsed ? link.name : undefined}
                >
                  {/* Background gradient para item ativo */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 opacity-100"></div>
                  )}

                  {/* Background hover para itens inativos */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/60 to-white/40 dark:from-gray-800/60 dark:to-gray-800/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}

                  {/* Ícone com background gradiente */}
                  <div
                    className={cn(
                      "relative z-10 flex items-center justify-center rounded-lg transition-all duration-300",
                      isCollapsed ? "w-10 h-10" : "w-8 h-8",
                      isActive
                        ? "bg-white/20 text-white"
                        : `bg-gradient-to-r ${link.gradient} text-white shadow-sm group-hover:shadow-md group-hover:scale-110`
                    )}
                  >
                    {link.icon}
                  </div>

                  {/* Label do menu */}
                  {!isCollapsed && (
                    <span className="relative z-10 font-semibold tracking-wide">
                      {link.name}
                    </span>
                  )}

                  {/* Indicador de item ativo */}
                  {isActive && (
                    <div className="absolute right-2 w-2 h-2 bg-white rounded-full shadow-sm animate-pulse"></div>
                  )}

                  {/* Efeito de brilho no hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </Link>
              );
            })}
          </nav>
        </div>
      </ScrollArea>

      {/* Footer com informações do usuário */}
      <div className="relative z-10 border-t border-emerald-100/50 dark:border-emerald-800/30 p-4 bg-gradient-to-r from-white/50 to-emerald-50/50 dark:from-gray-900/50 dark:to-emerald-950/50 backdrop-blur-sm">
        <div
          className={cn(
            "group flex items-center gap-3 cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-xl p-3 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
            isCollapsed ? "justify-center" : "px-3"
          )}
          onClick={() => setIsProfileOpen(true)}
        >
          {/* Avatar com gradiente */}
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg group-hover:shadow-xl transition-all duration-300">
              <span className="text-sm font-bold text-white">
                {operator?.name.charAt(0)}
              </span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm"></div>
          </div>

          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                    {operator?.name}
                  </p>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
                    {isAdmin ? "👑 Admin" : "💼 Op"}
                  </span>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate font-medium">
                  {operator?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                }}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Status indicator bar */}
        {!isCollapsed && (
          <div className="mt-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full animate-pulse"
              style={{ width: "75%" }}
            ></div>
          </div>
        )}
      </div>

      {/* Modal de Perfil */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};
