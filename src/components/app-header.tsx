"use client";

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/use-app-store';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function AppHeader() {
  const { currentUser, logout, isMounted } = useAppStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isMounted) {
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-card">
            <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
                <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
                <div className="flex items-center space-x-4">
                    <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
                    <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
                </div>
            </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary font-headline">El Puerto de Carola</span>
        </Link>
        {currentUser && (
            <div className="flex flex-1 items-center justify-end space-x-4">
            <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{currentUser.username}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Cerrar sesión">
                <LogOut className="h-5 w-5" />
            </Button>
            </div>
        )}
      </div>
    </header>
  );
}
