
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/use-app-store';
import { MENU_PLATOS, MENU_ITEMS, ALL_MENU_ITEMS } from '@/lib/data';
import type { Order, OrderItem, MenuItem, PaymentMethod, MenuPlato, MenuItemVariant } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MinusCircle, Trash2, ArrowLeft, Send, Plus, XCircle, Smartphone, Banknote, Edit } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import AppSidebar from '@/components/app-sidebar';

interface OrderViewProps {
  orderIdOrTableId: string;
}

type MenuContext = 'salon' | 'llevar';

export default function OrderView({ orderIdOrTableId }: OrderViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addOrUpdateOrder, cancelOrder, isMounted, currentUser, orders } = useAppStore();
  const [currentOrder, setCurrentOrder] = useState<Partial<Order> | null>(null);
  
  const [openFlavorPopoverId, setOpenFlavorPopoverId] = useState<number | null>(null);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);
  const [isNotesDialogOpen, setNotesDialogOpen] = useState(false);

  const [activeMenuContext, setActiveMenuContext] = useState<MenuContext>('salon');
  
  const [isVariantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedPlato, setSelectedPlato] = useState<MenuPlato | null>(null);

  // States for custom price flow
  const [isCustomPriceDialogOpen, setIsCustomPriceDialogOpen] = useState(false);
  const [customPriceVariant, setCustomPriceVariant] = useState<MenuItemVariant | null>(null);
  const [customPrice, setCustomPrice] = useState('');
  
  const isTakeawayOrder = useMemo(() => {
    if (orderIdOrTableId.startsWith('new-')) {
      return orderIdOrTableId.endsWith('takeaway');
    }
    const existingOrder = orders?.find(o => o.id === orderIdOrTableId);
    return existingOrder?.tableId === 'takeaway';
  }, [orderIdOrTableId, orders]);


  const { currentMenuCategories, currentPlatos, currentOtherItems } = useMemo(() => {
    const allCategories = ['Platos', 'Bebidas', 'Adicionales'];
    const platos = MENU_PLATOS;
    const otherItems = MENU_ITEMS.filter(item => {
        if (activeMenuContext === 'llevar') return true;
        return !item.paraLlevar;
    });
    return { currentMenuCategories: allCategories, currentPlatos: platos, currentOtherItems: otherItems };
  }, [activeMenuContext]);


  useEffect(() => {
    if (!isMounted || !currentUser) {
        if (isMounted) router.push('/');
        return;
    }

    if (orders === undefined) {
        // orders are loading
        return;
    }
    
    let initialOrder: Partial<Order> | undefined;

    if (orderIdOrTableId.startsWith('new-')) {
        const type = orderIdOrTableId.substring(4);
        const isTakeaway = type === 'takeaway';

        if (isTakeaway) {
            initialOrder = {
                id: Date.now().toString(),
                tableId: 'takeaway',
                items: [],
                status: 'active',
                createdAt: Date.now(),
                total: 0,
                notes: '',
            };
        } else {
            const tableId = parseInt(type, 10);
            const existingOrderForTable = orders.find(o => o.tableId === tableId && (o.status === 'active' || o.status === 'preparing'));
            
            if (existingOrderForTable) {
                initialOrder = existingOrderForTable;
            } else {
                initialOrder = {
                    id: Date.now().toString(), // Generate unique ID always
                    tableId: tableId,
                    items: [],
                    status: 'active',
                    createdAt: Date.now(),
                    total: 0,
                    notes: '',
                };
            }
        }
    } else {
        initialOrder = orders.find(o => o.id === orderIdOrTableId);
        if(!initialOrder) {
            toast({
                variant: "destructive",
                title: "Pedido no encontrado",
                description: "El pedido que intentas abrir no existe o fue cerrado.",
            });
            router.push('/dashboard');
            return;
        }
    }
    
    setCurrentOrder(initialOrder);

    if (initialOrder?.tableId === 'takeaway') {
      setActiveMenuContext('llevar');
    } else {
      setActiveMenuContext('salon');
    }

}, [orderIdOrTableId, isMounted, currentUser, orders, router, toast]);


  const total = useMemo(() => {
    if (!currentOrder || !currentOrder.items) return 0;
    return currentOrder.items.reduce((acc, orderItem) => {
      const menuItem = ALL_MENU_ITEMS.find(mi => mi.id === orderItem.menuItemId);
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


  const updateItemQuantity = (menuItemId: number, change: number, notes: string = '', customPrice?: number) => {
    if (!currentOrder) return;
    setCurrentOrder(prev => {
      if (!prev) return null;
      
      const itemIdentifier = (item: OrderItem) => 
          item.menuItemId === menuItemId && 
          item.notes === notes && 
          item.contexto === activeMenuContext &&
          // Only group items if they don't have a custom price
          !item.customPrice && !customPrice;

      const prevItems = prev.items || [];
      const itemIndex = customPrice ? -1 : prevItems.findIndex(itemIdentifier);
      
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
        if (customPrice) {
          newItem.customPrice = customPrice;
        }
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
    if (isTakeawayOrder) router.push('/takeaway');
    else router.push('/dashboard');
  }
  
  const handleVariantClick = (variant: MenuItemVariant) => {
    if (variant.customPrice) {
      setCustomPriceVariant(variant);
      setVariantModalOpen(false);
      setIsCustomPriceDialogOpen(true);
    } else {
      updateItemQuantity(variant.id, 1);
      setVariantModalOpen(false);
    }
  };

  const handleAddCustomPriceItem = () => {
    const price = parseFloat(customPrice);
    if (customPriceVariant && !isNaN(price) && price > 0) {
      updateItemQuantity(customPriceVariant.id, 1, '', price);
      setIsCustomPriceDialogOpen(false);
      setCustomPriceVariant(null);
      setCustomPrice('');
    } else {
        toast({
            variant: 'destructive',
            title: 'Precio inválido',
            description: 'Por favor, ingrese un monto válido.'
        })
    }
  };


  if (!isMounted || !currentOrder || orders === undefined) {
    return <div className="flex h-screen items-center justify-center">Cargando pedido...</div>;
  }
  
  const tableId = currentOrder.tableId;
  const hasUnsentChanges = JSON.stringify(currentOrder.items) !== JSON.stringify(orders.find(o => o.id === currentOrder.id)?.items ?? []);

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
             <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <AppSidebar />
                  <CardTitle>Menú</CardTitle>
                </div>
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
             <Tabs defaultValue="Platos" className="w-full">
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
                                {category === 'Platos' && currentPlatos.map(plato => (
                                    <Card 
                                        key={plato.id} 
                                        className="overflow-hidden cursor-pointer hover:bg-muted transition-colors"
                                        onClick={() => { setSelectedPlato(plato); setVariantModalOpen(true);}}
                                    >
                                        <CardContent className="p-8 flex items-center justify-center h-full">
                                            <p className="font-semibold text-center text-lg">{plato.nombre}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                                {currentOtherItems.filter(item => item.category === category).map(item => (
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
                                                            <Button variant="outline"><Plus className="mr-2 h-4 w-4" />Añadir</Button>
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
                                                                            setOpenFlavorPopoverId(null);
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
                    const menuItem = ALL_MENU_ITEMS.find(mi => mi.id === orderItem.menuItemId);
                    if (!menuItem) return null;

                    return (
                        <div key={`${menuItem.id}-${orderItem.notes || ''}-${index}-${orderItem.customPrice || 0}`} className="space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">
                                        {menuItem.nombre} {orderItem.notes ? `(${orderItem.notes})` : ''}
                                        {orderItem.contexto === 'llevar' && <span className="text-xs text-blue-600 font-semibold ml-1">(P/ Llevar)</span>}
                                        {orderItem.customPrice && <span className="text-xs text-green-600 font-semibold ml-1">(Precio Manual)</span>}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{orderItem.quantity} x ${(orderItem.customPrice || menuItem.precio).toFixed(2)}</p>
                                </div>
                                <p className="font-semibold">${((orderItem.customPrice || menuItem.precio) * orderItem.quantity).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItemByIndex(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                {!orderItem.customPrice && (
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
                            autoFocus
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

      {/* Variant Selection Modal */}
      <Dialog open={isVariantModalOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedPlato(null); setVariantModalOpen(isOpen); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Variantes de {selectedPlato?.nombre}</DialogTitle>
            <DialogDescription>Selecciona una variante para añadir al pedido.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
            {selectedPlato?.variantes.filter(v => activeMenuContext === 'llevar' ? v.contexto === 'llevar' : v.contexto === 'salon').map(variante => (
              <Button 
                key={variante.id}
                variant="outline"
                className="w-full justify-between h-14"
                onClick={() => handleVariantClick(variante)}
              >
                <div className="text-left">
                  <p className="font-medium">{variante.nombre}</p>
                  {!variante.customPrice && <p className="text-sm text-muted-foreground">${variante.precio.toFixed(2)}</p>}
                </div>
                <Plus className="h-4 w-4" /> 
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Custom Price Modal */}
      <Dialog open={isCustomPriceDialogOpen} onOpenChange={setIsCustomPriceDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Precio para {customPriceVariant?.nombre}</DialogTitle>
                  <DialogDescription>
                      Ingrese el monto total para este artículo.
                  </DialogDescription>
              </DialogHeader>
              <Input 
                type="number"
                placeholder="Monto"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                autoFocus
              />
              <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsCustomPriceDialogOpen(false); setCustomPriceVariant(null); setCustomPrice(''); }}>Cancelar</Button>
                  <Button onClick={handleAddCustomPriceItem}>Añadir al Pedido</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Payment Modal */}
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
                          <TabsTrigger value="DeUna" className="font-bold">DeUna</TabsTrigger>
                          <TabsTrigger value="Transferencia"><Smartphone className="h-5 w-5"/></TabsTrigger>
                      </TabsList>
                      <TabsContent value="Efectivo">
                          <form onSubmit={(e) => { e.preventDefault(); handleFullPayment('Efectivo'); }}>
                            <div className="space-y-2 mt-4">
                                <label htmlFor="amount-received">Monto Recibido</label>
                                <Input id="amount-received" type="number" placeholder="Ingrese el monto..." value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} autoFocus />
                                {change > 0 && (
                                    <p className="text-sm text-green-600 font-medium text-center pt-2">Vuelto: ${change.toFixed(2)}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full mt-4" disabled={parseFloat(amountReceived) < total && amountReceived !== ''}>Pagar con Efectivo</Button>
                          </form>
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
