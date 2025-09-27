
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import AppSidebar from '@/components/app-sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { MENU_ITEMS, TAKEAWAY_MENU_ITEMS } from '@/lib/data';
import type { Order, MenuItem } from '@/types';
import { Utensils, Clock, StickyNote, ArrowLeft, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const KitchenOrderCard = ({ order }: { order: Order }) => {
    const isCancelled = order.status === 'cancelled';

    return (
        <Card className={`flex flex-col ${isCancelled ? 'bg-red-100 border-red-300 shadow-lg' : ''}`}>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span className={`${isCancelled ? 'text-red-700' : ''}`}>
                        {order.tableId === 'takeaway' ? `LLEVAR #${order.id.slice(-4)}` : `Mesa ${order.tableId}`}
                    </span>
                    <span className={`text-sm font-normal flex items-center gap-1 ${isCancelled ? 'text-red-600' : 'text-muted-foreground'}`}>
                        <Clock className="h-3 w-3" />
                        {format(new Date(order.createdAt), "HH:mm", { locale: es })}
                    </span>
                </CardTitle>
                {isCancelled ? (
                    <CardDescription className="flex items-center gap-2 font-bold text-red-700 pt-1">
                        <XCircle className="h-5 w-5" />
                        ORDEN DESECHADA
                    </CardDescription>
                ) : (
                    <CardDescription>ID: {order.id}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="flex-1">
                <Separator className="mb-4" />
                <ul className="space-y-3">
                    {order.items.map((item, index) => {
                        const menuList = item.contexto === 'llevar' ? TAKEAWAY_MENU_ITEMS : MENU_ITEMS;
                        const menuItem = menuList.find(mi => mi.id === item.menuItemId);
                        
                        return (
                            <li key={`${item.menuItemId}-${index}`} className="flex items-start">
                                <Utensils className={`h-5 w-5 mr-3 mt-1 ${isCancelled ? 'text-red-500' : 'text-primary'}`} />
                                <div>
                                    <p className="font-semibold">
                                        {menuItem?.nombre} <span className={`font-bold ${isCancelled ? 'text-red-700' : 'text-primary'}`}>x{item.quantity}</span>
                                        {item.contexto === 'llevar' && <span className="text-xs text-blue-600 font-semibold ml-1">(P/ Llevar)</span>}
                                    </p>
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
    );
};


export default function KitchenPage() {
  const { isMounted, currentUser, orders } = useAppStore();
  const router = useRouter();
  const [visibleOrders, setVisibleOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (isMounted && !currentUser) {
      router.push('/');
    }
  }, [currentUser, isMounted, router]);
  
  useEffect(() => {
    if (!isMounted || !orders) return;

    const getVisible = () => {
      const now = Date.now();
      return orders
        .filter(o => 
          o.status === 'preparing' || 
          (o.status === 'cancelled' && o.cancelledAt && (now - o.cancelledAt < 30000))
        )
        .sort((a, b) => b.createdAt - a.createdAt);
    };
    
    setVisibleOrders(getVisible());

    const interval = setInterval(() => {
      setVisibleOrders(getVisible());
    }, 1000);

    return () => clearInterval(interval);
  }, [orders, isMounted]);


  if (!isMounted || !currentUser || !orders) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex-1 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
                <AppSidebar />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vista de Cocina</h1>
                    <p className="text-muted-foreground">Pedidos activos para preparar.</p>
                </div>
            </div>
            <Link href="/dashboard">
                <Button variant="outline" className="flex items-center gap-2">
                    <ArrowLeft className="h-5 w-5" />
                    Volver al Salón
                </Button>
            </Link>
        </div>
        {visibleOrders.length > 0 ? (
          <ScrollArea className="h-[calc(100vh-150px)]">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleOrders.map(order => <KitchenOrderCard key={order.id} order={order} />)}
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
