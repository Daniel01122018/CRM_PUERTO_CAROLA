"use client";

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import AppHeader from '@/components/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { MENU_ITEMS } from '@/lib/data';
import { Utensils, Clock, ArrowLeft, PlusCircle, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TakeawayQueuePage() {
  const { isMounted, currentUser, orders } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isMounted && !currentUser) {
      router.push('/');
    }
  }, [currentUser, isMounted, router]);

  const activeTakeawayOrders = useMemo(() => {
    if (!isMounted) return [];
    return orders
      .filter(o => o.tableId === 'takeaway' && (o.status === 'active' || o.status === 'preparing'))
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [orders, isMounted]);

  if (!isMounted || !currentUser) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3"><ShoppingBag className="h-8 w-8"/> Pedidos para Llevar</h1>
                <p className="text-muted-foreground">Gestiona los pedidos para llevar activos.</p>
            </div>
            <div className="flex gap-2">
                <Link href="/order/new-takeaway">
                    <Button>
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Nuevo Pedido
                    </Button>
                </Link>
                <Link href="/dashboard">
                    <Button variant="outline" className="flex items-center gap-2">
                        <ArrowLeft className="h-5 w-5" />
                        Volver al Salón
                    </Button>
                </Link>
            </div>
        </div>
        {activeTakeawayOrders.length > 0 ? (
          <ScrollArea className="h-[calc(100vh-150px)]">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {activeTakeawayOrders.map(order => (
                  <Link key={order.id} href={`/order/${order.id}`}>
                    <Card className="flex flex-col h-full transition-all hover:shadow-lg hover:-translate-y-1">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>Pedido #{order.id.slice(-4)}</span>
                                <span className="text-sm font-normal flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(order.createdAt), "HH:mm", { locale: es })}
                                </span>
                            </CardTitle>
                             <CardDescription>
                                {order.items.length} {order.items.length === 1 ? 'artículo' : 'artículos'} - Total: ${order.total.toFixed(2)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <Separator className="mb-4" />
                            <ul className="space-y-2">
                                {order.items.slice(0, 3).map((item, index) => {
                                    const menuItem = MENU_ITEMS.find(mi => mi.id === item.menuItemId);
                                    return (
                                        <li key={`${item.menuItemId}-${index}`} className="flex items-start text-sm">
                                            <Utensils className="h-4 w-4 mr-3 mt-1 text-primary" />
                                            <div>
                                                <p className="font-semibold">{menuItem?.nombre} <span className="font-bold text-primary">x{item.quantity}</span></p>
                                                {item.notes && <p className="text-xs text-amber-700">Nota: {item.notes}</p>}
                                            </div>
                                        </li>
                                    );
                                })}
                                {order.items.length > 3 && (
                                    <li className="text-sm text-muted-foreground">...y {order.items.length - 3} más.</li>
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                  </Link>
               ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-[calc(100vh-200px)] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30">
            <div className="text-center">
              <p className="text-lg font-semibold text-muted-foreground">No hay pedidos para llevar activos.</p>
              <p className="text-sm text-muted-foreground">Crea un nuevo pedido para empezar.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
