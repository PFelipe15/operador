import { Bot, Send } from "lucide-react"
import { Button } from "../ui/button"
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet"
import { useState } from "react"
import { Input } from "../ui/input"
import { ScrollArea } from "../ui/scroll-area"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function ContextualHelp() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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
      const response = await fetch('/api/v1/assistant', {
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className=" h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <Bot className="h-6 w-6 text-emerald-600" />
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[380px] p-0">
        <div className="flex flex-col h-full">
          {/* Cabeçalho */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Bot className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Assistente Virtual</h3>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span className="text-xs text-gray-500">Online agora</span>
                </div>
              </div>
            </div>
          </div>

          {/* Área de mensagens */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <Bot className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-sm text-gray-600">Como posso ajudar você hoje?</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                      message.role === 'user' 
                        ? 'bg-emerald-500 text-white rounded-br-none' 
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-none">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-300" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
                className="rounded-full"
              />
              <Button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="rounded-full bg-emerald-500 hover:bg-emerald-600"
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 