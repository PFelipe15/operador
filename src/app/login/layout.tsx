import '@/app/globals.css'
import { ThemeProvider } from '@/components/themes/theme-provider'
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <html className="flex flex-col min-h-screen">
    <body>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    </body>
    </html>
}

