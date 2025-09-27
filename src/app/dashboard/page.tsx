
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import AppHeader from '@/components/app-header';
import { UtensilsCrossed, Square, CheckSquare } from 'lucide-react';
import type { Table } from '@/types';

function TableCard({ table }: { table: Table }) {
    let cardClass = 'bg-green-100/80 border-green-300 backdrop-blur-sm';
    let statusText = 'Disponible';
    let statusSubText = 'Lista para un nuevo pedido';
    let statusIcon = <CheckSquare className="h-3 w-3 text-green-800" />;

    if (table.status === 'occupied') {
        cardClass = 'bg-amber-100/80 border-amber-300 backdrop-blur-sm';
        statusText = 'Ocupada';
        statusSubText = 'Pedido en curso';
        statusIcon = <Square className="h-3 w-3 text-amber-800" />;
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
    <div className="relative min-h-screen w-full bg-[url('/SalonPage.jpg')] bg-cover bg-fixed">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative z-10 flex min-h-screen w-full flex-col">
            <AppHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-white">Salón de Mesas</h1>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 min-h-[70vh]">
                {tables.map((table) => (
                    <TableCard key={table.id} table={table} />
                ))}
                </div>
            </main>
        </div>
    </div>
  );
}

