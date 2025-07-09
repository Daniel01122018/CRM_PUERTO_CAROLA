"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/use-app-store';
import { MENU_ITEMS } from '@/lib/data';
import type { Order, OrderItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  const [currentOrder, setCurrentOrder] = useState<Partial<Order>>({});
  const [amountReceived, setAmountReceived] = useState('');

  const tableId = useMemo(() => {
    if(orderIdOrTableId === 'takeaway') return 'takeaway';
    if(orderIdOrTableId.startsWith('new-')) return parseInt(orderIdOrTableId.split('-')[1]);
    
    const existingOrder = orders.find(o => o.id === orderIdOrTableId);
    return existingOrder ? existingOrder.tableId : null;
  }, [orderIdOrTableId, orders]);

  // Effect 1: Initialize the component state. It runs when the order/table ID changes.
  useEffect(() => {
    if (!isMounted) return;
    if (!currentUser) {
      router.push('/');
      return;
    }

    const orderToLoad = orders.find(o => 
        (o.id === orderIdOrTableId) || 
        (o.tableId === tableId && (o.status !== 'completed'))
    );
    
    if (orderToLoad) {
        setCurrentOrder(orderToLoad);
    } else {
        const newOrderId = Date.now().toString();
        setCurrentOrder({
            id: newOrderId,
            tableId: tableId,
            items: [],
            status: 'active',
            createdAt: Date.now(),
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderIdOrTableId, isMounted, currentUser, router]);

  // Effect 2: Persist local changes to the global store.
  useEffect(() => {
    if (!isMounted || !currentOrder.id || !currentUser) {
      return;
    }
    const orderInStore = orders.find(o => o.id === currentOrder.id);
    
    // Prevent writing if the state is identical
    if (JSON.stringify(orderInStore) === JSON.stringify(currentOrder)) {
        return;
    }

    const hasItems = currentOrder.items && currentOrder.items.length > 0;
    
    if (hasItems) {
      addOrUpdateOrder(currentOrder as Order);
    } else if (orderInStore) {
      // Only remove if it was previously in the store
      removeOrder(currentOrder.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrder, isMounted, currentUser]);


  const updateItemQuantity = (menuItemId: number, change: number, notes: string = '') => {
    setCurrentOrder(prev => {
      const prevItems = prev.items || [];
      const itemIndex = prevItems.findIndex(i => i.menuItemId === menuItemId && i.notes === notes);
      
      let newItems = [...prevItems];

      if (itemIndex > -1) {
        const updatedItem = {
          ...newItems[itemIndex],
          quantity: newItems[itemIndex].quantity + change,
        };

        if (updatedItem.quantity <= 0) {
          newItems = newItems.filter((_, index) => index !== itemIndex);
        } else {
          newItems[itemIndex] = updatedItem;
        }
      } else if (change > 0) {
        const newItem: OrderItem = { menuItemId, quantity: change, notes };
        newItems.push(newItem);
      }
      
      return {...prev, items: newItems};
    });
  };

  const updateItemNotes = (menuItemId: number, oldNotes: string, newNotes: string) => {
    setCurrentOrder(prev => {
      const prevItems = prev.items || [];
      const itemIndex = prevItems.findIndex(i => i.menuItemId === menuItemId && i.notes === oldNotes);

      if (itemIndex > -1) {
        return {
          ...prev,
          items: prevItems.map((item, index) =>
            index === itemIndex ? { ...item, notes: newNotes } : item
          ),
        };
      }
      
      return prev;
    });
  };

  const total = useMemo(() => {
    return (currentOrder.items || []).reduce((acc, orderItem) => {
      const menuItem = MENU_ITEMS.find(mi => mi.id === orderItem.menuItemId);
      return acc + (menuItem ? menuItem.precio * orderItem.quantity : 0);
    }, 0);
  }, [currentOrder.items]);
  
  const handleSendToKitchen = () => {
    if (!currentOrder.id || !currentOrder.items || currentOrder.items.length === 0) {
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
    
    setCurrentOrder(orderToSave); // Update local state first
    addOrUpdateOrder(orderToSave); // Then persist to global

    toast({
        title: "Pedido enviado a cocina",
        description: `El pedido para la ${currentOrder.tableId === 'takeaway' ? 'llevar' : 'mesa ' + currentOrder.tableId} ha sido enviado.`,
    });

    if (currentOrder.tableId !== 'takeaway') {
      router.push('/dashboard');
    }
  };

  const handleCompleteAndPay = () => {
     if (!currentOrder.id) return;
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

  if (!isMounted || !currentOrder.id) {
    return <div>Cargando pedido...</div>;
  }
  
  const menuCategories = [...new Set(MENU_ITEMS.map(item => item.category))];

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
            <ScrollArea className="h-[40vh]">
              {currentOrder.items && currentOrder.items.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {currentOrder.items.map(orderItem => {
                    const menuItem = MENU_ITEMS.find(mi => mi.id === orderItem.menuItemId);
                    if (!menuItem) return null;
                    const itemKey = `${menuItem.id}-${orderItem.notes}`;
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
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(menuItem.id, -orderItem.quantity, orderItem.notes)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(menuItem.id, -1, orderItem.notes)}>
                                    <MinusCircle className="h-4 w-4" />
                                </Button>
                                <span className="font-bold text-sm">{orderItem.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(menuItem.id, 1, orderItem.notes)}>
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </div>
                            { !menuItem.sabores &&
                              <Input 
                                  placeholder="Añadir nota..."
                                  value={orderItem.notes}
                                  onChange={(e) => updateItemNotes(menuItem.id, orderItem.notes, e.target.value)}
                                  className="text-xs h-9"
                              />
                            }
                            <Separator/>
                        </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Añade artículos del menú para empezar.</p>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex-col space-y-4">
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
                <Button size="lg" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Pedido en preparación...
                </Button>
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
