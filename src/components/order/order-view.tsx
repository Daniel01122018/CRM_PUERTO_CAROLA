"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/use-app-store';
import { MENU_ITEMS } from '@/lib/data';
import type { Order, OrderItem, MenuItem, PaymentMethod } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MinusCircle, Trash2, ArrowLeft, Send, Plus, XCircle, CreditCard, Smartphone, Banknote } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface OrderViewProps {
  orderIdOrTableId: string;
}
export default function OrderView({ orderIdOrTableId }: OrderViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addOrUpdateOrder, cancelOrder, isMounted, currentUser, orders } = useAppStore();
  const [currentOrder, setCurrentOrder] = useState<Partial<Order> | null>(null);
  const [sentItems, setSentItems] = useState<OrderItem[]>([]);
  const [hasUnsentChanges, setHasUnsentChanges] = useState(false);
  
  const [customPrice, setCustomPrice] = useState('');
  const [isCustomPriceDialogOpen, setIsCustomPriceDialogOpen] = useState(false);
  const [customPriceItem, setCustomPriceItem] = useState<MenuItem | null>(null);
  
  const [openFlavorPopoverId, setOpenFlavorPopoverId] = useState<number | null>(null);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);

  const availableMenuItems = useMemo(() => {
    if (!currentOrder) return [];
    const isTakeaway = currentOrder.tableId === 'takeaway';
    return isTakeaway 
        ? MENU_ITEMS 
        : MENU_ITEMS.filter(item => !item.takeawayOnly);
  }, [currentOrder]);

  const menuCategories = useMemo(() => [...new Set(availableMenuItems.map(item => item.category))], [availableMenuItems]);

  useEffect(() => {
    if (!isMounted) return;
    if (!currentUser) {
      router.push('/');
      return;
    }

    if (orderIdOrTableId.startsWith('new-')) {
      const type = orderIdOrTableId.substring(4); 
      let tableId: number | 'takeaway';
      if (type !== 'takeaway') {
         tableId = parseInt(type, 10);
         const existingOrderForTable = orders.find(o => o.tableId === tableId && (o.status === 'active' || o.status === 'preparing'));
         if (existingOrderForTable) {
            router.push(`/order/${existingOrderForTable.id}`);
            return;
         }
      } else {
        tableId = 'takeaway';
      }

      setCurrentOrder({
        id: Date.now().toString(),
        tableId: tableId,
        items: [],
        status: 'active',
        createdAt: Date.now(),
        total: 0,
        notes: '',
        partialPayments: [],
        partialPaymentsTotal: 0,
      });
      setSentItems([]);
      setHasUnsentChanges(false);
    } 
    else {
      const existingOrder = orders.find(o => o.id === orderIdOrTableId);
      
      if (existingOrder) {
          setCurrentOrder(existingOrder);
          // Sent items are items that were part of the order when it was last set to 'preparing'
          const lastSentItems = existingOrder.status === 'preparing' || existingOrder.status === 'completed'
            ? existingOrder.items 
            : [];
          setSentItems(lastSentItems);
      } else {
        // If order is not found, it might be completed or cancelled, redirect
        toast({
          variant: "destructive",
          title: "Pedido no encontrado",
          description: "El pedido que intentas abrir ya no está activo.",
        });
        if (orderIdOrTableId.includes('takeaway')) {
            router.push('/takeaway');
        } else {
            router.push('/dashboard');
        }
      }
    }
  }, [orderIdOrTableId, isMounted, currentUser, orders, router, toast]);

  useEffect(() => {
    if (currentOrder?.status !== 'active') {
        setHasUnsentChanges(false);
    }
  }, [currentOrder?.status]);

  const total = useMemo(() => {
    if (!currentOrder || !currentOrder.items) return 0;
    return currentOrder.items.reduce((acc, orderItem) => {
      const menuItem = MENU_ITEMS.find(mi => mi.id === orderItem.menuItemId);
      const price = orderItem.customPrice || (menuItem ? menuItem.precio : 0);
      return acc + (price * orderItem.quantity);
    }, 0);
  }, [currentOrder]);
  
  const remainingAmountToPay = useMemo(() => {
      return total - (currentOrder?.partialPaymentsTotal || 0);
  }, [total, currentOrder?.partialPaymentsTotal]);

  useEffect(() => {
    const received = parseFloat(amountReceived);
    if (!isNaN(received) && received >= remainingAmountToPay) {
      setChange(received - remainingAmountToPay);
    } else {
      setChange(0);
    }
  }, [amountReceived, remainingAmountToPay]);


  const updateItemQuantity = (menuItemId: number, change: number, notes: string = '') => {
    if (!currentOrder) return;
    setCurrentOrder(prev => {
      if (!prev) return null;
      const prevItems = prev.items || [];
      const itemIndex = prevItems.findIndex(i => i.menuItemId === menuItemId && i.notes === notes && !i.customPrice);
      let newItems = [...prevItems];
      if (itemIndex > -1) {
        const newQuantity = newItems[itemIndex].quantity + change;
        if (newQuantity <= 0) {
          newItems.splice(itemIndex, 1);
        } else {
          newItems[itemIndex] = {...newItems[itemIndex], quantity: newQuantity};
        }
      } else if (change > 0) {
        const newItem: OrderItem = { menuItemId, quantity: change, notes };
        newItems.push(newItem);
      }

      setHasUnsentChanges(true);

      return { ...prev, items: newItems };
    });
  };
  
  const removeItemByIndex = (itemIndex: number) => {
    if (!currentOrder) return;
    setCurrentOrder(prev => {
        if (!prev) return null;
        const newItems = [...(prev.items || [])];
        const itemToRemove = newItems[itemIndex];
        const sentItem = sentItems.find(i => i.menuItemId === itemToRemove.menuItemId && i.notes === itemToRemove.notes && i.customPrice === itemToRemove.customPrice);
        if (sentItem) {
            toast({ variant: "destructive", title: "Acción no permitida", description: "No se puede eliminar un artículo que ya fue enviado a cocina." });
            return prev;
        }
        newItems.splice(itemIndex, 1);
        setHasUnsentChanges(true);
        return { ...prev, items: newItems };
    });
  }

  const updateQuantityByIndex = (itemIndex: number, change: number) => {
    if (!currentOrder) return;
    setCurrentOrder(prev => {
        if (!prev) return null;
        const newItems = [...(prev.items || [])];
        const itemToUpdate = newItems[itemIndex];
        const sentItem = sentItems.find(i => i.menuItemId === itemToUpdate.menuItemId && i.notes === itemToUpdate.notes);
        
        let sentQuantity = 0;
        if (sentItem) {
          sentQuantity = sentItem.quantity;
        }

        const newQuantity = itemToUpdate.quantity + change;

        if (newQuantity < sentQuantity) {
            toast({ variant: "destructive", title: "Acción no permitida", description: "No se puede reducir la cantidad de un artículo ya enviado." });
            return prev;
        }

        if (newQuantity <= 0) {
            if (sentItem) {
                 toast({ variant: "destructive", title: "Acción no permitida", description: "No se puede eliminar un artículo que ya fue enviado a cocina." });
                 return prev;
            }
            newItems.splice(itemIndex, 1);
        } else {
            newItems[itemIndex] = { ...itemToUpdate, quantity: newQuantity };
        }
        setHasUnsentChanges(true);
        return { ...prev, items: newItems };
    });
  }

  const handleAddCustomPriceItem = () => {
    if (!customPriceItem) return;
    const price = parseFloat(customPrice);
    if (isNaN(price) || price <= 0) {
         toast({
            variant: "destructive",
            title: "Precio inválido",
            description: "Por favor, ingrese un monto mayor a cero.",
        });
        return;
    }
    setCurrentOrder(prev => {
        if (!prev) return null;
        const newItem: OrderItem = {
            menuItemId: customPriceItem.id,
            quantity: 1,
            notes: '',
            customPrice: price,
        };
        const newItems = [...(prev.items || []), newItem];
        setHasUnsentChanges(true);
        return { ...prev, items: newItems };
    });
    setCustomPrice('');
    setCustomPriceItem(null);
    setIsCustomPriceDialogOpen(false);
  }

  
  const handleSendToKitchen = () => {
    if (!currentOrder || !currentOrder.id || !currentOrder.items || currentOrder.items.length === 0) {
        toast({ variant: "destructive", title: "Pedido vacío", description: "No se puede enviar un pedido sin artículos." });
        return;
    }
    const orderToSave: Order = { ...currentOrder, total, status: 'preparing' } as Order;
    addOrUpdateOrder(orderToSave);
    
    toast({ title: "Pedido enviado a cocina", description: `El pedido para la ${currentOrder.tableId === 'takeaway' ? 'llevar' : 'mesa ' + currentOrder.tableId} ha sido enviado.` });
    
    if (currentOrder.tableId === 'takeaway') router.push('/takeaway');
    else router.push('/dashboard');
  };

  const handleSendUpdateToKitchen = () => {
    if (!currentOrder || !currentOrder.id || !currentOrder.items) return;
    const orderToSave: Order = { ...currentOrder, total } as Order;
    addOrUpdateOrder(orderToSave);
    
    toast({ title: "Actualización enviada", description: "Nuevos artículos enviados a cocina." });
    if (currentOrder.tableId === 'takeaway') router.push('/takeaway');
    else router.push('/dashboard');
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentOrder) return;
    setCurrentOrder({ ...currentOrder, notes: e.target.value });
    setHasUnsentChanges(true);
  };
  
  const handleFullPayment = (paymentMethod: PaymentMethod) => {
     if (!currentOrder || !currentOrder.id) return;
     const orderToSave: Order = { ...currentOrder, total, status: 'completed', paymentMethod: paymentMethod } as Order;
     addOrUpdateOrder(orderToSave);
     toast({ title: "Pedido completado", description: `El pedido para la ${currentOrder.tableId === 'takeaway' ? 'llevar' : 'mesa ' + currentOrder.tableId} ha sido finalizado.` });
     setPaymentDialogOpen(false);
     setAmountReceived('');
     if (currentOrder.tableId === 'takeaway') router.push('/takeaway');
     else router.push('/dashboard');
  }


  const handleCancelOrder = () => {
    if (!currentOrder || !currentOrder.id) return;
    cancelOrder(currentOrder.id);
    toast({ variant: "destructive", title: "Pedido Cancelado", description: `El pedido para la ${currentOrder.tableId === 'takeaway' ? 'llevar' : 'mesa ' + currentOrder.tableId} ha sido cancelado.` });
    if (currentOrder.tableId === 'takeaway') router.push('/takeaway');
    else router.push('/dashboard');
  }

  const handleBack = () => {
    if (currentOrder?.status === 'active' && hasUnsentChanges && (currentOrder.items?.length || 0) > 0) {
       addOrUpdateOrder({ ...currentOrder, total } as Order);
    }
    if (currentOrder?.tableId === 'takeaway') router.push('/takeaway');
    else router.push('/dashboard');
  }

  if (!isMounted || !currentOrder) {
    return <div className="flex h-screen items-center justify-center">Cargando pedido...</div>;
  }
  
  const tableId = currentOrder.tableId;
  const isNotesDisabled = currentOrder.status === 'preparing' || currentOrder.status === 'completed';

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader><CardTitle>Menú</CardTitle></CardHeader>
          <CardContent>
             <Tabs defaultValue={menuCategories[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  {menuCategories.map(category => (
                      <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                  ))}
                </TabsList>
                {menuCategories.map(category => (
                    <TabsContent key={category} value={category}>
                       <ScrollArea className="h-[50vh]">
                           <div className="space-y-6 pr-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {availableMenuItems.filter(item => item.category === category).map(item => 
                                    item.customPrice ? (
                                        <Card key={item.id} className="overflow-hidden">
                                            <CardContent className="p-4 flex flex-col justify-between h-full">
                                                <div>
                                                    <p className="font-semibold">{item.nombre}</p>
                                                    <p className="text-sm text-muted-foreground">Precio manual</p>
                                                </div>
                                                <div className="flex items-center justify-end gap-2 mt-2">
                                                    <Button variant="outline" onClick={() => { setCustomPriceItem(item); setIsCustomPriceDialogOpen(true); }}>
                                                        <Plus className="h-4 w-4 mr-2" /> Añadir
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                    <Card key={item.id} className="overflow-hidden">
                                       <CardContent className="p-4 flex flex-col justify-between h-full">
                                            <div>
                                                <p className="font-semibold">{item.nombre}</p>
                                                <p className="text-sm text-muted-foreground">${item.precio.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center justify-end gap-2 mt-2">
                                                {item.sabores ? (
                                                    <Popover open={openFlavorPopoverId === item.id} onOpenChange={(isOpen) => setOpenFlavorPopoverId(isOpen ? item.id : null)}>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Añadir</Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto">
                                                            <div className="flex flex-col gap-2">
                                                                <p className="font-semibold text-sm">Seleccione un sabor:</p>
                                                                {item.sabores.map(sabor => (
                                                                    <Button
                                                                        key={sabor}
                                                                        variant="ghost"
                                                                        className="justify-start"
                                                                        onClick={() => {
                                                                            updateItemQuantity(item.id, 1, sabor);
                                                                            setOpenFlavorPopoverId(null); // Close popover after selection
                                                                        }}
                                                                    >
                                                                        {sabor}
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                ) : (
                                                    <>
                                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateItemQuantity(item.id, -1, '')} disabled={currentOrder.items?.find(i => i.menuItemId === item.id && (i.notes === '' || !i.notes))?.quantity === 0}><MinusCircle className="h-4 w-4" /></Button>
                                                        <span className="font-bold w-4 text-center">{currentOrder.items?.find(i => i.menuItemId === item.id && (i.notes === '' || !i.notes))?.quantity || 0}</span>
                                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateItemQuantity(item.id, 1, '')}><PlusCircle className="h-4 w-4" /></Button>
                                                    </>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                   )
                                  )}
                                </div>
                            </div>
                       </ScrollArea>
                    </TabsContent>
                ))}
             </Tabs>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Pedido: {tableId === 'takeaway' ? `Para Llevar #${currentOrder.id?.slice(-4)}` : `Mesa ${tableId}`}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[30vh]">
              {currentOrder.items && currentOrder.items.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {currentOrder.items.map((orderItem, index) => {
                    const menuItem = MENU_ITEMS.find(mi => mi.id === orderItem.menuItemId);
                    if (!menuItem) return null;

                    const sentItem = sentItems.find(si => si.menuItemId === orderItem.menuItemId && si.notes === orderItem.notes && si.customPrice === orderItem.customPrice);
                    const sentQuantity = sentItem?.quantity || 0;
                    const isLocked = sentQuantity > 0 && orderItem.quantity <= sentQuantity;

                    const isCustomPrice = !!orderItem.customPrice;

                    return (
                        <div key={`${menuItem.id}-${orderItem.notes || ''}-${index}`} className="space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{menuItem.nombre} {orderItem.notes ? `(${orderItem.notes})` : ''}</p>
                                    <p className="text-sm text-muted-foreground">{orderItem.quantity} x ${(orderItem.customPrice || menuItem.precio).toFixed(2)}</p>
                                </div>
                                <p className="font-semibold">${((orderItem.customPrice || menuItem.precio) * orderItem.quantity).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItemByIndex(index)} disabled={!!sentItem}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                {!isCustomPrice && (
                                    <>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantityByIndex(index, -1)} disabled={isLocked}><MinusCircle className="h-4 w-4" /></Button>
                                        <span className="font-bold text-sm">{orderItem.quantity}</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantityByIndex(index, 1)}><PlusCircle className="h-4 w-4" /></Button>
                                    </>
                                )}
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
                <Textarea id="order-notes" placeholder="Añadir notas para la cocina (ej. alergias, sin picante, etc.)" value={currentOrder.notes || ''} onChange={handleNotesChange} className="mt-1" disabled={isNotesDisabled}/>
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-4 pt-4">
            <div className="flex justify-between w-full text-xl font-bold"><span>Total:</span><span>${total.toFixed(2)}</span></div>
             {currentOrder.partialPaymentsTotal && currentOrder.partialPaymentsTotal > 0 && (
                <div className="flex justify-between w-full text-lg font-semibold text-orange-600">
                    <span>Pagado Parcialmente:</span>
                    <span>-${currentOrder.partialPaymentsTotal.toFixed(2)}</span>
                </div>
            )}
            <div className="flex justify-between w-full text-2xl font-bold text-primary"><span>Total Pendiente:</span><span>${remainingAmountToPay.toFixed(2)}</span></div>

            <div className="grid grid-cols-1 gap-2 w-full">
               {currentOrder.status === 'active' && (<Button size="lg" onClick={handleSendToKitchen} disabled={!currentOrder.items || currentOrder.items.length === 0 || !hasUnsentChanges}><Send className="mr-2 h-4 w-4"/> Enviar a Cocina</Button>)}
              {currentOrder.status === 'preparing' && (
                  <div className="grid grid-cols-1 gap-2 w-full">
                      {hasUnsentChanges && (<Button size="lg" onClick={handleSendUpdateToKitchen}><Send className="mr-2 h-4 w-4" /> Enviar Actualización a Cocina</Button>)}

                      <Button size="lg" variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setPaymentDialogOpen(true)}>Finalizar y Cobrar</Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="lg" variant="destructive"><XCircle className="mr-2 h-4 w-4"/> Cancelar Pedido</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro de cancelar este pedido?</AlertDialogTitle><AlertDialogDescription>Esta acción es irreversible. El pedido será marcado como cancelado y se notificará a la cocina. No aparecerá en el historial de ventas.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>No, mantener pedido</AlertDialogCancel><AlertDialogAction onClick={handleCancelOrder}>Sí, cancelar pedido</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </div>
              )}
              <Button size="lg" variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4"/> Volver</Button>
            </div>
          </CardFooter>
        </Card>
      </div>

       <AlertDialog open={isCustomPriceDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) { setCustomPriceItem(null); setCustomPrice(''); } setIsCustomPriceDialogOpen(isOpen); }}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Ingresar Precio para {customPriceItem?.nombre}</AlertDialogTitle>
                  <AlertDialogDescription>Por favor, ingrese el valor total para este artículo.</AlertDialogDescription>
              </AlertDialogHeader>
              <Input type="number" placeholder="e.g., 10.00" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} autoFocus />
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => { setCustomPrice(''); setCustomPriceItem(null); }}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAddCustomPriceItem}>Añadir al Pedido</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isPaymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Finalizar y Cobrar Pedido</DialogTitle>
                  <DialogDescription>Seleccione el método de pago para completar la transacción.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total a Pagar</p>
                      <p className="text-4xl font-bold">${remainingAmountToPay.toFixed(2)}</p>
                  </div>
                  <Tabs defaultValue="Efectivo" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="Efectivo"><Banknote className="h-5 w-5"/></TabsTrigger>
                          <TabsTrigger value="Tarjeta"><CreditCard className="h-5 w-5"/></TabsTrigger>
                          <TabsTrigger value="Transferencia"><Smartphone className="h-5 w-5"/></TabsTrigger>
                          <TabsTrigger value="Yape/Plin"><Smartphone className="h-5 w-5"/></TabsTrigger>
                      </TabsList>
                      <TabsContent value="Efectivo">
                          <div className="space-y-2 mt-4">
                              <Label htmlFor="amount-received">Monto Recibido</Label>
                              <Input id="amount-received" type="number" placeholder="Ingrese el monto..." value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} />
                               {change > 0 && (
                                  <p className="text-sm text-green-600 font-medium text-center pt-2">Vuelto: ${change.toFixed(2)}</p>
                              )}
                          </div>
                          <Button className="w-full mt-4" onClick={() => handleFullPayment('Efectivo')} disabled={parseFloat(amountReceived) < remainingAmountToPay}>Pagar con Efectivo</Button>
                      </TabsContent>
                       <TabsContent value="Tarjeta">
                           <Button className="w-full mt-4" onClick={() => handleFullPayment('Tarjeta')}>Pagar con Tarjeta</Button>
                       </TabsContent>
                       <TabsContent value="Transferencia">
                           <Button className="w-full mt-4" onClick={() => handleFullPayment('Transferencia')}>Pagar con Transferencia</Button>
                       </TabsContent>
                       <TabsContent value="Yape/Plin">
                           <Button className="w-full mt-4" onClick={() => handleFullPayment('Yape/Plin')}>Pagar con Yape/Plin</Button>
                       </TabsContent>
                  </Tabs>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
