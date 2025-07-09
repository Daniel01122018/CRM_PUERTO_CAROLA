
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/app-header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MENU_ITEMS } from '@/lib/data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, History as HistoryIcon } from 'lucide-react';

export default function HistoryPage() {
  const { isMounted, currentUser, orders } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isMounted && !currentUser) {
      router.push('/');
    }
  }, [currentUser, isMounted, router]);

  if (!isMounted || !currentUser) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }
  
  const completedOrders = orders
    .filter(o => o.status === 'completed')
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
                <HistoryIcon className="h-6 w-6" />
                Historial de Pedidos
            </h1>
            <Link href="/dashboard">
                <Button variant="outline" className="flex items-center gap-2">
                    <ArrowLeft className="h-5 w-5" />
                    Volver al Salón
                </Button>
            </Link>
        </div>

        {completedOrders.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pr-4">
                    {completedOrders.map(order => (
                        <Card key={order.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {order.tableId === 'takeaway' ? 'PARA LLEVAR' : `Mesa ${order.tableId}`}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(order.createdAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                                </p>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-1 text-sm">
                                    {order.items.map((item, index) => {
                                        const menuItem = MENU_ITEMS.find(mi => mi.id === item.menuItemId);
                                        return (
                                            <li key={`${item.menuItemId}-${index}`} className="flex justify-between">
                                                <span>{menuItem?.nombre} {item.notes ? `(${item.notes})` : ''} x{item.quantity}</span>
                                                <span>${(menuItem ? menuItem.precio * item.quantity : 0).toFixed(2)}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </CardContent>
                            <CardFooter className="font-bold text-lg flex justify-between">
                                <span>Total:</span>
                                <span>${order.total.toFixed(2)}</span>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        ) : (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center bg-card rounded-lg shadow-sm">
                <h2 className="text-2xl font-semibold">No hay pedidos completados</h2>
                <p className="text-muted-foreground">Aún no se ha finalizado ningún pedido.</p>
            </div>
        )}
      </main>
    </div>
  );
}
