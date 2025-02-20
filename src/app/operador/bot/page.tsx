'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Battery, Phone, Signal, AlertCircle, Clock, Plus, RefreshCw, Smartphone, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import Image from 'next/image'

interface BotData {
  qrcode: string | null
  hasConnected: boolean
  status: string
  lastConnection: string | null
  phoneNumber: string | null
  batteryLevel: number | null
  isOnline: boolean
  errorMessage: string | null
}

export default function BotPage() {
  const [bot, setBot] = useState<BotData | null>(null)
  const [qrCodeImage, setQrCodeImage] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const fetchBot = async () => {
      try {
        const response = await fetch('/api/bot')
        const data = await response.json()
        setBot(data)
        
        if (data?.qrcode) {
          const qrImage = await QRCode.toDataURL(data.qrcode)
          setQrCodeImage(qrImage)
        }
      } catch (error) {
        console.error('Erro ao buscar dados do bot:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBot()
    const interval = setInterval(fetchBot, 5000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'bg-green-100 text-green-700'
      case 'CONNECTING': return 'bg-yellow-100 text-yellow-700'
      case 'ERROR': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }


  const translateStatus = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'Conectado'
      case 'CONNECTING': return 'Conectando'
      case 'ERROR': return 'Erro'
      case 'NOT_CREATED': return 'Bot não criado'
      case "AGUARDANDO_CONEXAO": return 'Aguardando conexão'
    }
  }

  const handleCreateBot = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/bot', {
        method: 'POST',
      })
      if (response.ok) {
        // Atualiza os dados após criar o bot
        const data = await response.json()
        setBot(data)
      }
    } catch (error) {
      console.error('Erro ao criar bot:', error)
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Bot className="w-6 h-6 text-green-600" />
            Gerenciamento do Bot WhatsApp
          </h1>

          <div className="flex flex-col items-center justify-center p-12">
            <RefreshCw className="w-10 h-10 animate-spin text-green-600" />
            <p className="mt-4 text-gray-600 font-medium">Carregando configurações do bot...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!bot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Bot className="w-6 h-6 text-green-600" />
            Gerenciamento do Bot WhatsApp
          </h1>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="space-y-6 pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-gray-800">Configuração do Bot WhatsApp</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Configure seu primeiro bot para automatizar o atendimento
                  </CardDescription>
                </div>
                <Image 
                  src="/figuras/bot.svg" 
                  alt="Bot WhatsApp" 
                  width={120} 
                  height={120}
                  className="animate-float"
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-blue-800">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    Importante
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Após criar o bot, nossa equipe técnica entrará em contato para auxiliar na configuração e ativação do seu WhatsApp Business.
                  </p>
                  <ul className="space-y-2 text-blue-700">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Suporte personalizado para configuração
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Orientação sobre melhores práticas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Ativação segura do WhatsApp Business
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-800">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    Como funciona?
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: "🔄", text: "Ao criar o bot, você receberá um QR Code" },
                      { icon: "📱", text: "Escaneie o QR Code com seu WhatsApp" },
                      { icon: "✅", text: "O bot estará pronto para uso após a conexão" },
                      { icon: "💬", text: "Gerencie todas as conversas através desta interface" }
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-600">
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  onClick={handleCreateBot}
                  disabled={isCreating}
                  className="w-full h-12 text-base bg-green-600 hover:bg-green-700 transition-colors"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Criando bot...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Criar Bot WhatsApp
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Bot className="w-6 h-6 text-green-600" />
          Gerenciamento do Bot WhatsApp
        </h1>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl text-gray-800">Bot WhatsApp</CardTitle>
                <CardDescription className="text-base mt-1">
                  Gerencie as configurações e status do seu bot
                </CardDescription>
              </div>
              <div className={`px-4 py-2 rounded-full ${getStatusColor(bot.status)} font-medium`}>
                {translateStatus(bot.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status do Bot */}
            {bot.hasConnected && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
                  <h3 className="font-semibold text-gray-800">Informações do Dispositivo</h3>
                  <div className="space-y-3">
                    {bot.phoneNumber && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Phone className="w-5 h-5 text-green-600" />
                        <span>{bot.phoneNumber}</span>
                      </div>
                    )}
                    {bot.batteryLevel !== null && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Battery className="w-5 h-5 text-green-600" />
                        <span>{bot.batteryLevel}%</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-600">
                      <Signal className="w-5 h-5 text-green-600" />
                      <span>{bot.isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    {bot.lastConnection && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Clock className="w-5 h-5 text-green-600" />
                        <span>{new Date(bot.lastConnection).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* QR Code */}
            {!bot.hasConnected && bot.status !== "NOT_CREATED" && qrCodeImage && (
              <div className="space-y-6">
                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
                  <h3 className="font-semibold text-lg mb-4 text-yellow-800">Instruções de Conexão</h3>
                  <ol className="space-y-2 text-yellow-700">
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center text-sm font-medium">1</span>
                      Abra o WhatsApp no seu celular
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center text-sm font-medium">2</span>
                      Acesse Configurações/Aparelhos Conectados
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center text-sm font-medium">3</span>
                      Selecione &quot;Conectar um aparelho&quot;
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center text-sm font-medium">4</span>
                      Escaneie o QR Code abaixo
                    </li>
                  </ol>
                </div>
                <div className="flex justify-center">
                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <Image
                      src={qrCodeImage}
                      alt="QR Code do WhatsApp"
                      width={280}
                      height={280}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}