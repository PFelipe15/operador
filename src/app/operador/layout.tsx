import type { FC, ReactNode } from "react"
import { Inter } from "next/font/google"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"
import "@/app/globals.css"
import { Toaster } from 'sonner'


const inter = Inter({ subsets: ["latin"] })

 

interface LayoutProps {
  children: ReactNode
}



const RootLayout: FC<LayoutProps> = ({ children }) => {

 
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn("min-h-screen font-sans antialiased", inter.className)}>
          <div className="relative flex min-h-screen">
            <Sidebar className=" block border-r shadow-sm" />
            <div className="flex-1 flex flex-col">
              <div className="md:hidden absolute top-4 left-4 z-40">
              </div>
              <main className="flex-1 bg-emerald-100 dark:bg-emerald-950 p-8">
                {children}
              </main>
            </div>
          </div>
          <Toaster 
            position="top-right"
            expand={false}
            richColors
            closeButton
          />
      </body>
    </html>
  )
}

export default RootLayout

