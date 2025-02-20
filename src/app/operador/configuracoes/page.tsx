'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, Mail, Shield, Smartphone } from "lucide-react"
import { useState } from "react"

export default function ConfiguracoesPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [securityAlerts, setSecurityAlerts] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Configurações
      </h1>

      <div className="grid gap-6">
        {/* Notificações */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Notificações
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <Label htmlFor="email-notifications" className="font-medium">
                    Notificações por Email
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receba atualizações sobre seus processos por email
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <Label htmlFor="push-notifications" className="font-medium">
                    Notificações Push
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receba notificações em tempo real no seu navegador
                  </p>
                </div>
              </div>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
          </div>
        </Card>

        {/* Segurança */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Segurança
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <Label htmlFor="security-alerts" className="font-medium">
                    Alertas de Segurança
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receba alertas sobre atividades suspeitas
                  </p>
                </div>
              </div>
              <Switch
                id="security-alerts"
                checked={securityAlerts}
                onCheckedChange={setSecurityAlerts}
              />
            </div>
          </div>

          <div className="mt-6">
            <Button variant="outline" className="w-full">
              Alterar Senha
            </Button>
          </div>
        </Card>

        {/* Preferências */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Preferências
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <Label htmlFor="dark-mode" className="font-medium">
                    Modo Escuro
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ative o tema escuro para melhor visualização noturna
                  </p>
                </div>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 