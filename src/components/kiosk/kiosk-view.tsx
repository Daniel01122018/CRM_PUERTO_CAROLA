"use client";

import { useEffect, useState, useMemo } from "react";
import { useMenu } from "@/hooks/use-menu";
import { useAppStore } from "@/hooks/use-app-store";
import { Order, MenuItem } from "@/types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { KioskMenuItemCard } from "@/components/kiosk/kiosk-menu-item-card";
import { FloatingCartButton } from "@/components/kiosk/floating-cart-button";
import { useToast } from "@/hooks/use-toast";
import { KioskVariantModal } from "@/components/kiosk/kiosk-variant-modal";

// Adapter to convert FirestoreItem to MenuItem
const adaptItem = (fireItem: any): MenuItem => {
    return {
        id: parseInt(fireItem.id) || fireItem.oldId || 0,
        nombre: fireItem.name,
        precio: fireItem.price,
        category: "Platos",
        variantes: fireItem.variants,
        sabores: fireItem.flavors,
        paraLlevar: fireItem.paraLlevar,
        contexto: 'salon',
        // @ts-ignore
        categoryName: fireItem.categoryName
    };
};

export function KioskView() {
    const router = useRouter();
    const { toast } = useToast();
    const { categories, items: firestoreItems, loading } = useMenu();
    const { addOrUpdateOrder } = useAppStore();

    const [activeCategory, setActiveCategory] = useState<string>("Platos");
    const [currentOrder, setCurrentOrder] = useState<Partial<Order>>({
        tableId: 'kiosk',
        items: [],
        status: 'active',
        createdAt: Date.now(),
        total: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Variant Modal State
    const [selectedItemForVariant, setSelectedItemForVariant] = useState<MenuItem | null>(null);
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

    // Initial load
    useEffect(() => {
        if (categories.length > 0 && activeCategory === "Platos") {
            // Optional: Set to first category
        }

        setCurrentOrder({
            tableId: 'kiosk',
            items: [],
            status: 'active',
            createdAt: Date.now(),
            total: 0,
        });
    }, [categories]);

    // Derived state
    const menuItems: MenuItem[] = useMemo(() => {
        return firestoreItems.map(adaptItem);
    }, [firestoreItems]);

    const currentItems = useMemo(() => {
        if (!activeCategory) return [];
        return menuItems.filter((item, index) => {
            const original = firestoreItems[index];
            return original.categoryName === activeCategory;
        });
    }, [activeCategory, menuItems, firestoreItems]);

    const orderTotal = useMemo(() => {
        return currentOrder.items?.reduce((sum, item) => {
            let price = item.customPrice;
            if (price === undefined) {
                const menuItem = menuItems.find(i => i.id === item.menuItemId);
                price = menuItem?.precio || 0;
            }
            return sum + (price * item.quantity);
        }, 0) || 0;
    }, [currentOrder.items, menuItems]);

    // Handlers
    const handleAddItemWrapper = (item: MenuItem, quantity: number = 1, notes: string = "") => {
        const hasVariants = item.variantes && item.variantes.length > 0;
        if (hasVariants) {
            setSelectedItemForVariant(item);
            setIsVariantModalOpen(true);
            return;
        }
        handleAddItem(item, quantity, notes);
    };

    const handleAddItem = (item: any, quantity: number = 1, notes: string = "", customPrice?: number) => {
        setCurrentOrder(prev => {
            const existingItemIndex = prev.items?.findIndex(
                i => i.menuItemId === item.id &&
                    i.notes === notes &&
                    i.customPrice === customPrice
            );

            let newItems = [...(prev.items || [])];

            if (existingItemIndex !== undefined && existingItemIndex >= 0) {
                newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    quantity: newItems[existingItemIndex].quantity + quantity
                };
            } else {
                newItems.push({
                    menuItemId: item.id,
                    quantity,
                    notes,
                    customPrice,
                    contexto: 'salon'
                });
            }

            return {
                ...prev,
                items: newItems,
                total: orderTotal
            };
        });

        toast({
            title: "✨ Agregado al carrito",
            description: `${quantity}x ${item.nombre || item.name}`,
            duration: 1500,
        });
    };

    const handleUpdateQuantity = (index: number, change: number) => {
        setCurrentOrder(prev => {
            const newItems = [...(prev.items || [])];
            const item = newItems[index];

            if (!item) return prev;

            const newQuantity = item.quantity + change;

            if (newQuantity <= 0) {
                newItems.splice(index, 1);
            } else {
                newItems[index] = { ...item, quantity: newQuantity };
            }

            return {
                ...prev,
                items: newItems
            };
        });
    };

    const handleSubmitOrder = async () => {
        if (!currentOrder.items || currentOrder.items.length === 0) return;

        try {
            setIsSubmitting(true);
            const orderToSubmit = {
                ...currentOrder,
                status: 'preparing' as const,
                total: orderTotal,
                createdAt: Date.now(),
            };

            const newId = await addOrUpdateOrder(orderToSubmit as Order);

            const orderNumber = newId.slice(-4);
            router.push(`/autoservice/success?id=${orderNumber}`);

        } catch (error) {
            console.error("Error submitting order:", error);
            toast({
                title: "Error",
                description: "No se pudo enviar el pedido. Intente nuevamente.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-16 w-16 animate-spin text-white drop-shadow-2xl" />
                    <span className="text-2xl font-black text-white drop-shadow-lg animate-pulse">
                        Cargando menú delicioso...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-32 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Header with glassmorphism */}
            <header className="bg-white/80 backdrop-blur-xl shadow-xl sticky top-0 z-20 border-b-4 border-gradient-to-r from-purple-500 via-pink-500 to-red-500">
                <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="flex items-center gap-2 text-lg hover:bg-white/50 rounded-xl px-6 h-14 font-bold transition-all hover:scale-105">
                            <ArrowLeft className="h-6 w-6" />
                            Salir
                        </Button>
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                        <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                            AUTOSERVICIO
                        </h1>
                        <Sparkles className="h-7 w-7 text-yellow-500 animate-pulse" />
                    </div>

                    <div className="w-32" />
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
                <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                    {/* Category tabs with premium styling */}
                    <TabsList className="w-full h-20 bg-white/90 backdrop-blur-lg p-2 shadow-2xl rounded-2xl mb-10 flex justify-start overflow-x-auto gap-2 border-2 border-white/50">
                        {categories.map(cat => (
                            <TabsTrigger
                                key={cat.id}
                                value={cat.name}
                                className="flex-1 min-w-[140px] h-full text-lg font-black rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:via-pink-600 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-purple-500/50 data-[state=active]:scale-105 hover:bg-gray-100 data-[state=inactive]:text-gray-600"
                            >
                                {cat.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Menu items grid with staggered animation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {currentItems.map((item, idx) => (
                            <div
                                key={item.id || idx}
                                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <KioskMenuItemCard
                                    item={item}
                                    onAdd={(quantity, notes) => handleAddItemWrapper(item, quantity, notes)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Empty state */}
                    {currentItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Sparkles className="h-20 w-20 mb-4 opacity-20" />
                            <p className="text-2xl font-bold">No hay productos en esta categoría</p>
                        </div>
                    )}
                </Tabs>
            </main>

            <FloatingCartButton
                orderItems={currentOrder.items || []}
                menuItems={menuItems}
                total={orderTotal}
                onUpdateQuantity={handleUpdateQuantity}
                onSubmit={handleSubmitOrder}
                isSubmitting={isSubmitting}
            />

            <KioskVariantModal
                item={selectedItemForVariant}
                isOpen={isVariantModalOpen}
                onClose={() => setIsVariantModalOpen(false)}
                onAdd={handleAddItem}
            />
        </div>
    );
}
