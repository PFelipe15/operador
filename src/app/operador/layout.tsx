import "@/app/globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import type { FC, ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const OperadorLayout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative flex min-h-screen">
      <Sidebar className="block border-r shadow-sm" />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 bg-emerald-100 dark:bg-emerald-950 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default OperadorLayout;
