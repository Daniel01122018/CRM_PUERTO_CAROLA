"use client";

import { MenuItem, MenuItemVariant } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Check, Plus } from "lucide-react";

interface KioskVariantModalProps {
    item: MenuItem | null;
    isOpen: boolean;
    onClose: () => void;
    onAdd: (item: any, quantity: number, notes: string, customPrice?: number) => void;
}

export function KioskVariantModal({ item, isOpen, onClose, onAdd }: KioskVariantModalProps) {
    const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Reset state when modal opens with new item
    useEffect(() => {
        if (isOpen) {
            setSelectedVariant(null);
            setQuantity(1);
        }
    }, [isOpen, item]);

    if (!item) return null;

    const handleConfirm = () => {
        if (!selectedVariant) return;

        // Create a temporary item structure that mimics what handleAddItem expects
        // It basically overrides the ID and Name to match the selected variant
        // But keeps the base item properties
        const variantItem = {
            ...item,
            id: selectedVariant.id, // Use variant ID
            nombre: `${item.nombre} - ${selectedVariant.nombre}`,
            precio: selectedVariant.precio
        };

        onAdd(variantItem, quantity, "", selectedVariant.precio);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-[2rem]">
                <DialogHeader className="p-6 pb-2 bg-gray-50 border-b">
                    <DialogTitle className="text-2xl font-black text-center">
                        Selecciona una opción
                    </DialogTitle>
                    <p className="text-center text-gray-500 font-medium">
                        {item.nombre}
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {item.variantes?.map((variant) => (
                            <div
                                key={variant.id}
                                onClick={() => setSelectedVariant(variant)}
                                className={`
                                    relative p-6 rounded-2xl border-2 cursor-pointer transition-all active:scale-95
                                    ${selectedVariant?.id === variant.id
                                        ? 'border-blue-600 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-xl font-bold ${selectedVariant?.id === variant.id ? 'text-blue-700' : 'text-gray-900'}`}>
                                        {variant.nombre}
                                    </span>
                                    {selectedVariant?.id === variant.id && (
                                        <div className="bg-blue-600 text-white rounded-full p-1">
                                            <Check className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                                <span className={`text-2xl font-black ${selectedVariant?.id === variant.id ? 'text-blue-600' : 'text-gray-500'}`}>
                                    ${variant.precio.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-white border-t">
                    <Button
                        size="lg"
                        className="w-full h-14 text-xl font-bold rounded-xl shadow-lg"
                        disabled={!selectedVariant}
                        onClick={handleConfirm}
                    >
                        <Plus className="mr-2 h-6 w-6" />
                        AGREGAR AL PEDIDO
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
