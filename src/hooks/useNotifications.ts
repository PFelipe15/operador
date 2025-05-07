import useSWR from 'swr'
import { useAuth } from './useAuth'
import { toast } from 'sonner'
import { Notification } from '@prisma/client'
 export const useNotifications = () => {
  const { operator } = useAuth()
  
  const { 
    data: notifications = [], 
    error, 
    mutate 
  } = useSWR<Notification[]>(
    operator?.id ? `/api/v1/timeline/notifications/${operator.id}` : null,
    async (url) => {
      const res = await fetch(url)
      const data = await res.json()
      return data as Notification[]
    },
    { 
      refreshInterval: 10000, // Atualiza a cada 10 segundos
      onSuccess: (newData, prevData) => {
        // Verifica se há novas notificações
        if (prevData) {
          const newNotifications = newData.filter(
            (notification) => {
              const prev = prevData as unknown as Notification[]
              return !prev.find(p => p.id === notification.id)
            }
          )
          
          // Mostra toast para cada nova notificação
          newNotifications.forEach((notification: Notification) => {
            
            toast.info(notification.title, {
              description: notification.message,
            })
          })
        }
      }
    }
  )

  const unreadCount = notifications.filter((n: Notification) => !n.viewed).length

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/v1/timeline/notifications/read/${id}`, {
        method: 'PUT'
      })
      mutate() // Atualiza os dados
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!operator?.id) return
    
    try {
      await fetch(`/api/v1/timeline/notifications/read-all`, {
        method: 'PUT',
        body: JSON.stringify({ operatorId: operator.id })
      })
      mutate() // Atualiza os dados
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/v1/timeline/notifications/read/${id}`, {
        method: 'DELETE'
      })
      mutate()
    } catch (error) {
      console.error('Erro ao excluir notificação:', error)
      throw error
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading: !error && !notifications,
    isError: error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: mutate
  }
} 