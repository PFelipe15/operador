import { Bot, Send, Sparkles } from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ScrollArea } from "../ui/scroll-area"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function OperatorAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const quickPrompts = [
    "Como validar um CNPJ?",
    "Quais documentos são necessários para MEI?",
    "Qual o limite de faturamento do MEI?",
    "Como verificar pendências fiscais?",
  ]

  async function handleSendMessage(content: string) {
    if (!content.trim()) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Aqui você implementaria a chamada para sua API
      const response = await fetch('/api/assistant', {
        method: 'POST',
        body: JSON.stringify({
          message: content,
          context: 'operator-support'
        })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border shadow-lg overflow-hidden">
      {/* Cabeçalho */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Bot className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Assistente Virtual</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-sm text-gray-500">Online agora</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Área de mensagens */}
      <ScrollArea className="flex-1 px-6 py-4 bg-gray-50">
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-emerald-600" />
              </div>
              <h4 className="font-medium text-gray-800 mb-2">Olá! Como posso ajudar?</h4>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Estou aqui para responder suas dúvidas sobre validação de documentos e processos.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex gap-3 max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                } animate-slideIn items-end`}
              >
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center">
                  {message.role === 'assistant' ? (
                    <div className="w-full h-full bg-emerald-100 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-sm text-white font-medium">U</span>
                    </div>
                  )}
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm ${
                    message.role === 'user'
                      ? 'bg-emerald-500 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="flex gap-3 items-end">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-150" />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Área de input */}
      <div className="p-4 bg-white border-t">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                className="px-4 py-2 text-sm bg-gray-50 text-gray-700 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-emerald-500" />
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
                className="w-full pl-4 pr-12 py-3 rounded-full border-gray-200 focus:border-emerald-500 focus:ring focus:ring-emerald-100"
              />
            </div>
            <Button
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
            >
              <Send className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 