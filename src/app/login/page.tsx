'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Logo from '@/components/layout/Logo'
import Image from 'next/image'
import atendimentoInterno from '../../../public/figuras/atendimento-interno.svg'
import { ThemeToggle } from '@/components/themes/theme-toggle'
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
      router.push('/operador/dashboard')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Credenciais inválidas')
    }
  }

  return (
    <div className="h-screen flex">
      <div className='absolute top-12 left-12 w-full'> <ThemeToggle /> </div>
      {/* Coluna da Esquerda - Ilustração */}
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-50 dark:bg-emerald-900 flex-col items-center justify-center p-12">
        {/* Logo */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-3">
            <Logo width={250} height={95} />
          </div>
        </div>
        <div className="max-w-lg">
          <Image 
            src={atendimentoInterno}
            alt="Atendimento Interno"
            width={500}
            height={300}
            priority
          />

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Gerencie os processos de abertura de MEI e CNPJ de forma inteligente e eficiente
            </p>
          </div>
        </div>
      </div>

      {/* Coluna da Direita - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-[420px]">
          {/* Card de Login */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                Bem-vindo de volta
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Faça login para acessar sua conta
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Seu email"
                    className="h-12 px-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:text-white"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Input
                    type="password"
                    placeholder="Sua senha"
                    className="h-12 px-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:text-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg"
              >
                Entrar na plataforma
              </Button>

              <div className="text-center">
                <a 
                  href="#" 
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  Esqueceu sua senha?
                </a>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Precisa de ajuda?{' '}
            <a 
              href="#" 
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
            >
              Entre em contato
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 