import type { FC, ReactNode } from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { cn } from "@/lib/utils";
import "@/app/globals.css";
import { Toaster } from "sonner";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

interface LayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: "STEP.MEI",
  description: "Sistema de gestão de abertura de MEI",
  icons: {
    icon: "/figuras/logo.svg",
  },
};

const RootLayout: FC<LayoutProps> = ({ children }) => {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={cn("min-h-screen font-sans antialiased", inter.className)}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative">
            <main className="flex-1 bg-emerald-100 dark:bg-emerald-950">
              {children}
            </main>
          </div>
          <Toaster position="top-right" expand={false} richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
