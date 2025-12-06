"use client";

import { useState } from "react";
import { OrderItem, MenuItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
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

    // Calculate total count
    const itemCount = orderItems.reduce((acc, item) => acc + item.quantity, 0);

    // If empty, hide button unless open
    if (itemCount === 0 && !isOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-transparent pointer-events-none">
            <div className="max-w-7xl mx-auto pointer-events-auto flex justify-end">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button
                            size="lg"
                            className="h-16 px-8 rounded-full shadow-2xl bg-black text-white hover:bg-gray-900 border-4 border-white flex items-center gap-4 animate-in slide-in-from-bottom"
                        >
                            <div className="relative">
                                <ShoppingCart className="h-6 w-6" />
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-black">
                                    {itemCount}
                                </span>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-xs font-medium text-gray-300">Total a Pagar</span>
                                <span className="text-xl font-bold">${total.toFixed(2)}</span>
                            </div>
                            <div className="h-8 w-[1px] bg-gray-700 mx-2" />
                            <span className="font-bold">Ver Pedido</span>
                        </Button>
                    </SheetTrigger>

                    <SheetContent side="bottom" className="h-[85vh] rounded-t-[2rem] px-0 flex flex-col">
                        <SheetHeader className="px-6 pb-4 border-b">
                            <SheetTitle className="text-2xl font-black text-center">Tu Pedido</SheetTitle>
                        </SheetHeader>

                        <ScrollArea className="flex-1 px-6 py-4">
                            {orderItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                                    <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                                    <p>Tu carrito está vacío</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orderItems.map((item, index) => {
                                        const menuItem = menuItems.find(i => i.id === item.menuItemId);
                                        const price = item.customPrice || menuItem?.precio || 0;
                                        const subtotal = price * item.quantity;

                                        return (
                                            <Card key={`${item.menuItemId}-${index}`} className="border-none shadow-sm bg-gray-50">
                                                <CardContent className="p-4 flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900">{menuItem?.nombre || "Item Desconocido"}</h4>
                                                        {item.notes && <p className="text-sm text-gray-500 italic mt-1">"{item.notes}"</p>}
                                                        <div className="text-blue-600 font-bold mt-1">
                                                            ${price.toFixed(2)} x {item.quantity} = ${subtotal.toFixed(2)}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center bg-white rounded-lg shadow-sm border p-1 ml-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => onUpdateQuantity(index, -1)}
                                                        >
                                                            {item.quantity === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                                                        </Button>
                                                        <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => onUpdateQuantity(index, 1)}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>

                        <div className="p-6 border-t bg-white safe-area-bottom">
                            <div className="flex justify-between items-end mb-6">
                                <span className="text-gray-500 font-medium">Total</span>
                                <span className="text-4xl font-black text-gray-900">${total.toFixed(2)}</span>
                            </div>

                            <Button
                                className="w-full h-14 text-xl font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200"
                                disabled={orderItems.length === 0 || isSubmitting}
                                onClick={onSubmit}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center">Enviando...</span>
                                ) : (
                                    <>
                                        Confirmar Pedido <ArrowRight className="ml-2 h-6 w-6" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
