"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Phone, MapPin, Package, CheckCircle, XCircle, ChefHat, Truck, CreditCard, Smartphone, DollarSign, Calendar } from 'lucide-react';
import { useAppOrders } from '@/hooks/use-app-orders';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { AppOrder } from '@/types/app-orders';
import { APP_ORDER_STATUS_LABELS, APP_ORDER_STATUS_COLORS } from '@/types/app-orders';
import { cn } from '@/lib/utils';

export default function AppOrdersContent() {
    const { toast } = useToast();
    const { orders, activeOrders, pendingOrders, loading, processingOrders, confirmOrder, startPreparing, markAsReady, completeOrder, cancelOrder } = useAppOrders();

    const [orderToCancel, setOrderToCancel] = useState<AppOrder | null>(null);
    const [orderToComplete, setOrderToComplete] = useState<AppOrder | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'Efectivo' | 'DeUna' | 'Transferencia'>('Efectivo');

    const handleConfirm = async (order: AppOrder) => {
        await confirmOrder(order.id);
        toast({ title: "Pedido confirmado", className: "bg-green-500 text-white" });
    };

    const handleStartPreparing = async (order: AppOrder) => {
        await startPreparing(order.id);
        toast({ title: "En preparación" });
    };

    const handleMarkReady = async (order: AppOrder) => {
        await markAsReady(order.id);
        toast({ title: "Pedido listo para entrega" });
    };

    const handleComplete = async () => {
        if (!orderToComplete) return;
        await completeOrder(orderToComplete.id, selectedPaymentMethod);
        toast({ title: "Pedido completado exitosamente" });
        setOrderToComplete(null);
        setSelectedPaymentMethod('Efectivo');
    };

    const isProcessing = (orderId: string) => processingOrders.has(orderId);

    const handleCancel = async () => {
        if (!orderToCancel) return;
        await cancelOrder(orderToCancel.id);
        toast({ title: "Pedido cancelado", variant: "destructive" });
        setOrderToCancel(null);
    };

    const getTimeSinceCreated = (timestamp: number) => {
        const minutes = Math.floor((Date.now() - timestamp) / 60000);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ${minutes % 60}m`;
    };

    // New Card Component for Kanban
    const KanbanOrderCard = ({ order }: { order: AppOrder }) => {
        const isUrgent = order.status === 'pending' && (Date.now() - order.createdAt) > 300000;

        return (
            <Card className={cn(
                "group relative overflow-hidden transition-all hover:shadow-md border-l-4",
                isUrgent ? "border-l-red-500 ring-1 ring-red-500/20" : "border-l-primary/50"
            )}>
                <div className="absolute top-2 right-2 text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    {getTimeSinceCreated(order.createdAt)}
                </div>

                <CardContent className="p-4 pt-5 space-y-3">
                    {/* Header Info */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-base flex items-center gap-2">
                                {order.customerName}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                {order.deliveryType === 'delivery'
                                    ? <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Delivery</span>
                                    : <span className="flex items-center gap-1"><Package className="h-3 w-3" /> Pickup</span>
                                }
                                <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {order.customerPhone}</span>
                            </div>
                        </div>
                    </div>

                    {/* Items Summary (Compact) */}
                    <div className="bg-muted/10 rounded-lg p-2 space-y-1 border border-border/50 text-sm">
                        {order.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start">
                                <span className="text-muted-foreground line-clamp-1"><span className="font-semibold text-foreground">{item.quantity}x</span> {item.menuItemName}</span>
                            </div>
                        ))}
                        {order.items.length > 3 && (
                            <p className="text-xs text-muted-foreground pt-1 border-t border-border/50 text-center">
                                +{order.items.length - 3} items más...
                            </p>
                        )}
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/50 font-medium">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        {order.status === 'pending' && (
                            <>
                                <Button
                                    size="sm"
                                    className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleConfirm(order)}
                                    disabled={isProcessing(order.id)}
                                >
                                    {isProcessing(order.id) ? 'Procesando...' : 'Confirmar'}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                                    onClick={() => setOrderToCancel(order)}
                                    disabled={isProcessing(order.id)}
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        {order.status === 'confirmed' && (
                            <Button
                                size="sm"
                                className="flex-1 h-8"
                                variant="secondary"
                                onClick={() => handleStartPreparing(order)}
                                disabled={isProcessing(order.id)}
                            >
                                {isProcessing(order.id) ? 'Procesando...' : 'Empezar Cocina'}
                            </Button>
                        )}
                        {order.status === 'preparing' && (
                            <Button
                                size="sm"
                                className="flex-1 h-8 bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200"
                                variant="outline"
                                onClick={() => handleMarkReady(order)}
                                disabled={isProcessing(order.id)}
                            >
                                {isProcessing(order.id) ? 'Procesando...' : 'Marcar Listo'}
                            </Button>
                        )}
                        {order.status === 'ready' && (
                            <Button
                                size="sm"
                                className="flex-1 h-8"
                                onClick={() => setOrderToComplete(order)}
                                disabled={isProcessing(order.id)}
                            >
                                {isProcessing(order.id) ? 'Procesando...' : 'Finalizar Entrega'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-pulse">
            <Smartphone className="h-10 w-10 mb-4 opacity-50" />
            <p>Sincronizando pedidos...</p>
        </div>
    );

    // Group active orders by status for Kanban columns
    const pending = activeOrders.filter(o => o.status === 'pending').sort((a, b) => a.createdAt - b.createdAt);
    const inProgress = activeOrders.filter(o => o.status === 'confirmed' || o.status === 'preparing').sort((a, b) => a.createdAt - b.createdAt);
    const ready = activeOrders.filter(o => o.status === 'ready').sort((a, b) => a.createdAt - b.createdAt);

    return (
        <div className="flex flex-col h-full gap-6">

            {/* Kanban Board Layout */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-6 min-w-[1000px] h-full pb-4">

                    {/* Column: Pending */}
                    <div className="flex-1 flex flex-col gap-4 min-w-[300px]">
                        <div className="flex items-center justify-between pb-2 border-b-2 border-yellow-400">
                            <h3 className="font-bold flex items-center gap-2"><Clock className="h-4 w-4 text-yellow-600" /> Pendientes</h3>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-none">{pending.length}</Badge>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-4">
                            <div className="space-y-3 pb-8">
                                {pending.length === 0 ? (
                                    <div className="text-center p-8 border-2 border-dashed rounded-xl text-muted-foreground/50">
                                        <p className="text-sm">Sin pedidos pendientes</p>
                                    </div>
                                ) : pending.map(order => <KanbanOrderCard key={order.id} order={order} />)}
                            </div>
                        </div>
                    </div>

                    {/* Column: Kitchen */}
                    <div className="flex-1 flex flex-col gap-4 min-w-[300px]">
                        <div className="flex items-center justify-between pb-2 border-b-2 border-blue-400">
                            <h3 className="font-bold flex items-center gap-2"><ChefHat className="h-4 w-4 text-blue-600" /> En Cocina</h3>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none">{inProgress.length}</Badge>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-4">
                            <div className="space-y-3 pb-8">
                                {inProgress.length === 0 ? (
                                    <div className="text-center p-8 border-2 border-dashed rounded-xl text-muted-foreground/50">
                                        <p className="text-sm">Cocina libre</p>
                                    </div>
                                ) : inProgress.map(order => <KanbanOrderCard key={order.id} order={order} />)}
                            </div>
                        </div>
                    </div>

                    {/* Column: Ready */}
                    <div className="flex-1 flex flex-col gap-4 min-w-[300px]">
                        <div className="flex items-center justify-between pb-2 border-b-2 border-green-400">
                            <h3 className="font-bold flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Listos</h3>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-none">{ready.length}</Badge>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-4">
                            <div className="space-y-3 pb-8">
                                {ready.length === 0 ? (
                                    <div className="text-center p-8 border-2 border-dashed rounded-xl text-muted-foreground/50">
                                        <p className="text-sm">Nada por entregar</p>
                                    </div>
                                ) : ready.map(order => <KanbanOrderCard key={order.id} order={order} />)}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Dialogs */}
            <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
                        <AlertDialogDescription>¿Cancelar pedido de {orderToCancel?.customerName}?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/90">Cancelar Pedido</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!orderToComplete} onOpenChange={() => setOrderToComplete(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Completar y Cobrar</DialogTitle></DialogHeader>
                    <div className="py-4">
                        <div className="bg-muted/30 p-4 rounded-lg mb-6 text-center">
                            <p className="text-sm text-muted-foreground mb-1">Total a Pagar</p>
                            <p className="text-4xl font-bold tracking-tight text-primary">${orderToComplete?.total.toFixed(2)}</p>
                        </div>
                        <Label className="text-base font-medium mb-3 block">Método de pago</Label>
                        <RadioGroup value={selectedPaymentMethod} onValueChange={(v) => setSelectedPaymentMethod(v as any)} className="grid grid-cols-3 gap-4">
                            <div>
                                <RadioGroupItem value="Efectivo" id="efectivo" className="peer sr-only" />
                                <Label htmlFor="efectivo" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                    <DollarSign className="mb-2 h-6 w-6" />
                                    Efectivo
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="DeUna" id="deuna" className="peer sr-only" />
                                <Label htmlFor="deuna" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                    <Smartphone className="mb-2 h-6 w-6" />
                                    DeUna
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="Transferencia" id="transferencia" className="peer sr-only" />
                                <Label htmlFor="transferencia" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                    <CreditCard className="mb-2 h-6 w-6" />
                                    Transf.
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOrderToComplete(null)}>Cancelar</Button>
                        <Button
                            onClick={handleComplete}
                            className="w-full sm:w-auto"
                            disabled={orderToComplete ? isProcessing(orderToComplete.id) : false}
                        >
                            {orderToComplete && isProcessing(orderToComplete.id) ? 'Procesando...' : 'Confirmar Pago'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
