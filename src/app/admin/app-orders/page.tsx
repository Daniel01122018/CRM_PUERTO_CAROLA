"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    Clock,
    User,
    Phone,
    MapPin,
    Package,
    CheckCircle,
    XCircle,
    ChefHat,
    Truck,
    CreditCard,
    Smartphone
} from 'lucide-react';
import { useAppOrders } from '@/hooks/use-app-orders';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { AppOrder, AppOrderStatus } from '@/types/app-orders';
import { APP_ORDER_STATUS_LABELS, APP_ORDER_STATUS_COLORS, APP_ORDER_NEXT_STATES } from '@/types/app-orders';

export default function AppOrdersPage() {
    const router = useRouter();
    const { toast } = useToast();
    const {
        orders,
        activeOrders,
        pendingOrders,
        loading,
        confirmOrder,
        startPreparing,
        markAsReady,
        completeOrder,
        cancelOrder
    } = useAppOrders();

    const [orderToCancel, setOrderToCancel] = useState<AppOrder | null>(null);
    const [orderToComplete, setOrderToComplete] = useState<AppOrder | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'Efectivo' | 'DeUna' | 'Transferencia'>('Efectivo');

    const handleConfirm = async (order: AppOrder) => {
        await confirmOrder(order.id);
        toast({ title: "Pedido confirmado", description: `Pedido de ${order.customerName} confirmado.` });
    };

    const handleStartPreparing = async (order: AppOrder) => {
        await startPreparing(order.id);
        toast({ title: "Preparando pedido", description: `Pedido de ${order.customerName} en preparación.` });
    };

    const handleMarkReady = async (order: AppOrder) => {
        await markAsReady(order.id);
        toast({ title: "Pedido listo", description: `Pedido de ${order.customerName} listo para entrega.` });
    };

    const handleComplete = async () => {
        if (!orderToComplete) return;
        await completeOrder(orderToComplete.id, selectedPaymentMethod);
        toast({ title: "Pedido completado", description: `Pago recibido por ${selectedPaymentMethod}.` });
        setOrderToComplete(null);
        setSelectedPaymentMethod('Efectivo');
    };

    const handleCancel = async () => {
        if (!orderToCancel) return;
        await cancelOrder(orderToCancel.id);
        toast({ title: "Pedido cancelado", variant: "destructive" });
        setOrderToCancel(null);
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeSinceCreated = (timestamp: number) => {
        const minutes = Math.floor((Date.now() - timestamp) / 60000);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ${minutes % 60}m`;
    };

    const renderOrderCard = (order: AppOrder) => {
        const nextStates = APP_ORDER_NEXT_STATES[order.status];
        const isUrgent = order.status === 'pending' && (Date.now() - order.createdAt) > 300000; // 5 min

        return (
            <Card
                key={order.id}
                className={`relative ${isUrgent ? 'ring-2 ring-red-500 animate-pulse' : ''}`}
            >
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <Badge className={APP_ORDER_STATUS_COLORS[order.status]}>
                                {APP_ORDER_STATUS_LABELS[order.status]}
                            </Badge>
                            {order.deliveryType === 'delivery' ? (
                                <Badge variant="outline" className="gap-1">
                                    <Truck className="h-3 w-3" /> Delivery
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="gap-1">
                                    <Package className="h-3 w-3" /> Pickup
                                </Badge>
                            )}
                        </div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getTimeSinceCreated(order.createdAt)}
                        </span>
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2 mt-2">
                        <User className="h-4 w-4" />
                        {order.customerName}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {order.customerPhone}
                        </span>
                        {order.deliveryAddress && (
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {order.deliveryAddress}
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Items */}
                    <div className="space-y-1 mb-4">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span>
                                    <span className="font-medium">{item.quantity}x</span> {item.menuItemName}
                                    {item.notes && <span className="text-muted-foreground ml-1">({item.notes})</span>}
                                </span>
                                <span className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="text-sm text-muted-foreground mb-4 p-2 bg-muted rounded">
                            📝 {order.notes}
                        </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                        <span>Total</span>
                        <span>${order.total.toFixed(2)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                        {order.status === 'pending' && (
                            <>
                                <Button
                                    className="flex-1"
                                    onClick={() => handleConfirm(order)}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Confirmar
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => setOrderToCancel(order)}
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        {order.status === 'confirmed' && (
                            <>
                                <Button
                                    className="flex-1"
                                    onClick={() => handleStartPreparing(order)}
                                >
                                    <ChefHat className="h-4 w-4 mr-2" />
                                    Iniciar Preparación
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => setOrderToCancel(order)}
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        {order.status === 'preparing' && (
                            <Button
                                className="flex-1"
                                onClick={() => handleMarkReady(order)}
                            >
                                <Package className="h-4 w-4 mr-2" />
                                Marcar Listo
                            </Button>
                        )}
                        {order.status === 'ready' && (
                            <Button
                                className="flex-1"
                                onClick={() => setOrderToComplete(order)}
                            >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Completar y Cobrar
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    <span>Cargando pedidos...</span>
                </div>
            </div>
        );
    }

    const completedOrders = orders.filter(o => o.status === 'completed');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');

    return (
        <div className="flex flex-col min-h-screen p-6 gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push('/admin/dashboard')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Smartphone className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl sm:text-3xl font-bold">Pedidos de App</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {pendingOrders.length > 0 && (
                        <Badge className="bg-yellow-500 text-white animate-pulse">
                            {pendingOrders.length} pendiente{pendingOrders.length > 1 ? 's' : ''}
                        </Badge>
                    )}
                    <Badge variant="outline">
                        {activeOrders.length} activo{activeOrders.length !== 1 ? 's' : ''}
                    </Badge>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="active" className="flex-1">
                <TabsList>
                    <TabsTrigger value="active" className="gap-1">
                        Activos
                        {activeOrders.length > 0 && (
                            <Badge variant="secondary" className="ml-1">{activeOrders.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="completed">Completados</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-4">
                    {activeOrders.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg text-muted-foreground">No hay pedidos activos</p>
                            <p className="text-sm text-muted-foreground">Los pedidos nuevos aparecerán aquí automáticamente</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeOrders
                                .sort((a, b) => {
                                    // Pending first, then by createdAt
                                    if (a.status === 'pending' && b.status !== 'pending') return -1;
                                    if (b.status === 'pending' && a.status !== 'pending') return 1;
                                    return a.createdAt - b.createdAt;
                                })
                                .map(renderOrderCard)}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="completed" className="mt-4">
                    {completedOrders.length === 0 ? (
                        <Card className="p-8 text-center">
                            <p className="text-muted-foreground">No hay pedidos completados hoy</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {completedOrders.map(order => (
                                <Card key={order.id} className="opacity-75">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-center">
                                            <Badge className={APP_ORDER_STATUS_COLORS.completed}>
                                                Completado
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {order.completedAt && formatDate(order.completedAt)}
                                            </span>
                                        </div>
                                        <CardTitle className="text-base">{order.customerName}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">{order.items.length} items</span>
                                            <span className="font-bold">${order.total.toFixed(2)}</span>
                                        </div>
                                        <Badge variant="outline" className="mt-2">
                                            {order.paymentMethod}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="cancelled" className="mt-4">
                    {cancelledOrders.length === 0 ? (
                        <Card className="p-8 text-center">
                            <p className="text-muted-foreground">No hay pedidos cancelados</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cancelledOrders.map(order => (
                                <Card key={order.id} className="opacity-50">
                                    <CardHeader className="pb-2">
                                        <Badge className={APP_ORDER_STATUS_COLORS.cancelled}>
                                            Cancelado
                                        </Badge>
                                        <CardTitle className="text-base">{order.customerName}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">{order.items.length} items</span>
                                            <span className="line-through">${order.total.toFixed(2)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas cancelar el pedido de {orderToCancel?.customerName}?
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
                            Cancelar Pedido
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Complete Order Dialog */}
            <Dialog open={!!orderToComplete} onOpenChange={() => setOrderToComplete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Completar Pedido</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="mb-4">
                            Pedido de <strong>{orderToComplete?.customerName}</strong>
                        </p>
                        <p className="text-2xl font-bold mb-4">
                            Total: ${orderToComplete?.total.toFixed(2)}
                        </p>

                        <Label className="text-base font-medium">Método de pago</Label>
                        <RadioGroup
                            value={selectedPaymentMethod}
                            onValueChange={(v) => setSelectedPaymentMethod(v as any)}
                            className="mt-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Efectivo" id="efectivo" />
                                <Label htmlFor="efectivo">Efectivo</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="DeUna" id="deuna" />
                                <Label htmlFor="deuna">DeUna</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Transferencia" id="transferencia" />
                                <Label htmlFor="transferencia">Transferencia</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOrderToComplete(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleComplete}>
                            Confirmar Pago
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
