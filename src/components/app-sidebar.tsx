
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/use-app-store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Menu, UserCircle, LogOut, ClipboardList, BarChartBig, Wallet, ChefHat, History, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from './ui/button';

export default function AppSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout, isMounted } = useAppStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsOpen(false);
  };
  
  if (!isMounted || !currentUser) {
    return (
        <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
        </Button>
    )
  }

  const isAdmin = currentUser?.role === 'admin';
  const isEmployee = currentUser?.role === 'employee';

  const navLinks = [
    ...(isAdmin ? [{ label: "Inventario", icon: ClipboardList, path: '/inventory' }] : []),
    ...(isAdmin ? [{ label: "Reportes", icon: BarChartBig, path: '/reports' }] : []),
    ...(isAdmin || isEmployee ? [{ label: "Gastos", icon: Wallet, path: '/expenses' }] : []),
    { label: "Cocina", icon: ChefHat, path: '/kitchen' },
    { label: "Historial", icon: History, path: '/history' },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-xl font-bold text-primary font-headline">El Puerto de Carola</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col justify-between">
            <div className="flex-1 p-4">
                <nav className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.path}
                            onClick={() => setIsOpen(false)}
                            className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'justify-start gap-3 text-base')}
                        >
                            <link.icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    ))}
                    <Separator className="my-2" />
                    <Link
                        href="/takeaway"
                        onClick={() => setIsOpen(false)}
                        className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'justify-center gap-3 text-base')}
                    >
                        <ShoppingBag className="h-5 w-5" />
                        Para Llevar
                    </Link>
                </nav>
            </div>

            <div className="p-4 border-t">
                <div className="flex items-center gap-3 mb-3">
                    <UserCircle className="h-6 w-6 text-muted-foreground" />
                    <span className="text-base font-medium">{currentUser.username}</span>
                </div>
                <Button variant="outline" className="w-full justify-center" onClick={handleLogout}>
                    <LogOut className="mr-2 h-5 w-5" />
                    Cerrar Sesión
                </Button>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
