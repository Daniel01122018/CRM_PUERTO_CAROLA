"use client";

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import AppSidebar from '@/components/app-sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useMenu } from '@/hooks/use-menu';
import type { Order } from '@/types';
import { Utensils, Clock, ArrowLeft, PlusCircle, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { findMenuItem } from '@/lib/stats-helper';

export default function KioskAdminPage() {
    const { isMounted, currentUser, orders } = useAppStore();
    const { items: menuItems } = useMenu();
    const router = useRouter();

    useEffect(() => {
        if (isMounted && !currentUser) {
            router.push('/');
        }
    }, [currentUser, isMounted, router]);

    const activeKioskOrders = useMemo(() => {
        if (!isMounted || !orders) return [];
        return orders
            .filter(o => o.tableId === 'kiosk' && (o.status === 'active' || o.status === 'preparing'))
            .sort((a, b) => a.createdAt - b.createdAt);
    }, [orders, isMounted]);

    const getMenuItemName = (id: string | number) => {
        if (!menuItems || menuItems.length === 0) return "Cargando...";
        const item = findMenuItem(menuItems, id);
        return item ? item.name : "Item Desconocido";
    };

    if (!isMounted || !currentUser || !orders) {
        return <div className="flex h-screen items-center justify-center">Cargando...</div>;
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <main className="flex-1 p-4 sm:p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                    <div className='flex items-center gap-3 flex-wrap'>
                        <AppSidebar />
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
                                <Monitor className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                                Pedidos de Autoservicio
                            </h1>
                            <p className="text-muted-foreground text-sm sm:text-base">
                                Gestiona los pedidos realizados desde el Kiosko.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                        <Link href={currentUser.role === 'admin' ? "/admin/dashboard" : "/dashboard"} className="w-full sm:w-auto">
                            <Button variant="outline" className="flex items-center justify-center gap-2 w-full sm:w-auto">
                                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="hidden sm:inline">Volver al Dashboard</span>
                                <span className="sm:hidden">Volver</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Content Area */}
                {activeKioskOrders.length > 0 ? (
                    <ScrollArea className="h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)]">
                        <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {activeKioskOrders.map(order => (
                                <Link key={order.id} href={`/order/${order.id}`} className="block h-full">
                                    <Card className="flex flex-col h-full transition-all hover:shadow-lg hover:-translate-y-1 min-h-[200px]">
                                        <CardHeader className="pb-3 flex-shrink-0">
                                            <CardTitle className="flex justify-between items-center text-base sm:text-lg">
                                                <span className="truncate">Kiosko #{order.id.slice(-4)}</span>
                                                <span className="text-xs sm:text-sm font-normal flex items-center gap-1 text-muted-foreground flex-shrink-0 ml-2">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(order.createdAt), "HH:mm", { locale: es })}
                                                </span>
                                            </CardTitle>
                                            <CardDescription className="text-xs sm:text-sm">
                                                {order.items.length} {order.items.length === 1 ? 'artículo' : 'artículos'} - Total: ${order.total.toFixed(2)}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1 p-0 px-6 pb-6">
                                            <Separator className="mb-4" />
                                            <ul className="space-y-2 text-xs sm:text-sm">
                                                {order.items.slice(0, 3).map((item, index) => {
                                                    return (
                                                        <li key={`${item.menuItemId}-${index}`} className="flex items-start">
                                                            <Utensils className="h-3 w-3 sm:h-4 sm:w-4 mr-2 mt-0.5 sm:mt-1 text-primary flex-shrink-0" />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-semibold truncate">
                                                                    {getMenuItemName(item.menuItemId)} <span className="font-bold text-primary">x{item.quantity}</span>
                                                                </p>
                                                                {item.notes && (
                                                                    <p className="text-xs text-amber-700 truncate">Nota: {item.notes}</p>
                                                                )}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                                {order.items.length > 3 && (
                                                    <li className="text-xs sm:text-sm text-muted-foreground">
                                                        ...y {order.items.length - 3} más.
                                                    </li>
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
                        <div className="text-center p-4">
                            <Monitor className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-muted-foreground mb-2">No hay pedidos de Kiosko activos.</p>
                            <p className="text-sm text-muted-foreground mb-4">Los pedidos realizados en el autoservicio aparecerán aquí.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
