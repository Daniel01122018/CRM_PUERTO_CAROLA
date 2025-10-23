
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/use-app-store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Menu, UserCircle, LogOut, BarChartBig, Wallet, ChefHat, History, LayoutGrid, Sun, Moon, Laptop } from 'lucide-react'; // Importar iconos de tema
import { cn } from '@/lib/utils';
import { buttonVariants } from './ui/button';
import { useTheme } from 'next-themes'; // Importar useTheme
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Importar Select components

export default function AppSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout, isMounted } = useAppStore();
  const router = useRouter();
  const { theme, setTheme } = useTheme(); // Usar el hook useTheme

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsOpen(false);
  };
  
  if (!isMounted || !currentUser) {
    return (
        <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
        </Button>
    )
  }

  const isAdmin = currentUser?.role === 'admin';
  const isEmployee = currentUser?.role === 'employee';

  const navLinks = [
    ...(isAdmin || isEmployee ? [{ label: "Salón de Mesas", icon: LayoutGrid, path: '/dashboard' }] : []),
    ...(isAdmin ? [{ label: "Reportes", icon: BarChartBig, path: '/reports' }] : []),
    ...(isAdmin || isEmployee ? [{ label: "Gastos", icon: Wallet, path: '/expenses' }] : []),
    { label: "Cocina", icon: ChefHat, path: '/kitchen' },
    { label: "Historial", icon: History, path: '/history' },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-xl font-bold text-primary font-headline">El Puerto de Carola</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-4">
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
            </nav>
        </div>

        <div className="p-4 border-t mt-auto">
            {/* Selector de Tema */}
            <div className="mb-4">
                <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-full">
                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                        <SelectValue placeholder="Seleccionar Tema" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="light">
                            <div className="flex items-center gap-2">
                                <Sun className="h-4 w-4" /> Claro
                            </div>
                        </SelectItem>
                        <SelectItem value="dark">
                            <div className="flex items-center gap-2">
                                <Moon className="h-4 w-4" /> Oscuro
                            </div>
                        </SelectItem>
                        <SelectItem value="system">
                            <div className="flex items-center gap-2">
                                <Laptop className="h-4 w-4" /> Sistema
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-3 mb-3">
                <UserCircle className="h-6 w-6 text-muted-foreground" />
                <span className="text-base font-medium">{currentUser.username}</span>
            </div>
            <Button variant="outline" className="w-full justify-center" onClick={handleLogout}>
                <LogOut className="mr-2 h-5 w-5" />
                Cerrar Sesión
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
