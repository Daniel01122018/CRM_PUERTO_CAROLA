"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/use-app-store';
import { useMenu } from '@/hooks/use-menu';
import { useBanks } from '@/hooks/use-banks';
import type { Order, OrderItem, MenuItemVariant, MenuPlato, PaymentMethod, FirestoreItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MinusCircle, Trash2, ArrowLeft, Send, Plus, XCircle, Smartphone, Banknote, Edit, Unlock, RefreshCw, CheckCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import AppSidebar from '@/components/app-sidebar';
import { MenuTabs } from '@/components/menu/menu-tabs';
import { MenuItemCard } from '@/components/menu/menu-item-card';
import { NumericKeypad } from '@/components/ui/numeric-keypad';

interface OrderViewProps {
  orderIdOrTableId: string;
}

type MenuContext = 'salon' | 'llevar';

export default function OrderView({ orderIdOrTableId }: OrderViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addOrUpdateOrder, cancelOrder, isMounted, currentUser, orders, resetTableLock } = useAppStore();
  const { categories, items: menuItems, loading: menuLoading } = useMenu();
  const { banks } = useBanks();

  const [currentOrder, setCurrentOrder] = useState<Partial<Order> | null>(null);

  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);
  const [isNotesDialogOpen, setNotesDialogOpen] = useState(false);

  const [activeMenuContext, setActiveMenuContext] = useState<MenuContext>('salon');
  const [selectedBank, setSelectedBank] = useState<string>('');

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

  const isKioskOrder = useMemo(() => {
    const existingOrder = orders?.find(o => o.id === orderIdOrTableId);
    return existingOrder?.tableId === 'kiosk';
  }, [orderIdOrTableId, orders]);

  const baseRedirectPath = useMemo(() => {
    if (currentUser?.role === 'admin') {
      return '/admin/dashboard';
    }
    if (isKioskOrder) return '/kiosk-admin';
    return isTakeawayOrder ? '/takeaway' : '/dashboard';
  }, [currentUser, isTakeawayOrder, isKioskOrder]);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // 1. Initialization Effect: Load initial state ONCE
    if (!isMounted || !currentUser || orders === undefined || initialized) return;

    let initialOrder: Partial<Order> | undefined;

    // Try to load from localStorage first (Draft Persistence)
    const storageKey = `draft_order_${orderIdOrTableId}`;
    const savedDraft = localStorage.getItem(storageKey);

    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        const isRecent = Date.now() - parsedDraft.timestamp < 24 * 60 * 60 * 1000;
        const DRAFT_VERSION = 'v1';
        const isCompatible = parsedDraft.version === DRAFT_VERSION;

        if (isRecent && isCompatible && parsedDraft.order) {
          console.log("Restoring draft from localStorage");
          setCurrentOrder(parsedDraft.order);
          if (parsedDraft.order.tableId === 'takeaway') {
            setActiveMenuContext('llevar');
          } else {
            setActiveMenuContext('salon');
          }
          setInitialized(true);
          return;
        }
      } catch (e) {
        console.error("Error parsing draft:", e);
        localStorage.removeItem(storageKey);
      }
    }

    // If no draft, load from Firestore or initialize new
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

    setInitialized(true);

  }, [orderIdOrTableId, isMounted, currentUser, orders, router, toast, baseRedirectPath, initialized]);

  // 2. Synchronization Effect: Sync with Firestore unless local changes exist (isDirty)
  useEffect(() => {
    if (!initialized || !currentOrder || !orders) return;
    if (orderIdOrTableId.startsWith('new-')) return; // Don't sync new orders until saved

    const remoteOrder = orders.find(o => o.id === orderIdOrTableId);

    // If order was deleted remotely
    if (!remoteOrder && initialized) {
      // Optional: Handle deletion (e.g. redirect or show alert)
      // For now, we prefer to keep local state so user can re-save if it was accidental
      return;
    }

    if (!remoteOrder) return;

    // Check if dirty (local changes)
    const localItemsStr = JSON.stringify(currentOrder.items || []);
    const remoteItemsStr = JSON.stringify(remoteOrder.items || []);
    const localStatus = currentOrder.status;
    const remoteStatus = remoteOrder.status;

    const isDirty = localItemsStr !== remoteItemsStr;

    // If local changes exist, DO NOT overwrite with remote changes.
    // We only update if clean.
    if (!isDirty) {
      // Only update if there are actual diffs to avoid render loops
      if (localItemsStr !== remoteItemsStr || localStatus !== remoteStatus || currentOrder.notes !== remoteOrder.notes) {
        console.log("Syncing from remote (clean state)");
        setCurrentOrder(remoteOrder);
      }
    } else {
      console.log("Remote update ignored due to unsaved local changes");
    }

  }, [orders, orderIdOrTableId, initialized, currentOrder]);


  // Save draft to localStorage whenever currentOrder changes
  useEffect(() => {
    if (!currentOrder || !orderIdOrTableId || !initialized) return;

    const storageKey = `draft_order_${orderIdOrTableId}`;

    if (currentOrder.status !== 'active') {
      localStorage.removeItem(storageKey);
      return;
    }

    // Don't save if it's empty and new
    if (currentOrder.items?.length === 0 && orderIdOrTableId.startsWith('new-')) {
      return;
    }

    // Determine isDirty for draft purposes (vs Server)
    // If it's a new order, it's always dirty if it has items.
    // If it's an existing order, check vs server.
    // Actually, we just always save the draft if modified. 
    // The previous logic for existence was okay.

    const draftData = {
      order: currentOrder,
      timestamp: Date.now(),
      version: 'v1'
    };

    localStorage.setItem(storageKey, JSON.stringify(draftData));
  }, [currentOrder, orderIdOrTableId, initialized]);


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

    // CRITICAL: Clear draft AND update local status BEFORE calling async backend functions.
    // This prevents the global 'orders' update from triggering a re-render that re-loads the draft
    // before we have a chance to delete it.
    const storageKey = `draft_order_${orderIdOrTableId}`;
    localStorage.removeItem(storageKey);
    setCurrentOrder(prev => prev ? { ...prev, status: orderStatus } : null);

    const newId = await addOrUpdateOrder(orderToSave);

    if (newId) {
      toast({ title: successMessage, description: `Pedido para ${currentOrder.tableId === 'takeaway' ? 'llevar' : `Mesa ${currentOrder.tableId}`}.` });

      if (orderIdOrTableId.startsWith('new-')) {
        router.replace(`/order/${newId}`);
        // Update ID in local state
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

  const handleFullPayment = async (paymentMethod: PaymentMethod, bankName?: string) => {
    if (!currentOrder || !currentOrder.id) return;
    const orderToSave: Order = { ...currentOrder, total, status: 'completed', paymentMethod: paymentMethod, bankName } as Order;

    // CRITICAL: Clear draft and update status immediately
    const storageKey = `draft_order_${orderIdOrTableId}`;
    localStorage.removeItem(storageKey);
    setCurrentOrder(prev => prev ? { ...prev, status: 'completed' } : null);

    await addOrUpdateOrder(orderToSave);

    toast({ title: "Pedido completado", description: `El pedido para la ${currentOrder.tableId === 'takeaway' ? 'llevar' : 'mesa ' + currentOrder.tableId} ha sido finalizado.` });
    setPaymentDialogOpen(false);
    setAmountReceived('');
    router.push(baseRedirectPath);
  }


  const handleCancelOrder = async () => {
    if (!currentOrder) return;

    // CRITICAL: Clear draft immediately
    const storageKey = `draft_order_${orderIdOrTableId}`;
    localStorage.removeItem(storageKey);

    if (currentOrder.id) {
      await cancelOrder(currentOrder.id);
      toast({ variant: "destructive", title: "Pedido Cancelado", description: `El pedido para la ${currentOrder.tableId === 'takeaway' ? 'llevar' : 'mesa ' + currentOrder.tableId} ha sido cancelado.` });
    } else {
      toast({ title: "Borrador descartado", description: "Se ha limpiado el pedido actual." });
    }

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
    <div className="flex flex-col gap-4 p-4 lg:flex-row lg:gap-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-hidden">
      <div className="flex-1 lg:flex-[2]">
        <Card className="flex flex-col h-full lg:overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-4 lg:p-3">
            <div className="flex items-center gap-3 lg:gap-2">
              <AppSidebar />
              <CardTitle className="text-lg lg:text-base">Menú</CardTitle>
              <div className="flex items-center gap-1 lg:gap-0.5 ml-3 lg:ml-2">
                <Button variant="ghost" size="icon" onClick={() => window.location.reload()} title="Recargar App">
                  <RefreshCw className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 gap-1" onClick={() => {
                  const id = prompt("Ingrese el número de la mesa a desbloquear (1-20):");
                  if (id && resetTableLock) {
                    resetTableLock(parseInt(id));
                    toast({ title: "Mesa liberada", description: `Se ha forzado la liberación de la Mesa ${id}.` });
                  }
                }}>
                  <Unlock className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only text-xs">Liberar</span>
                </Button>
              </div>
            </div>
            {!isTakeawayOrder && !isKioskOrder && (
              <Tabs value={activeMenuContext} onValueChange={(value) => setActiveMenuContext(value as MenuContext)} className="w-[220px]">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="salon">Salón</TabsTrigger>
                  <TabsTrigger value="llevar">Llevar</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col">
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

      <div className="flex-1">
        <Card className="flex flex-col h-full lg:overflow-hidden">
          <CardHeader className="p-4 lg:p-3">
            <CardTitle className="text-lg lg:text-base">
              {isKioskOrder ? `Kiosko #${currentOrder.id?.slice(-4)}` :
                tableId === 'takeaway' ? `Para Llevar #${currentOrder.id?.slice(-4)}` :
                  `Mesa ${tableId}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="h-[300px] lg:h-auto lg:flex-1">
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
            <div className="pt-3 lg:pt-2 pr-4">
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
          <CardFooter className="flex-col space-y-3 lg:space-y-2 pt-4 lg:pt-3">
            <div className="flex justify-between w-full text-2xl font-bold text-primary"><span>Total:</span><span>${total.toFixed(2)}</span></div>

            <div className="grid grid-cols-1 gap-2 w-full">
              {currentOrder.status === 'active' && (<Button size="lg" className="lg:h-10" onClick={handleSendToKitchen} disabled={!currentOrder.items || currentOrder.items.length === 0}><Send className="mr-2 h-4 w-4" /> Enviar a Cocina</Button>)}
              {currentOrder.status === 'preparing' && (
                <div className="grid grid-cols-1 gap-2 w-full">
                  {hasUnsentChanges && (<Button size="lg" className="lg:h-10" onClick={() => saveOrderAndNavigate('preparing', 'Actualización enviada a cocina')}><Send className="mr-2 h-4 w-4" /> Enviar Actualización a Cocina</Button>)}

                  <Button size="lg" className="lg:h-10 bg-green-600 hover:bg-green-700 text-white" onClick={() => setPaymentDialogOpen(true)}>Finalizar y Cobrar</Button>
                </div>
              )}

              {isTakeawayOrder && currentOrder.status === 'completed' && !currentOrder.delivered && (
                <Button
                  size="lg"
                  className="lg:h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold animate-in fade-in zoom-in"
                  onClick={async () => {
                    await addOrUpdateOrder({ ...currentOrder, delivered: true } as Order);
                    toast({ title: "Pedido Entregado", description: "El pedido ha sido marcado como entregado satisfactoriamente." });
                    router.push(baseRedirectPath);
                  }}
                >
                  <CheckCircle className="mr-2 h-5 w-5" /> MARCAR COMO ENTREGADO
                </Button>
              )}

              {(currentOrder.status === 'active' || currentOrder.status === 'preparing') && (currentOrder.id || (currentOrder.items && currentOrder.items.length > 0)) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button size="lg" className="lg:h-10" variant="destructive"><XCircle className="mr-2 h-4 w-4" /> Desechar Pedido</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>¿Estás seguro de desechar este pedido?</AlertDialogTitle><AlertDialogDescription>Esta acción es irreversible y solo debe hacerse si el cliente ya no quiere el pedido. El pedido será marcado como cancelado y se notificará a la cocina.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>No, mantener pedido</AlertDialogCancel><AlertDialogAction onClick={handleCancelOrder}>Sí, desechar pedido</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button size="lg" className="lg:h-10" variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
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
            {selectedPlato?.variants?.filter((v: MenuItemVariant) => activeMenuContext === 'llevar' ? v.contexto === 'llevar' : v.contexto === 'salon').map((variante: MenuItemVariant) => (
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
            min="0"
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
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Finalizar y Cobrar Pedido</DialogTitle>
            <DialogDescription>Seleccione el método de pago para completar la transacción.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center space-y-2 bg-muted/30 p-4 rounded-lg">
              <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total a Pagar</span>
              <span className="text-5xl font-bold text-primary">${total.toFixed(2)}</span>
            </div>

            <Tabs defaultValue="Efectivo" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-12 mb-6">
                <TabsTrigger value="Efectivo" className="text-base"><Banknote className="mr-2 h-5 w-5" /> Efectivo</TabsTrigger>
                <TabsTrigger value="DeUna" className="text-base font-bold">DeUna</TabsTrigger>
                <TabsTrigger value="Transferencia" className="text-base"><Smartphone className="mr-2 h-5 w-5" /> Transferencia</TabsTrigger>
              </TabsList>

              <TabsContent value="Efectivo" className="mt-0">
                <form onSubmit={(e) => { e.preventDefault(); handleFullPayment('Efectivo'); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col justify-center space-y-6">
                      <div className="space-y-4 max-w-sm mx-auto w-full">
                        <div className="space-y-2">
                          <label htmlFor="amount-received" className="text-sm font-medium text-muted-foreground ml-1">Monto Recibido</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
                            <Input
                              id="amount-received"
                              type="number"
                              min="0"
                              placeholder="0.00"
                              value={amountReceived}
                              onChange={(e) => setAmountReceived(e.target.value)}
                              autoFocus
                              className="text-right text-3xl h-16 pl-8 font-bold"
                              step="0.01"
                            />
                          </div>
                        </div>



                        {amountReceived !== '' && parseFloat(amountReceived) >= total ? (
                          <div className="bg-green-100 dark:bg-green-900/40 p-6 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-sm animate-in fade-in slide-in-from-top-2">
                            <p className="text-green-800 dark:text-green-300 text-xs uppercase tracking-wider font-bold text-center mb-1">Cambio a Entregar</p>
                            <p className="text-green-800 dark:text-green-300 font-black text-center text-5xl">${change.toFixed(2)}</p>
                          </div>
                        ) : (
                          <div className="h-[120px] flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 text-muted-foreground/50">
                            <p className="text-sm font-medium">Esperando monto recibido...</p>
                          </div>
                        )}

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full h-16 text-2xl font-black mt-2 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                          disabled={parseFloat(amountReceived || '0') < (total - 0.01)}
                        >
                          COBRAR
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-center border-l-0 md:border-l pl-0 md:pl-8">
                      <NumericKeypad
                        value={amountReceived}
                        onChange={setAmountReceived}
                        confirmLabel="Cambio Exacto"
                        confirmIcon={<RefreshCw className="mr-2 h-5 w-5" />}
                        onConfirm={() => {
                          setAmountReceived(total.toFixed(2));
                        }}
                        className="w-full max-w-[320px]"
                      />
                    </div>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="DeUna">
                <div className="flex flex-col items-center justify-center py-8 space-y-6">
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                    <Smartphone className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">Pago con DeUna</h3>
                    <p className="text-muted-foreground max-w-md">Solicita al cliente que realice el pago por el monto exacto de <span className="font-bold text-foreground">${total.toFixed(2)}</span></p>
                  </div>
                  <Button size="lg" className="w-full max-w-sm h-14 text-lg" onClick={() => handleFullPayment('DeUna')}>Confirmar Pago Recibido</Button>
                </div>
              </TabsContent>

              <TabsContent value="Transferencia">
                <div className="flex flex-col items-center justify-center py-6 space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">Pago con Transferencia</h3>
                    <p className="text-muted-foreground max-w-md">Selecciona el banco destino para la transferencia de <span className="font-bold text-foreground">${total.toFixed(2)}</span></p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl px-4">
                    {banks.map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBank(bank.name)}
                        className={`p-4 rounded-xl border-2 transition-all text-center font-bold ${selectedBank === bank.name
                          ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                      >
                        {bank.name}
                      </button>
                    ))}
                  </div>

                  <Button
                    size="lg"
                    className="w-full max-w-sm h-14 text-lg bg-purple-600 hover:bg-purple-700 mt-4"
                    onClick={() => handleFullPayment('Transferencia', selectedBank)}
                    disabled={!selectedBank}
                  >
                    Confirmar Pago: {selectedBank || 'Seleccione Banco'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
