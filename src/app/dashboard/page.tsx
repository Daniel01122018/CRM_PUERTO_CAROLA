
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/app-header';
import { UtensilsCrossed, Square, CheckSquare, ShoppingBag, History, ChefHat, Wallet, BarChartBig, Menu, X } from 'lucide-react';
import type { Table } from '@/types';

function TableCard({ table }: { table: Table }) {
    let cardClass = 'bg-green-100 border-green-300';
    let statusText = 'Disponible';
    let statusSubText = 'Lista para un nuevo pedido';
    let statusIcon = <CheckSquare className="h-3 w-3 text-green-600" />;

    if (table.status === 'occupied') {
        cardClass = 'bg-amber-100 border-amber-300';
        statusText = 'Ocupada';
        statusSubText = 'Pedido en curso';
        statusIcon = <Square className="h-3 w-3 text-amber-600" />;
    }
    
    return (
      <Link 
        key={table.id} 
        href={`/order/${table.orderId || `new-${table.id}`}`}
        className="min-h-[110px]"
      >
        <Card className={`transition-all hover:shadow-lg hover:-translate-y-1 h-full ${cardClass}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesa {table.id}</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold capitalize">{statusText}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {statusIcon}
                <span>{statusSubText}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
}

const FloatingActionMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser } = useAppStore();
  const router = useRouter();

  const isAdmin = currentUser?.role === 'admin';

  const actions = [
    { label: "Historial", icon: History, onClick: () => router.push('/history'), className: "bg-primary text-primary-foreground hover:bg-primary/90" },
    { label: "Cocina", icon: ChefHat, onClick: () => router.push('/kitchen'), className: "bg-secondary text-secondary-foreground hover:bg-secondary/80" },
    ...(isAdmin ? [
      { label: "Gastos", icon: Wallet, onClick: () => router.push('/expenses'), className: "bg-red-600 hover:bg-red-700" },
      { label: "Reportes", icon: BarChartBig, onClick: () => router.push('/reports'), className: "bg-indigo-600 hover:bg-indigo-700" },
    ] : []),
  ];
  
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="relative flex flex-col-reverse items-center gap-2">
        {actions.map((action, index) => (
          <div
            key={action.label}
            className="transition-all duration-300 ease-in-out"
            style={{
              transform: isOpen ? `translateY(0)` : `translateY(${(index + 1) * 20}px)`,
              opacity: isOpen ? 1 : 0,
              visibility: isOpen ? 'visible' : 'hidden',
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
            }}
          >
            <Button
              size="lg"
              variant="secondary"
              className={`rounded-full w-14 h-14 shadow-lg text-white ${action.className}`}
              aria-label={action.label}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              tabIndex={isOpen ? 0 : -1}
            >
              <action.icon className="h-7 w-7" />
            </Button>
          </div>
        ))}

        <Button
          size="lg"
          className="rounded-full w-20 h-20 shadow-lg text-2xl z-10"
          aria-label="Menú de acciones"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-9 w-9" /> : <Menu className="h-9 w-9" />}
        </Button>
      </div>
    </div>
  );
};


export default function DashboardPage() {
  const { isMounted, currentUser, tables } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isMounted && !currentUser) {
      router.push('/');
    }
  }, [currentUser, isMounted, router]);

  if (!isMounted || !currentUser || !tables) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }
  
  if (currentUser.role === 'kitchen') {
     router.push('/kitchen');
     return <div className="flex h-screen items-center justify-center">Redirigiendo...</div>;
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Salón de Mesas</h1>
            <Link href="/takeaway">
                <Button className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Para Llevar
                </Button>
            </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 min-h-[70vh]">
          {tables.map((table) => (
            <TableCard key={table.id} table={table} />
          ))}
        </div>
      </main>
      <FloatingActionMenu />
    </div>
  );
}
