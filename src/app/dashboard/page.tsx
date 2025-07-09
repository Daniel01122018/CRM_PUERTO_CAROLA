"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/app-header';
import { UtensilsCrossed, Square, CheckSquare, ShoppingBag, History } from 'lucide-react';

export default function DashboardPage() {
  const { isMounted, currentUser, tables } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isMounted && !currentUser) {
      router.push('/');
    }
  }, [currentUser, isMounted, router]);

  if (!isMounted || !currentUser) {
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
            <h1 className="text-2xl font-semibold">Estado de las Mesas</h1>
            <Link href="/order/takeaway">
                <Button className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Para Llevar
                </Button>
            </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {tables.map((table) => (
            <Link key={table.id} href={`/order/${table.orderId || `new-${table.id}`}`}>
              <Card className={`transition-all hover:shadow-lg hover:-translate-y-1 ${table.status === 'occupied' ? 'bg-amber-100 border-amber-300' : 'bg-green-100 border-green-300'}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mesa {table.id}</CardTitle>
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold capitalize">
                    {table.status === 'available' ? 'Disponible' : 'Ocupada'}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    {table.status === 'available' ? <CheckSquare className="h-3 w-3 text-green-600" /> : <Square className="h-3 w-3 text-amber-600" />}
                    <span>{table.status === 'available' ? 'Lista para un nuevo pedido' : 'Pedido en curso'}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <Link href="/history" className="fixed bottom-8 right-8 z-50">
        <Button size="lg" className="rounded-full w-16 h-16 shadow-lg" aria-label="Historial de pedidos">
            <History className="h-8 w-8" />
        </Button>
      </Link>
    </div>
  );
}
