"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import { useActiveOrders } from '@/hooks/use-active-orders';
import { useCrmMenu } from '@/hooks/use-crm-menu';
import { findMenuItem } from '@/lib/stats-helper';
import AppSidebar from '@/components/app-sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import type { Order, FirestoreItem } from '@/types';
import { Utensils, Clock, StickyNote, ArrowLeft, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface KitchenOrderCardProps {
  order: Order;
  menuItems: FirestoreItem[];
}

const KitchenOrderCard = ({ order, menuItems }: KitchenOrderCardProps) => {
  const isCancelled = order.status === 'cancelled';
  const isCompleted = order.status === 'completed';

  // Warning calculation (> 5 mins)
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (isCancelled || isCompleted) return;

    // Check every 30s
    const checkWarning = () => {
      const now = Date.now();
      const diff = now - order.createdAt;
      // 5 minutes = 300,000 ms
      setIsWarning(diff > 300000);
    };

    checkWarning();
    const interval = setInterval(checkWarning, 30000);
    return () => clearInterval(interval);
  }, [order.createdAt, isCancelled, isCompleted]);

  const getMenuItemName = (id: string | number) => {
    const item = findMenuItem(menuItems, id);
    return item ? item.name : "Item Desconocido";
  };

  let cardClasses = "flex flex-col border shadow-sm transition-colors ";
  if (isCancelled) {
    cardClasses += "bg-red-50 border-red-300 dark:bg-red-950/50 dark:border-red-800 shadow-md";
  } else if (isCompleted) {
    // Paid takeaway
    cardClasses += "bg-green-50 border-green-300 dark:bg-green-950/50 dark:border-green-800 opacity-90";
  } else if (isWarning) {
    // Late order
    cardClasses += "bg-orange-50 border-orange-400 dark:bg-orange-950/50 dark:border-orange-800 shadow-md animate-in fade-in";
  }

  return (
    <Card className={cardClasses}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className={`flex items-center gap-2 ${isCancelled ? 'text-red-700 dark:text-red-400' : isCompleted ? 'text-green-700 dark:text-green-400' : isWarning ? 'text-orange-700 dark:text-orange-400' : ''}`}>
            {order.tableId === 'takeaway' ? `LLEVAR #${order.id.slice(-4)}` : `Mesa ${order.tableId}`}
            {isWarning && !isCancelled && !isCompleted && <AlertTriangle className="h-4 w-4 text-orange-500 animate-pulse" />}
          </span>
          <span className={`text-sm font-normal flex items-center gap-1 ${isCancelled ? 'text-red-600' : 'text-muted-foreground'}`}>
            <Clock className="h-3 w-3" />
            {format(new Date(order.createdAt), "HH:mm", { locale: es })}
          </span>
        </CardTitle>
        {isCancelled ? (
          <CardDescription className="flex items-center gap-2 font-bold text-red-700 dark:text-red-400 pt-1">
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
            const menuItem = findMenuItem(menuItems, item.menuItemId);
            const itemName = menuItem ? menuItem.name : "Item Desconocido";

            return (
              <li key={`${item.menuItemId}-${index}`} className="flex items-start">
                <Utensils className={`h-5 w-5 mr-3 mt-1 ${isCancelled ? 'text-red-500 dark:text-red-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-primary'}`} />
                <div>
                  <p className="font-semibold">
                    {itemName}{' '}
                    {item.customPrice && `($${item.customPrice.toFixed(2)})`}{' '}
                    <span className={`font-bold ${isCancelled ? 'text-red-700 dark:text-red-400' : 'text-primary'}`}>x{item.quantity}</span>
                    {item.contexto === 'llevar' && <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold ml-1">(P/ Llevar)</span>}
                  </p>
                  {item.notes && <p className="text-xs text-amber-700 dark:text-amber-500">Sabor/Nota: {item.notes}</p>}
                </div>
              </li>
            );
          })}
        </ul>
        {order.notes && (
          <div className="mt-4 pt-4 border-t border-dashed">
            <p className="font-semibold flex items-center gap-2"><StickyNote className="h-4 w-4" /> Notas Generales:</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


export default function KitchenPage() {
  const { isMounted, currentUser } = useAppStore();
  const { orders } = useActiveOrders();
  const { items: menuItems } = useCrmMenu();
  const router = useRouter();
  const [visibleOrders, setVisibleOrders] = useState<Order[]>([]);

  // Sound effect ref
  const prevOrdersCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Simple beep sound or hosted URL
    // Softer bell sound (Service Bell / Ding)
    const audio = new Audio("https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3"); // Or a reliable CDN link
    // Backup: https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3
    // Let's use the Mixkit one as it is cleaner
    audio.src = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
    audio.volume = 0.6;
    audioRef.current = audio;
  }, []);

  useEffect(() => {
    if (isMounted && !currentUser) {
      router.push('/');
    }
  }, [currentUser, isMounted, router]);

  useEffect(() => {
    if (!orders) return;

    // Check for new orders to play sound
    // Only if count increases
    if (orders.length > prevOrdersCountRef.current) {
      // Play sound if there are actually active orders
      const hasNewActive = orders.some((o: Order) => o.status === 'preparing');
      if (hasNewActive && audioRef.current && prevOrdersCountRef.current > 0) {
        // Only play if we are not on initial load (0 -> N) to avoid noise on refresh, 
        // unless user wants it. Let's assume yes but maybe safely.
        audioRef.current.play().catch(e => console.log("Audio play failed", e));
      }
    }
    prevOrdersCountRef.current = orders.length;

  }, [orders]);


  useEffect(() => {
    if (!isMounted || !orders) return;

    const getVisible = () => {
      const now = Date.now();
      return orders
        .filter((o: Order) => {
          if (o.status === 'preparing') return true;
          if (o.status === 'cancelled') {
            return o.cancelledAt && (now - o.cancelledAt < 30000); // 30s for cancelled
          }
          if (o.status === 'completed' && o.tableId === 'takeaway') {
            // No auto-expiry here anymore.
            // We trust the hook to filter out delivered orders.
            return !o.delivered;
          }
          return false;
        })
        .sort((a: Order, b: Order) => b.createdAt - a.createdAt);
    };

    setVisibleOrders(getVisible());

    const interval = setInterval(() => {
      setVisibleOrders(getVisible());
    }, 5000); // Check every 5s for expiration

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
          <Link href={currentUser.role === 'admin' ? "/admin/dashboard" : "/dashboard"}>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              Volver al Salón
            </Button>
          </Link>
        </div>
        {visibleOrders.length > 0 ? (
          <ScrollArea className="h-[calc(100vh-150px)]">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleOrders.map(order => (
                <KitchenOrderCard key={order.id} order={order} menuItems={menuItems} />
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
