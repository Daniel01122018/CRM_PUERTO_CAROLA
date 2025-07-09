"use client";

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/use-app-store';
import AppHeader from '@/components/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MENU_ITEMS } from '@/lib/data';
import { Utensils, Clock, StickyNote } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function KitchenPage() {
  const { isMounted, currentUser, orders } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isMounted && !currentUser) {
      router.push('/');
    }
  }, [currentUser, isMounted, router]);
  
  const activeOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'preparing')
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [orders]);

  if (!isMounted || !currentUser) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6">
        <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight">Vista de Cocina</h1>
            <p className="text-muted-foreground">Pedidos activos para preparar.</p>
        </div>
        {activeOrders.length > 0 ? (
          <ScrollArea className="h-[calc(100vh-150px)]">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {activeOrders.map(order => (
                    <Card key={order.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>{order.tableId === 'takeaway' ? 'PARA LLEVAR' : `Mesa ${order.tableId}`}</span>
                                <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(order.createdAt), "HH:mm", { locale: es })}
                                </span>
                            </CardTitle>
                            <CardDescription>ID: {order.id}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <Separator className="mb-4" />
                            <ul className="space-y-3">
                                {order.items.map((item, index) => {
                                    const menuItem = MENU_ITEMS.find(mi => mi.id === item.menuItemId);
                                    return (
                                        <li key={`${item.menuItemId}-${index}`} className="flex items-start">
                                            <Utensils className="h-5 w-5 mr-3 mt-1 text-primary" />
                                            <div>
                                                <p className="font-semibold">{menuItem?.nombre} <span className="font-bold text-primary">x{item.quantity}</span></p>
                                                {item.notes && <p className="text-xs text-amber-700">Sabor/Nota: {item.notes}</p>}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            {order.notes && (
                                <div className="mt-4 pt-4 border-t border-dashed">
                                    <p className="font-semibold flex items-center gap-2"><StickyNote className="h-4 w-4"/> Notas Generales:</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                 ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-[calc(100vh-200px)] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30">
            <div className="text-center">
              <p className="text-lg font-semibold text-muted-foreground">No hay pedidos en preparación.</p>
              <p className="text-sm text-muted-foreground">Los nuevos pedidos aparecerán aquí.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
