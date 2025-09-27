
"use client";

import AppSidebar from "@/components/app-sidebar";

interface AppHeaderProps {
    showTakeawayButton?: boolean;
}

export default function AppHeader({ showTakeawayButton = false }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card px-4 sm:px-6">
        <AppSidebar />
        <div className="flex items-center gap-4">
          {/* Otros elementos del header si se necesitaran en el futuro */}
        </div>
    </header>
  );
}
