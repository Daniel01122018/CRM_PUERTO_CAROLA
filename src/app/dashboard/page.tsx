
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/app-header';
import { UtensilsCrossed, Square, CheckSquare, ShoppingBag, History, ChefHat, Wallet, BarChartBig } from 'lucide-react';
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
        style={{ 
            gridRow: table.gridRow, 
            gridColumn: table.gridCol,
            gridRowEnd: table.rowSpan ? `span ${table.rowSpan}` : undefined,
            gridColumnEnd: table.colSpan ? `span ${table.colSpan}` : undefined,
        }}
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
        <div className="p-4 border-2 border-dashed rounded-lg">
            <div className="grid grid-cols-8 grid-rows-6 gap-4 min-h-[70vh]">
            {tables.map((table) => (
                <TableCard key={table.id} table={table} />
            ))}
            </div>
        </div>
      </main>
      <div className="fixed bottom-8 right-8 z-50 flex flex-col-reverse gap-4">
        {currentUser.role === 'admin' && (
          <>
            <Button 
              size="lg" 
              variant="secondary"
              className="rounded-full w-16 h-16 shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white" 
              aria-label="Reportes Financieros"
              onClick={() => router.push('/reports')}
              >
                <BarChartBig className="h-8 w-8" />
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              className="rounded-full w-16 h-16 shadow-lg bg-red-600 hover:bg-red-700 text-white" 
              aria-label="Gestión de Gastos"
              onClick={() => router.push('/expenses')}
              >
                <Wallet className="h-8 w-8" />
            </Button>
          </>
        )}
        <Button 
          size="lg" 
          className="rounded-full w-16 h-16 shadow-lg" 
          aria-label="Historial de pedidos"
          onClick={() => router.push('/history')}
          >
            <History className="h-8 w-8" />
        </Button>
        <Button 
          size="lg" 
          variant="secondary"
          className="rounded-full w-16 h-16 shadow-lg" 
          aria-label="Vista de Cocina"
          onClick={() => router.push('/kitchen')}
          >
            <ChefHat className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}
