'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { User, Mail, Key, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getRoleOperator } from '@/lib/utils'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { operator, logout } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Perfil do Usuário</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Avatar e Nome */}
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-2xl font-semibold text-emerald-600">
                {operator?.name.charAt(0)}
              </span>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">{operator?.name}</h3>
              <p className={`text-sm text-gray-500 p-2 rounded-md font-semibold ${getRoleOperator(operator?.role || '').color}`}>{getRoleOperator(operator?.role || '').translate}</p>
            </div>
          </div>

          {/* Informações do Usuário */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={operator?.name}
                  readOnly
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={operator?.email}
                  readOnly
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Cargo</label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={getRoleOperator(operator?.role || '').translate}
                  readOnly
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col gap-2">
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoading ? 'Saindo...' : 'Sair da conta'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 