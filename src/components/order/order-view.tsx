"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/use-app-store';
import { MENU_ITEMS } from '@/lib/data';
import type { Order, OrderItem, MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MinusCircle, Trash2, NotebookPen, Calculator, ArrowLeft, Send } from 'lucide-react';

interface OrderViewProps {
  orderIdOrTableId: string;
}

export default function OrderView({ orderIdOrTableId }: OrderViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addOrUpdateOrder, getOrder, isMounted, currentUser } = useAppStore();
  const [currentOrder, setCurrentOrder] = useState<Partial<Order>>({});
  const [amountReceived, setAmountReceived] = useState('');

  const tableId = useMemo(() => {
    if(orderIdOrTableId === 'takeaway') return 'takeaway';
    if(orderIdOrTableId.startsWith('new-')) return parseInt(orderIdOrTableId.split('-')[1]);
    const existingOrder = getOrder(orderIdOrTableId);
    return existingOrder ? existingOrder.tableId : null;
  }, [orderIdOrTableId, getOrder]);

  useEffect(() => {
    if (!isMounted) return;
    if (!currentUser) router.push('/');

    let initialOrder: Order;
    if (!orderIdOrTableId.startsWith('new-')) {
      initialOrder = getOrder(orderIdOrTableId) as Order;
    }

    if (initialOrder) {
      setCurrentOrder(initialOrder);
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
  }, [orderIdOrTableId, getOrder, router, isMounted, currentUser, tableId]);

  const updateItemQuantity = (menuItemId: number, change: 1 | -1) => {
    setCurrentOrder(prev => {
      const updatedItems = [...(prev.items || [])];
      const itemIndex = updatedItems.findIndex(i => i.menuItemId === menuItemId);

      if (itemIndex > -1) {
        updatedItems[itemIndex].quantity += change;
        if (updatedItems[itemIndex].quantity === 0) {
          updatedItems.splice(itemIndex, 1);
        }
      } else if (change === 1) {
        updatedItems.push({ menuItemId, quantity: 1, notes: '' });
      }
      return { ...prev, items: updatedItems };
    });
  };
  
  const updateItemNotes = (menuItemId: number, notes: string) => {
    setCurrentOrder(prev => {
        const updatedItems = [...(prev.items || [])].map(item => 
            item.menuItemId === menuItemId ? { ...item, notes } : item
        );
        return { ...prev, items: updatedItems };
    });
  };

  const total = useMemo(() => {
    return (currentOrder.items || []).reduce((acc, orderItem) => {
      const menuItem = MENU_ITEMS.find(mi => mi.id === orderItem.menuItemId);
      return acc + (menuItem ? menuItem.price * orderItem.quantity : 0);
    }, 0);
  }, [currentOrder.items]);
  
  const handleFinalizeOrder = () => {
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
    addOrUpdateOrder(orderToSave);
    toast({
        title: "Pedido enviado a cocina",
        description: `El pedido para la mesa ${currentOrder.tableId} ha sido enviado.`,
    });
    router.push('/dashboard');
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
        description: `El pedido para la mesa ${currentOrder.tableId} ha sido finalizado y pagado.`,
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
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center justify-end gap-2 mt-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateItemQuantity(item.id, -1)}>
                                        <MinusCircle className="h-4 w-4" />
                                    </Button>
                                    <span className="font-bold w-4 text-center">
                                        {currentOrder.items?.find(i => i.menuItemId === item.id)?.quantity || 0}
                                    </span>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateItemQuantity(item.id, 1)}>
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
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
                    return (
                        <div key={menuItem.id} className="space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{menuItem.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {orderItem.quantity} x ${menuItem.price.toFixed(2)}
                                    </p>
                                </div>
                                <p className="font-semibold">${(orderItem.quantity * menuItem.price).toFixed(2)}</p>
                            </div>
                            <div className="relative">
                                <NotebookPen className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Notas especiales..."
                                    value={orderItem.notes}
                                    onChange={(e) => updateItemNotes(menuItem.id, e.target.value)}
                                    className="pl-8 text-xs h-9"
                                />
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
          </CardContent>
          <CardFooter className="flex-col space-y-4">
            <div className="flex justify-between w-full text-xl font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full">
              {currentOrder.status !== 'preparing' && (
                <Button size="lg" onClick={handleFinalizeOrder} disabled={!currentOrder.items || currentOrder.items.length === 0}>
                  <Send className="mr-2 h-4 w-4"/> Enviar a Cocina
                </Button>
              )}
              {currentOrder.status === 'preparing' && (
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
