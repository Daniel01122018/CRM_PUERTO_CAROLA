
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/use-app-store';
import { MENU_ITEMS, TAKEAWAY_MENU_ITEMS } from '@/lib/data';
import type { Order, OrderItem, MenuItem, PaymentMethod } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MinusCircle, Trash2, ArrowLeft, Send, Plus, XCircle, CreditCard, Smartphone, Banknote, Edit } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

interface OrderViewProps {
  orderIdOrTableId: string;
}

type MenuContext = 'salon' | 'llevar';

export default function OrderView({ orderIdOrTableId }: OrderViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addOrUpdateOrder, cancelOrder, isMounted, currentUser, orders } = useAppStore();
  const [currentOrder, setCurrentOrder] = useState<Partial<Order> | null>(null);
  
  const [customPrice, setCustomPrice] = useState('');
  const [isCustomPriceDialogOpen, setIsCustomPriceDialogOpen] = useState(false);
  const [customPriceItem, setCustomPriceItem] = useState<MenuItem | null>(null);
  
  const [openFlavorPopoverId, setOpenFlavorPopoverId] = useState<number | null>(null);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);
  const [isNotesDialogOpen, setNotesDialogOpen] = useState(false);

  const [activeMenuContext, setActiveMenuContext] = useState<MenuContext>('salon');

  const isTakeawayOrder = useMemo(() => {
    if (orderIdOrTableId.startsWith('new-')) {
      return orderIdOrTableId.substring(4) === 'takeaway';
    }
    const existingOrder = orders?.find(o => o.id === orderIdOrTableId);
    return existingOrder?.tableId === 'takeaway';
  }, [orderIdOrTableId, orders]);

  useEffect(() => {
      if(isTakeawayOrder) {
          setActiveMenuContext('llevar');
      }
  }, [isTakeawayOrder]);

  const { currentMenuItems, currentMenuCategories } = useMemo(() => {
    const menu = activeMenuContext === 'llevar' ? TAKEAWAY_MENU_ITEMS : MENU_ITEMS;
    const categories = [...new Set(menu.map(item => item.category))];
    return { currentMenuItems: menu, currentMenuCategories: categories };
  }, [activeMenuContext]);


  useEffect(() => {
    if (!isMounted || !currentUser) {
      if (isMounted) router.push('/');
      return;
    }

    if (!orders) {
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
      });
      return;
    }

    const existingOrderById = orders.find(o => o.id === orderIdOrTableId);
    if (existingOrderById) {
      setCurrentOrder(existingOrderById);
      return;
    }

    const tableIdAsNumber = parseInt(orderIdOrTableId, 10);
    if (!isNaN(tableIdAsNumber)) {
        const activeOrderForTable = orders.find(o => o.tableId === tableIdAsNumber && (o.status === 'active' || o.status === 'preparing'));
        if (activeOrderForTable) {
            router.push(`/order/${activeOrderForTable.id}`);
            return;
        }
    }
    
    toast({
      variant: "destructive",
      title: "Pedido no encontrado",
      description: "El pedido que intentas abrir ya no está activo o fue cerrado.",
    });
    if (orderIdOrTableId.includes('takeaway')) {
      router.push('/takeaway');
    } else {
      router.push('/dashboard');
    }
    
  }, [orderIdOrTableId, isMounted, currentUser, orders, router, toast]);


  const total = useMemo(() => {
    if (!currentOrder || !currentOrder.items) return 0;
    return currentOrder.items.reduce((acc, orderItem) => {
      const menuList = orderItem.contexto === 'llevar' ? TAKEAWAY_MENU_ITEMS : MENU_ITEMS;
      const menuItem = menuList.find(mi => mi.id === orderItem.menuItemId);
      const price = orderItem.customPrice || (menuItem ? menuItem.precio : 0);
      return acc + (price * orderItem.quantity);
    }, 0);
  }, [currentOrder]);
  

  useEffect(() => {
    const received = parseFloat(amountReceived);
    if (!isNaN(received) && received >= total) {
      setChange(received - total);
    } else {
      setChange(0);
    }
  }, [amountReceived, total]);


  const updateItemQuantity = (menuItemId: number, change: number, notes: string = '') => {
    if (!currentOrder) return;
    setCurrentOrder(prev => {
      if (!prev) return null;
      const prevItems = prev.items || [];
      const itemIndex = prevItems.findIndex(i => i.menuItemId === menuItemId && i.notes === notes && !i.customPrice && i.contexto === activeMenuContext);
      let newItems = [...prevItems];
      if (itemIndex > -1) {
        const newQuantity = newItems[itemIndex].quantity + change;
        if (newQuantity <= 0) {
          newItems.splice(itemIndex, 1);
        } else {
          newItems[itemIndex] = {...newItems[itemIndex], quantity: newQuantity};
        }
      } else if (change > 0) {
        const newItem: OrderItem = { menuItemId, quantity: change, notes, contexto: activeMenuContext };
        newItems.push(newItem);
      }
      return { ...prev, items: newItems };
    });
  };
  
  const removeItemByIndex = (itemIndex: number) => {
    if (!currentOrder) return;
    setCurrentOrder(prev => {
        if (!prev) return null;
        const newItems = [...(prev.items || [])];
        newItems.splice(itemIndex, 1);
        return { ...prev, items: newItems };
    });
  }

  const updateQuantityByIndex = (itemIndex: number, change: number) => {
    if (!currentOrder) return;
    setCurrentOrder(prev => {
        if (!prev) return null;
        const newItems = [...(prev.items || [])];
        const itemToUpdate = newItems[itemIndex];
        const newQuantity = itemToUpdate.quantity + change;

        if (newQuantity <= 0) {
            newItems.splice(itemIndex, 1);
        } else {
            newItems[itemIndex] = { ...itemToUpdate, quantity: newQuantity };
        }
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
            contexto: activeMenuContext,
        };
        const newItems = [...(prev.items || []), newItem];
        return { ...prev, items: newItems };
    });
    setCustomPrice('');
    setCustomPriceItem(null);
    setIsCustomPriceDialogOpen(false);
  }

  
  const handleSendToKitchen = async () => {
    if (!currentOrder || !currentOrder.id || !currentOrder.items || currentOrder.items.length === 0) {
        toast({ variant: "destructive", title: "Pedido vacío", description: "No se puede enviar un pedido sin artículos." });
        return;
    }
    const orderToSave: Order = { ...currentOrder, total, status: 'preparing' } as Order;
    await addOrUpdateOrder(orderToSave);
    
    toast({ title: "Pedido enviado a cocina", description: `El pedido para la ${currentOrder.tableId === 'takeaway' ? 'llevar' : 'mesa ' + currentOrder.tableId} ha sido enviado.` });
    
    if (currentOrder.tableId === 'takeaway') router.push('/takeaway');
    else router.push('/dashboard');
  };

  const handleSendUpdateToKitchen = async () => {
    if (!currentOrder || !currentOrder.id || !currentOrder.items) return;
    const orderToSave: Order = { ...currentOrder, total } as Order;
    await addOrUpdateOrder(orderToSave);
    
    toast({ title: "Actualización enviada", description: "Nuevos artículos enviados a cocina." });
    if (currentOrder.tableId === 'takeaway') router.push('/takeaway');
    else router.push('/dashboard');
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentOrder) return;
    setCurrentOrder({ ...currentOrder, notes: e.target.value });
  };
  
  const handleFullPayment = async (paymentMethod: PaymentMethod) => {
     if (!currentOrder || !currentOrder.id) return;
     const orderToSave: Order = { ...currentOrder, total, status: 'completed', paymentMethod: paymentMethod } as Order;
     await addOrUpdateOrder(orderToSave);
     toast({ title: "Pedido completado", description: `El pedido para la ${currentOrder.tableId === 'takeaway' ? 'llevar' : 'mesa ' + currentOrder.tableId} ha sido finalizado.` });
     setPaymentDialogOpen(false);
     setAmountReceived('');
     if (currentOrder.tableId === 'takeaway') router.push('/takeaway');
     else router.push('/dashboard');
  }


  const handleCancelOrder = async () => {
    if (!currentOrder || !currentOrder.id) return;
    await cancelOrder(currentOrder.id);
    toast({ variant: "destructive", title: "Pedido Cancelado", description: `El pedido para la ${currentOrder.tableId === 'takeaway' ? 'llevar' : 'mesa ' + currentOrder.tableId} ha sido cancelado.` });
    if (currentOrder.tableId === 'takeaway') router.push('/takeaway');
    else router.push('/dashboard');
  }

  const handleBack = async () => {
    if (currentOrder?.status === 'active' && (currentOrder.items?.length || 0) > 0) {
       await addOrUpdateOrder({ ...currentOrder, total } as Order);
    }
    if (currentOrder?.tableId === 'takeaway') router.push('/takeaway');
    else router.push('/dashboard');
  }

  if (!isMounted || !currentOrder || !orders) {
    return <div className="flex h-screen items-center justify-center">Cargando pedido...</div>;
  }
  
  const tableId = currentOrder.tableId;
  const hasUnsentChanges = JSON.stringify(currentOrder.items) !== JSON.stringify(orders.find(o => o.id === currentOrder.id)?.items ?? []);

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
             <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Menú</CardTitle>
                {!isTakeawayOrder && (
                    <Tabs value={activeMenuContext} onValueChange={(value) => setActiveMenuContext(value as MenuContext)} className="w-[220px]">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="salon">Salón</TabsTrigger>
                            <TabsTrigger value="llevar">Llevar</TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}
            </CardHeader>
          <CardContent>
             <Tabs defaultValue={currentMenuCategories[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  {currentMenuCategories.map(category => (
                      <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                  ))}
                </TabsList>
                {currentMenuCategories.map(category => (
                    <TabsContent key={category} value={category}>
                       <ScrollArea className="h-[60vh]">
                           <div className="space-y-6 pr-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {currentMenuItems.filter(item => item.category === category).map(item => 
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
                                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateItemQuantity(item.id, -1, '')} disabled={!currentOrder.items?.some(i => i.menuItemId === item.id && (i.notes === '' || !i.notes) && i.contexto === activeMenuContext)}><MinusCircle className="h-4 w-4" /></Button>
                                                        <span className="font-bold w-4 text-center">{currentOrder.items?.find(i => i.menuItemId === item.id && (i.notes === '' || !i.notes) && i.contexto === activeMenuContext)?.quantity || 0}</span>
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
            <ScrollArea className="h-[45vh]">
              {currentOrder.items && currentOrder.items.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {currentOrder.items.map((orderItem, index) => {
                    const menuList = orderItem.contexto === 'llevar' ? TAKEAWAY_MENU_ITEMS : MENU_ITEMS;
                    const menuItem = menuList.find(mi => mi.id === orderItem.menuItemId);
                    if (!menuItem) return null;

                    const isCustomPrice = !!orderItem.customPrice;

                    return (
                        <div key={`${menuItem.id}-${orderItem.notes || ''}-${index}`} className="space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">
                                        {menuItem.nombre} {orderItem.notes ? `(${orderItem.notes})` : ''}
                                        {orderItem.contexto === 'llevar' && <span className="text-xs text-blue-600 font-semibold ml-1">(P/ Llevar)</span>}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{orderItem.quantity} x ${(orderItem.customPrice || menuItem.precio).toFixed(2)}</p>
                                </div>
                                <p className="font-semibold">${((orderItem.customPrice || menuItem.precio) * orderItem.quantity).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItemByIndex(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                {!isCustomPrice && (
                                    <>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantityByIndex(index, -1)}><MinusCircle className="h-4 w-4" /></Button>
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
             <div className="pt-4 pr-4">
                 <Dialog open={isNotesDialogOpen} onOpenChange={setNotesDialogOpen}>
                    <DialogTrigger asChild>
                        {currentOrder.notes ? (
                             <Button variant="outline" className="w-full justify-start text-left h-auto">
                                <Edit className="mr-2 h-4 w-4" />
                                <div>
                                    <p className="font-semibold">Notas Generales:</p>
                                    <p className="text-sm text-muted-foreground truncate">{currentOrder.notes}</p>
                                </div>
                            </Button>
                        ) : (
                             <Button variant="outline" className="w-full">
                                <Plus className="mr-2 h-4 w-4" />
                                Añadir Notas Generales
                            </Button>
                        )}
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Notas Generales del Pedido</DialogTitle>
                            <DialogDescription>Añade instrucciones especiales para la cocina, como alergias, preferencias, etc.</DialogDescription>
                        </DialogHeader>
                        <Textarea 
                            placeholder="Escribe tus notas aquí..."
                            value={currentOrder.notes || ''} 
                            onChange={handleNotesChange} 
                            className="mt-2 min-h-[100px]"
                        />
                        <DialogFooter>
                            <Button onClick={() => setNotesDialogOpen(false)}>Guardar Notas</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-4 pt-4">
            <div className="flex justify-between w-full text-2xl font-bold text-primary"><span>Total:</span><span>${total.toFixed(2)}</span></div>
            
            <div className="grid grid-cols-1 gap-2 w-full">
               {currentOrder.status === 'active' && (<Button size="lg" onClick={handleSendToKitchen} disabled={!currentOrder.items || currentOrder.items.length === 0}><Send className="mr-2 h-4 w-4"/> Enviar a Cocina</Button>)}
              {currentOrder.status === 'preparing' && (
                  <div className="grid grid-cols-1 gap-2 w-full">
                      {hasUnsentChanges && (<Button size="lg" onClick={handleSendUpdateToKitchen}><Send className="mr-2 h-4 w-4" /> Enviar Actualización a Cocina</Button>)}

                      <Button size="lg" variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setPaymentDialogOpen(true)}>Finalizar y Cobrar</Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="lg" variant="destructive"><XCircle className="mr-2 h-4 w-4"/> Desechar Pedido</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro de desechar este pedido?</AlertDialogTitle><AlertDialogDescription>Esta acción es irreversible y solo debe hacerse si el cliente ya no quiere el pedido. El pedido será marcado como cancelado y se notificará a la cocina.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>No, mantener pedido</AlertDialogCancel><AlertDialogAction onClick={handleCancelOrder}>Sí, desechar pedido</AlertDialogAction></AlertDialogFooter>
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
                      <p className="text-4xl font-bold">${total.toFixed(2)}</p>
                  </div>
                  <Tabs defaultValue="Efectivo" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="Efectivo"><Banknote className="h-5 w-5"/></TabsTrigger>
                          <TabsTrigger value="DeUna"><CreditCard className="h-5 w-5"/></TabsTrigger>
                          <TabsTrigger value="Transferencia"><Smartphone className="h-5 w-5"/></TabsTrigger>
                      </TabsList>
                      <TabsContent value="Efectivo">
                          <div className="space-y-2 mt-4">
                              <Label htmlFor="amount-received">Monto Recibido</Label>
                              <Input id="amount-received" type="number" placeholder="Ingrese el monto..." value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} />
                               {change > 0 && (
                                  <p className="text-sm text-green-600 font-medium text-center pt-2">Vuelto: ${change.toFixed(2)}</p>
                              )}
                          </div>
                          <Button className="w-full mt-4" onClick={() => handleFullPayment('Efectivo')} disabled={parseFloat(amountReceived) < total && amountReceived !== ''}>Pagar con Efectivo</Button>
                      </TabsContent>
                       <TabsContent value="DeUna">
                           <Button className="w-full mt-4" onClick={() => handleFullPayment('DeUna')}>Pagar con DeUna</Button>
                       </TabsContent>
                       <TabsContent value="Transferencia">
                           <Button className="w-full mt-4" onClick={() => handleFullPayment('Transferencia')}>Pagar con Transferencia</Button>
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

    