"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/use-app-store';
import { MENU_ITEMS } from '@/lib/data';
import type { Order, OrderItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MinusCircle, Trash2, Calculator, ArrowLeft, Send, Plus, Loader2 } from 'lucide-react';

interface OrderViewProps {
  orderIdOrTableId: string;
}

export default function OrderView({ orderIdOrTableId }: OrderViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addOrUpdateOrder, removeOrder, isMounted, currentUser, orders } = useAppStore();
  const [currentOrder, setCurrentOrder] = useState<Partial<Order> | null>(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [sentItems, setSentItems] = useState<OrderItem[]>([]);
  const [hasUnsentChanges, setHasUnsentChanges] = useState(false);


  // Effect to load or initialize the order.
  useEffect(() => {
    if (!isMounted || !currentUser) {
      if (isMounted) router.push('/');
      return;
    }

    let resolvedTableId: number | 'takeaway' | null = null;
    let orderIdToFind: string | undefined = undefined;

    if (orderIdOrTableId === 'takeaway') {
      resolvedTableId = 'takeaway';
    } else if (orderIdOrTableId.startsWith('new-')) {
      resolvedTableId = parseInt(orderIdOrTableId.split('-')[1], 10);
    } else {
      orderIdToFind = orderIdOrTableId;
    }
    
    const existingOrder = orders.find(o => 
      o.id === orderIdToFind || 
      (resolvedTableId && o.tableId === resolvedTableId && o.status !== 'completed')
    );

    if (existingOrder) {
      setCurrentOrder(existingOrder);
       if (existingOrder.status !== 'active') {
        setSentItems(existingOrder.items);
      }
    } else if (resolvedTableId) {
      setCurrentOrder({
        id: Date.now().toString(),
        tableId: resolvedTableId,
        items: [],
        status: 'active',
        createdAt: Date.now(),
        notes: '',
      });
    }
    setHasUnsentChanges(false);
  }, [orderIdOrTableId, isMounted, currentUser, orders, router]);


  const updateItemQuantity = (menuItemId: number, change: number, notes: string = '') => {
    if (!currentOrder) return;

    const isAlreadySent = sentItems.some(item => item.menuItemId === menuItemId && item.notes === notes);

    if (change < 0 && isAlreadySent) {
      toast({
        variant: "destructive",
        title: "Acción no permitida",
        description: "No se puede eliminar o reducir un artículo que ya fue enviado a cocina.",
      });
      return;
    }

    setCurrentOrder(prev => {
      if (!prev) return null;
      const prevItems = prev.items || [];
      const itemIndex = prevItems.findIndex(i => i.menuItemId === menuItemId && i.notes === notes);
      
      let newItems = [...prevItems];

      if (itemIndex > -1) {
        const updatedItem = {
          ...newItems[itemIndex],
          quantity: newItems[itemIndex].quantity + change,
        };

        if (updatedItem.quantity <= 0) {
          newItems.splice(itemIndex, 1);
        } else {
          newItems[itemIndex] = updatedItem;
        }
      } else if (change > 0) {
        const newItem: OrderItem = { menuItemId, quantity: change, notes };
        newItems.push(newItem);
      }
      
      const newOrderState = { ...prev, items: newItems };
      addOrUpdateOrder(newOrderState as Order);
      if (prev.status !== 'active') {
        setHasUnsentChanges(true);
      }
      return newOrderState;
    });
  };

  const total = useMemo(() => {
    if (!currentOrder || !currentOrder.items) return 0;
    return currentOrder.items.reduce((acc, orderItem) => {
      const menuItem = MENU_ITEMS.find(mi => mi.id === orderItem.menuItemId);
      return acc + (menuItem ? menuItem.precio * orderItem.quantity : 0);
    }, 0);
  }, [currentOrder]);
  
  const handleSendToKitchen = () => {
    if (!currentOrder || !currentOrder.id || !currentOrder.items || currentOrder.items.length === 0) {
        toast({
            variant: "destructive",
            title: "Pedido vacío",
            description: "No se puede enviar un pedido sin artículos.",
        });
        return;
    }
    const orderToSave: Order = {
        ...currentOrder,
        total,
        status: 'preparing',
    } as Order;
    
    addOrUpdateOrder(orderToSave);
    setSentItems(orderToSave.items);
    setHasUnsentChanges(false);


    toast({
        title: "Pedido enviado a cocina",
        description: `El pedido para la ${currentOrder.tableId === 'takeaway' ? 'llevar' : 'mesa ' + currentOrder.tableId} ha sido enviado.`,
    });

    if (currentOrder.tableId !== 'takeaway') {
      router.push('/dashboard');
    } else {
      const readyOrder = {...orderToSave, status: 'ready'} as Order;
      addOrUpdateOrder(readyOrder);
      setCurrentOrder(readyOrder);
    }
  };

  const handleSendUpdateToKitchen = () => {
    if (!currentOrder || !currentOrder.id || !currentOrder.items) return;
    const orderToSave: Order = { ...currentOrder, total } as Order;
    addOrUpdateOrder(orderToSave);
    setSentItems(orderToSave.items);
    setHasUnsentChanges(false);
    toast({
      title: "Actualización enviada",
      description: "Nuevos artículos enviados a cocina.",
    });
    router.push('/dashboard');
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentOrder) return;
    const newOrderState = { ...currentOrder, notes: e.target.value };
    setCurrentOrder(newOrderState);
    addOrUpdateOrder(newOrderState as Order);
  };

  const handleCompleteAndPay = () => {
     if (!currentOrder || !currentOrder.id) return;
     const orderToSave: Order = {
        ...currentOrder,
        total,
        status: 'completed',
    } as Order;
    addOrUpdateOrder(orderToSave);
    toast({
        title: "Pedido completado",
        description: `El pedido para la ${currentOrder.tableId === 'takeaway' ? 'llevar' : 'mesa ' + currentOrder.tableId} ha sido finalizado y pagado.`,
    });
    router.push('/dashboard');
  }

  if (!isMounted || !currentOrder) {
    return <div>Cargando pedido...</div>;
  }
  
  const menuCategories = [...new Set(MENU_ITEMS.map(item => item.category))];
  const tableId = currentOrder.tableId;

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Menú</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6 pr-4">
                {menuCategories.map(category => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-2">{category}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {MENU_ITEMS.filter(item => item.category === category).map(item => (
                        <Card key={item.id} className="overflow-hidden">
                           <CardContent className="p-4 flex flex-col justify-between h-full">
                                <div>
                                    <p className="font-semibold">{item.nombre}</p>
                                    <p className="text-sm text-muted-foreground">${item.precio.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center justify-end gap-2 mt-2">
                                    {item.sabores ? (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Añadir
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto">
                                                <div className="flex flex-col gap-2">
                                                    <p className="font-semibold text-sm">Seleccione un sabor:</p>
                                                    {item.sabores.map(sabor => (
                                                        <Button key={sabor} variant="ghost" className="justify-start" onClick={() => updateItemQuantity(item.id, 1, sabor)}>
                                                            {sabor}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    ) : (
                                        <>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateItemQuantity(item.id, -1, '')}>
                                                <MinusCircle className="h-4 w-4" />
                                            </Button>
                                            <span className="font-bold w-4 text-center">
                                                {currentOrder.items?.find(i => i.menuItemId === item.id && (i.notes === '' || !i.notes))?.quantity || 0}
                                            </span>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateItemQuantity(item.id, 1, '')}>
                                                <PlusCircle className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Pedido: {tableId === 'takeaway' ? 'Para Llevar' : `Mesa ${tableId}`}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[30vh]">
              {currentOrder.items && currentOrder.items.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {currentOrder.items.map((orderItem, index) => {
                    const menuItem = MENU_ITEMS.find(mi => mi.id === orderItem.menuItemId);
                    if (!menuItem) return null;
                    const itemKey = `${menuItem.id}-${orderItem.notes || index}`;
                    const isSent = sentItems.some(sentItem => sentItem.menuItemId === orderItem.menuItemId && sentItem.notes === orderItem.notes);
                    return (
                        <div key={itemKey} className="space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{menuItem.nombre} {orderItem.notes ? `(${orderItem.notes})` : ''}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {orderItem.quantity} x ${menuItem.precio.toFixed(2)}
                                    </p>
                                </div>
                                <p className="font-semibold">${(orderItem.quantity * menuItem.precio).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(menuItem.id, -1, orderItem.notes)} disabled={isSent}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(menuItem.id, -1, orderItem.notes)} disabled={isSent}>
                                    <MinusCircle className="h-4 w-4" />
                                </Button>
                                <span className="font-bold text-sm">{orderItem.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(menuItem.id, 1, orderItem.notes)}>
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </div>
                            <Separator/>
                        </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Añade artículos del menú para empezar.</p>
              )}
            </ScrollArea>
            <div className="space-y-1 pt-4 pr-4">
                <label htmlFor="order-notes" className="text-sm font-medium">Notas Generales</label>
                <Textarea
                    id="order-notes"
                    placeholder={currentOrder.status !== 'active' ? "Las notas no se pueden editar una vez enviado el pedido." : "Añadir notas para la cocina (ej. alergias, sin picante, etc.)"}
                    value={currentOrder.notes || ''}
                    onChange={handleNotesChange}
                    className="mt-1"
                    disabled={currentOrder.status !== 'active'}
                />
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-4 pt-4">
            <div className="flex justify-between w-full text-xl font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full">
               {currentOrder.status === 'active' && (
                <Button size="lg" onClick={handleSendToKitchen} disabled={!currentOrder.items || currentOrder.items.length === 0}>
                  <Send className="mr-2 h-4 w-4"/> Enviar a Cocina
                </Button>
              )}
              {currentOrder.status === 'preparing' && (
                <>
                  {hasUnsentChanges ? (
                    <Button size="lg" onClick={handleSendUpdateToKitchen}>
                      <Send className="mr-2 h-4 w-4" /> Enviar Actualización a Cocina
                    </Button>
                  ) : (
                    <Button size="lg" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Pedido en preparación...
                    </Button>
                  )}
                </>
              )}
              {currentOrder.status === 'ready' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="lg" variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                        <Calculator className="mr-2 h-4 w-4"/> Finalizar y Cobrar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Calcular Cambio</AlertDialogTitle>
                        <AlertDialogDescription>
                            El total del pedido es <strong>${total.toFixed(2)}</strong>. Ingrese el monto recibido para calcular el cambio.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-2">
                        <label htmlFor="amount-received" className="text-sm font-medium">Monto Recibido</label>
                        <Input 
                            id="amount-received"
                            type="number"
                            placeholder="e.g., 50.00"
                            value={amountReceived}
                            onChange={(e) => setAmountReceived(e.target.value)}
                        />
                         {parseFloat(amountReceived) >= total && (
                             <p className="text-lg font-bold text-primary">
                                Cambio a entregar: ${(parseFloat(amountReceived) - total).toFixed(2)}
                             </p>
                         )}
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCompleteAndPay} disabled={parseFloat(amountReceived) < total}>Confirmar Pago</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              )}
              <Button size="lg" variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4"/> Volver al Salón
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
