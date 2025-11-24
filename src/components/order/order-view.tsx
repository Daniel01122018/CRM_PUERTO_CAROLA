"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/use-app-store';
import { useMenu, FirestoreItem } from '@/hooks/use-menu';
import type { Order, OrderItem, MenuItemVariant, MenuPlato, PaymentMethod } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MinusCircle, Trash2, ArrowLeft, Send, Plus, XCircle, Smartphone, Banknote, Edit } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import AppSidebar from '@/components/app-sidebar';
import { MenuTabs } from '@/components/menu/menu-tabs';
import { MenuItemCard } from '@/components/menu/menu-item-card';

interface OrderViewProps {
  orderIdOrTableId: string;
}

type MenuContext = 'salon' | 'llevar';

export default function OrderView({ orderIdOrTableId }: OrderViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addOrUpdateOrder, cancelOrder, isMounted, currentUser, orders } = useAppStore();
  const { categories, items: menuItems, loading: menuLoading } = useMenu();

  const [currentOrder, setCurrentOrder] = useState<Partial<Order> | null>(null);

  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);
  const [isNotesDialogOpen, setNotesDialogOpen] = useState(false);

  const [activeMenuContext, setActiveMenuContext] = useState<MenuContext>('salon');

  const [isVariantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedPlato, setSelectedPlato] = useState<FirestoreItem | null>(null);

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

  const baseRedirectPath = useMemo(() => {
    if (currentUser?.role === 'admin') {
      return '/admin/dashboard';
    }
    return isTakeawayOrder ? '/takeaway' : '/dashboard';
  }, [currentUser, isTakeawayOrder]);

  useEffect(() => {
    if (!isMounted || !currentUser) {
      if (isMounted) router.push('/');
      return;
    }

    if (orders === undefined) return;

    let initialOrder: Partial<Order> | undefined;

    if (orderIdOrTableId.startsWith('new-')) {
      const type = orderIdOrTableId.substring(4);
      const isTakeaway = type === 'takeaway';

      if (isTakeaway) {
        initialOrder = {
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
      if (!initialOrder) {
        toast({
          variant: "destructive",
          title: "Pedido no encontrado",
          description: "El pedido que intentas abrir no existe o fue cerrado.",
        });
        router.push(baseRedirectPath);
        return;
      }
    }

    setCurrentOrder(initialOrder);

    if (initialOrder?.tableId === 'takeaway') {
      setActiveMenuContext('llevar');
    } else {
      setActiveMenuContext('salon');
    }

  }, [orderIdOrTableId, isMounted, currentUser, orders, router, toast, baseRedirectPath]);


  const total = useMemo(() => {
    if (!currentOrder || !currentOrder.items) return 0;
    return currentOrder.items.reduce((acc, orderItem) => {
      // Find item in loaded menu items
      // We need to handle both simple items and variants
      // For simple items, we find by orderItem.menuItemId (which matches item.oldId or item.id)
      // For variants, the price is usually in the variant itself or passed in orderItem

      // Since we migrated, IDs might be different. 
      // The migration kept oldId. 
      // However, for new items, we use Firestore ID.
      // Let's assume orderItem.menuItemId refers to the ID of the item (or variant ID for platos?)

      // In the old code: 
      // menuItem = ALL_MENU_ITEMS.find(mi => mi.id === orderItem.menuItemId);
      // price = orderItem.customPrice || (menuItem ? menuItem.precio : 0);

      // We need a helper to find price.
      // For now, let's rely on what's in the order if possible, but we need the base price.

      // Strategy: Flatten all items and variants to find the price.
      let price = 0;
      if (orderItem.customPrice) {
        price = orderItem.customPrice;
      } else {
        // Try to find in menuItems
        const item = menuItems.find(i => i.id === orderItem.menuItemId.toString() || i.oldId === orderItem.menuItemId);
        if (item) {
          price = item.price;
        } else {
          // Try to find in variants
          for (const i of menuItems) {
            if (i.variants) {
              const v = i.variants.find(v => v.id === orderItem.menuItemId);
              if (v) {
                price = v.precio;
                break;
              }
            }
          }
        }
      }

      return acc + (price * orderItem.quantity);
    }, 0);
  }, [currentOrder, menuItems]);


  useEffect(() => {
    const received = parseFloat(amountReceived);
    if (!isNaN(received) && received >= total) {
      setChange(received - total);
    } else {
      setChange(0);
    }
  }, [amountReceived, total]);


  const updateItemQuantity = (menuItemId: number | string, change: number, notes: string = '', customPrice?: number) => {
    if (!currentOrder) return;
    setCurrentOrder(prev => {
      if (!prev) return null;

      // Ensure menuItemId is compared correctly (string vs number)
      const itemIdentifier = (item: OrderItem) =>
        (item.menuItemId === menuItemId || item.menuItemId.toString() === menuItemId.toString()) &&
        item.notes === notes &&
        item.contexto === activeMenuContext &&
        !item.customPrice && !customPrice;

      const prevItems = prev.items || [];
      const itemIndex = customPrice ? -1 : prevItems.findIndex(itemIdentifier);

      let newItems = [...prevItems];

      if (itemIndex > -1) {
        const newQuantity = newItems[itemIndex].quantity + change;
        if (newQuantity <= 0) {
          newItems.splice(itemIndex, 1);
        } else {
          newItems[itemIndex] = { ...newItems[itemIndex], quantity: newQuantity };
        }
      } else if (change > 0) {
        // We need to store ID as number if it was number, or string if string.
        // The old system used numbers. The new one uses strings.
        // We should probably convert everything to strings eventually, but for compatibility let's keep it flexible.
        const idToStore = typeof menuItemId === 'string' && !isNaN(Number(menuItemId)) ? Number(menuItemId) : menuItemId;

        const newItem: OrderItem = { menuItemId: idToStore as any, quantity: change, notes, contexto: activeMenuContext };
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

  const saveOrderAndNavigate = async (orderStatus: 'preparing' | 'active', successMessage: string) => {
    if (!currentOrder || !currentOrder.items || currentOrder.items.length === 0) {
      toast({ variant: "destructive", title: "Pedido vacío", description: "No se puede guardar un pedido sin artículos." });
      return;
    }

    const orderToSave: Omit<Order, 'id'> & { id?: string } = { ...currentOrder, total, status: orderStatus } as Omit<Order, 'id'> & { id?: string };

    const newId = await addOrUpdateOrder(orderToSave);

    if (newId) {
      toast({ title: successMessage, description: `Pedido para ${currentOrder.tableId === 'takeaway' ? 'llevar' : `Mesa ${currentOrder.tableId}`}.` });

      if (orderIdOrTableId.startsWith('new-')) {
        router.replace(`/order/${newId}`);
        setCurrentOrder(prev => prev ? { ...prev, id: newId } : null);
      }
    }

    router.push(baseRedirectPath);
  };

  const handleSendToKitchen = () => {
    saveOrderAndNavigate('preparing', 'Pedido enviado a cocina');
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
    router.push(baseRedirectPath);
  }


  const handleCancelOrder = async () => {
    if (!currentOrder || !currentOrder.id) return;
    await cancelOrder(currentOrder.id);
    toast({ variant: "destructive", title: "Pedido Cancelado", description: `El pedido para la ${currentOrder.tableId === 'takeaway' ? 'llevar' : 'mesa ' + currentOrder.tableId} ha sido cancelado.` });
    router.push(baseRedirectPath);
  }

  const handleBack = async () => {
    if (currentOrder?.status === 'active' && (currentOrder.items?.length || 0) > 0) {
      const orderToSave: Omit<Order, 'id'> & { id?: string } = { ...currentOrder, total, status: 'active' } as Omit<Order, 'id'> & { id?: string };
      const newId = await addOrUpdateOrder(orderToSave);
      if (newId && orderIdOrTableId.startsWith('new-')) {
        router.replace(`/order/${newId}`);
      }
    }
    router.push(baseRedirectPath);
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

  const handleAddItem = (item: FirestoreItem, quantity: number, notes?: string, customPrice?: number) => {
    if (item.type === 'plato') {
      setSelectedPlato(item);
      setVariantModalOpen(true);
    } else {
      // Use ID or OldID
      const id = item.oldId || item.id;
      updateItemQuantity(id, quantity, notes, customPrice);
    }
  }


  if (!isMounted || !currentOrder || orders === undefined || menuLoading) {
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
            <MenuTabs categories={categories}>
              {(categoryId) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {menuItems
                    .filter(item => item.categoryId === categoryId)
                    .filter(item => {
                      if (activeMenuContext === 'llevar') return true;
                      return !item.paraLlevar;
                    })
                    .map(item => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        mode="order"
                        activeContext={activeMenuContext}
                        onAdd={handleAddItem}
                        quantityInOrder={currentOrder.items?.find(i => (i.menuItemId === item.id || i.menuItemId === item.oldId) && (i.notes === '' || !i.notes) && i.contexto === activeMenuContext)?.quantity || 0}
                      />
                    ))}
                </div>
              )}
            </MenuTabs>
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
                    // Find item name and price
                    // This is tricky because we have mixed IDs (old numbers and new strings)
                    // and variants.

                    let name = "Item desconocido";
                    let price = 0;

                    // Try to find in items
                    const item = menuItems.find(i => i.id === orderItem.menuItemId.toString() || i.oldId === orderItem.menuItemId);

                    if (item) {
                      name = item.name;
                      price = item.price;
                    } else {
                      // Try variants
                      for (const i of menuItems) {
                        if (i.variants) {
                          const v = i.variants.find(v => v.id === orderItem.menuItemId);
                          if (v) {
                            // Construct name: Plato Name + Variant Name
                            name = `${i.name} ${v.nombre}`;
                            price = v.precio;
                            break;
                          }
                        }
                      }
                    }

                    if (orderItem.customPrice) price = orderItem.customPrice;

                    return (
                      <div key={`${index}-${orderItem.menuItemId}`} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {name} {orderItem.notes ? `(${orderItem.notes})` : ''}
                              {orderItem.contexto === 'llevar' && <span className="text-xs text-blue-600 font-semibold ml-1">(P/ Llevar)</span>}
                              {orderItem.customPrice && <span className="text-xs text-green-600 font-semibold ml-1">(Precio Manual)</span>}
                            </p>
                            <p className="text-sm text-muted-foreground">{orderItem.quantity} x ${price.toFixed(2)}</p>
                          </div>
                          <p className="font-semibold">${(price * orderItem.quantity).toFixed(2)}</p>
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
                        <Separator />
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
              {currentOrder.status === 'active' && (<Button size="lg" onClick={handleSendToKitchen} disabled={!currentOrder.items || currentOrder.items.length === 0}><Send className="mr-2 h-4 w-4" /> Enviar a Cocina</Button>)}
              {currentOrder.status === 'preparing' && (
                <div className="grid grid-cols-1 gap-2 w-full">
                  {hasUnsentChanges && (<Button size="lg" onClick={() => saveOrderAndNavigate('preparing', 'Actualización enviada a cocina')}><Send className="mr-2 h-4 w-4" /> Enviar Actualización a Cocina</Button>)}

                  <Button size="lg" variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setPaymentDialogOpen(true)}>Finalizar y Cobrar</Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="lg" variant="destructive"><XCircle className="mr-2 h-4 w-4" /> Desechar Pedido</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>¿Estás seguro de desechar este pedido?</AlertDialogTitle><AlertDialogDescription>Esta acción es irreversible y solo debe hacerse si el cliente ya no quiere el pedido. El pedido será marcado como cancelado y se notificará a la cocina.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>No, mantener pedido</AlertDialogCancel><AlertDialogAction onClick={handleCancelOrder}>Sí, desechar pedido</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              <Button size="lg" variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Variant Selection Modal */}
      <Dialog open={isVariantModalOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedPlato(null); setVariantModalOpen(isOpen); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Variantes de {selectedPlato?.name}</DialogTitle>
            <DialogDescription>Selecciona una variante para añadir al pedido.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
            {selectedPlato?.variants?.filter(v => activeMenuContext === 'llevar' ? v.contexto === 'llevar' : v.contexto === 'salon').map(variante => (
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
                <TabsTrigger value="Efectivo"><Banknote className="h-5 w-5" /></TabsTrigger>
                <TabsTrigger value="DeUna" className="font-bold">DeUna</TabsTrigger>
                <TabsTrigger value="Transferencia"><Smartphone className="h-5 w-5" /></TabsTrigger>
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
