
"use client";

import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, BarChartBig, Wallet, ChefHat, History, LayoutGrid, ShoppingBag, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const { currentUser, isMounted, logout } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isMounted && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/');
    }
  }, [currentUser, isMounted, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const modules = [
    { label: "Salón de Mesas", icon: LayoutGrid, path: '/dashboard' },
    { label: "Pedidos para Llevar", icon: ShoppingBag, path: '/takeaway' },
    { label: "Vista de Cocina", icon: ChefHat, path: '/kitchen' },
    { label: "Historial de Pedidos", icon: History, path: '/history' },
    { label: "Reportes Financieros", icon: BarChartBig, path: '/reports' },
    { label: "Gestión de Gastos", icon: Wallet, path: '/expenses' },
    { label: "Gestión de Empleados", icon: Users, path: '/employees' },
  ];

  if (!isMounted || !currentUser) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center text-center">
            <h1 className="text-2xl font-semibold mb-4">Cargando panel de administrador...</h1>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
        <h1 className="text-2xl font-bold text-primary font-headline">Panel de Administrador</h1>
        <div className="flex items-center gap-4">
            <span className="font-medium hidden sm:inline-block">Bienvenido, {currentUser.username}</span>
            <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
            </Button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <Link href={mod.path} key={mod.path} passHref>
              <Card className="hover:bg-primary/5 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-xl font-medium">{mod.label}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-6">
                  <mod.icon className="h-24 w-24 text-primary" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

