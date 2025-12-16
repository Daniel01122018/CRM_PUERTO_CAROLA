"use client";

import { useState } from "react";
import { OrderItem, MenuItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FloatingCartButtonProps {
    orderItems: OrderItem[];
    menuItems: MenuItem[];
    total: number;
    onUpdateQuantity: (index: number, change: number) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

export function FloatingCartButton({
    orderItems,
    menuItems,
    total,
    onUpdateQuantity,
    onSubmit,
    isSubmitting
}: FloatingCartButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    const itemCount = orderItems.reduce((acc, item) => acc + item.quantity, 0);

    if (itemCount === 0 && !isOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-transparent pointer-events-none">
            <div className="max-w-7xl mx-auto pointer-events-auto flex justify-end">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button
                            size="lg"
                            className="h-20 px-10 rounded-3xl shadow-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white border-4 border-white flex items-center gap-5 animate-in slide-in-from-bottom zoom-in hover:scale-110 transition-all duration-300"
                        >
                            {/* Cart icon with badge */}
                            <div className="relative">
                                <ShoppingCart className="h-8 w-8" />
                                <span className="absolute -top-3 -right-3 bg-yellow-400 text-purple-900 text-sm font-black w-7 h-7 rounded-full flex items-center justify-center border-3 border-white shadow-lg animate-bounce">
                                    {itemCount}
                                </span>
                            </div>

                            {/* Separator */}
                            <div className="h-12 w-[2px] bg-white/30" />

                            {/* Total section */}
                            <div className="flex flex-col items-start">
                                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Total</span>
                                <span className="text-2xl font-black text-white drop-shadow-lg">
                                    ${total.toFixed(2)}
                                </span>
                            </div>

                            {/* Sparkle effect */}
                            <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                        </Button>
                    </SheetTrigger>

                    <SheetContent side="bottom" className="h-[88vh] rounded-t-3xl px-0 flex flex-col bg-gradient-to-b from-white to-gray-50 border-t-8 border-gradient-to-r from-purple-500 via-pink-500 to-red-500">
                        {/* Header */}
                        <SheetHeader className="px-8 pb-6 border-b-2 border-gray-200">
                            <div className="flex items-center justify-center gap-3">
                                <ShoppingCart className="h-8 w-8 text-purple-600" />
                                <SheetTitle className="text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                                    Tu Pedido
                                </SheetTitle>
                                <Sparkles className="h-6 w-6 text-yellow-500" />
                            </div>
                            {itemCount > 0 && (
                                <p className="text-center text-sm text-gray-500 font-medium mt-2">
                                    {itemCount} {itemCount === 1 ? 'producto' : 'productos'} en tu carrito
                                </p>
                            )}
                        </SheetHeader>

                        {/* Items list */}
                        <ScrollArea className="flex-1 px-8 py-6">
                            {orderItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-6">
                                        <ShoppingCart className="h-16 w-16 text-purple-300" />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-500">Tu carrito está vacío</p>
                                    <p className="text-sm text-gray-400 mt-2">Agrega productos para continuar</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orderItems.map((item, index) => {
                                        const menuItem = menuItems.find(i => i.id === item.menuItemId);
                                        const price = item.customPrice || menuItem?.precio || 0;
                                        const subtotal = price * item.quantity;

                                        return (
                                            <Card
                                                key={`${item.menuItemId}-${index}`}
                                                className="border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white rounded-2xl"
                                            >
                                                <CardContent className="p-5 flex items-center justify-between">
                                                    {/* Item info */}
                                                    <div className="flex-1">
                                                        <h4 className="font-black text-lg text-gray-900">
                                                            {menuItem?.nombre || "Item Desconocido"}
                                                        </h4>
                                                        {item.notes && (
                                                            <p className="text-sm text-purple-600 italic mt-1 font-medium">
                                                                "{item.notes}"
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-lg font-bold text-gray-700">
                                                                ${price.toFixed(2)}
                                                            </span>
                                                            <span className="text-gray-400">×</span>
                                                            <span className="text-lg font-bold text-gray-700">
                                                                {item.quantity}
                                                            </span>
                                                            <span className="text-gray-400">=</span>
                                                            <span className="text-xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                                                ${subtotal.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Quantity controls */}
                                                    <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl shadow-inner border-2 border-gray-200 p-1.5 ml-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110"
                                                            onClick={() => onUpdateQuantity(index, -1)}
                                                        >
                                                            {item.quantity === 1 ?
                                                                <Trash2 className="h-5 w-5" /> :
                                                                <Minus className="h-5 w-5" />
                                                            }
                                                        </Button>
                                                        <span className="w-12 text-center font-black text-xl text-gray-900">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all hover:scale-110"
                                                            onClick={() => onUpdateQuantity(index, 1)}
                                                        >
                                                            <Plus className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Footer with total and submit */}
                        <div className="p-8 border-t-2 border-gray-200 bg-white safe-area-bottom">
                            {/* Total display */}
                            <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-purple-50 via-pink-50 to-red-50 rounded-2xl p-6 border-2 border-purple-200">
                                <div>
                                    <span className="text-gray-600 font-bold text-lg uppercase tracking-wide">Total a Pagar</span>
                                    <p className="text-xs text-gray-500 mt-1">Impuestos incluidos</p>
                                </div>
                                <span className="text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                                    ${total.toFixed(2)}
                                </span>
                            </div>

                            {/* Submit button */}
                            <Button
                                className="w-full h-16 text-xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 rounded-2xl shadow-2xl shadow-purple-300/50 hover:shadow-purple-400/60 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-purple-400/30"
                                disabled={orderItems.length === 0 || isSubmitting}
                                onClick={onSubmit}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-3">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                                        Procesando...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-3">
                                        <Sparkles className="h-6 w-6" />
                                        CONFIRMAR PEDIDO
                                        <ArrowRight className="h-6 w-6" />
                                    </span>
                                )}
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
