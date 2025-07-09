"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/use-app-store';
import { MENU_ITEMS } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function KitchenDisplay() {
    const { isMounted, currentUser, orders, updateOrderStatus } = useAppStore();
    const router = useRouter();

    useEffect(() => {
        if (isMounted && (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'kitchen'))) {
            router.push('/');
        }
    }, [currentUser, isMounted, router]);

    const activeOrders = orders
        .filter(o => o.status === 'preparing')
        .sort((a, b) => a.createdAt - b.createdAt);
    
    if (!isMounted || !currentUser) {
        return <div className="text-center">Cargando...</div>
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Pedidos en Cocina</h1>
            {activeOrders.length > 0 ? (
                <ScrollArea className="h-[calc(100vh-10rem)]">
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 pr-4">
                        {activeOrders.map(order => (
                            <Card key={order.id} className="flex flex-col">
                                <CardHeader className="bg-primary text-primary-foreground">
                                    <CardTitle>
                                        {order.tableId === 'takeaway' ? 'PARA LLEVAR' : `Mesa ${order.tableId}`}
                                    </CardTitle>
                                    <p className="text-xs text-primary-foreground/80">
                                        hace {formatDistanceToNow(new Date(order.createdAt), { locale: es })}
                                    </p>
                                </CardHeader>
                                <CardContent className="pt-4 flex-1">
                                    <ul className="space-y-2">
                                        {order.items.map((item, index) => {
                                            const menuItem = MENU_ITEMS.find(mi => mi.id === item.menuItemId);
                                            return (
                                                <li key={`${item.menuItemId}-${index}`} className="text-sm">
                                                    <div className="font-semibold">{menuItem?.nombre} x{item.quantity}</div>
                                                    {item.notes && <p className="text-xs text-amber-800 bg-amber-100 p-1 rounded-sm">Nota: {item.notes}</p>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    {order.notes && (
                                        <>
                                            <Separator className="my-2" />
                                            <div>
                                                <p className="font-semibold text-sm">Notas Generales:</p>
                                                <p className="text-xs text-amber-800 bg-amber-100 p-1 rounded-sm whitespace-pre-wrap">{order.notes}</p>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                                <Separator />
                                <CardFooter className="p-2">
                                    <Button className="w-full" onClick={() => updateOrderStatus(order.id, 'ready')}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Marcar como Listo
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center bg-card rounded-lg shadow-sm">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-semibold">¡Todo al día!</h2>
                    <p className="text-muted-foreground">No hay pedidos pendientes en la cocina.</p>
                </div>
            )}
        </div>
    );
}
