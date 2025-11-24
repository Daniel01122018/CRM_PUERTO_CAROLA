import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, PlusCircle, MinusCircle, Edit, Trash2 } from "lucide-react";
import { FirestoreItem } from "@/hooks/use-menu";
import { useState } from "react";

interface MenuItemCardProps {
    item: FirestoreItem;
    mode: 'order' | 'edit';
    onAdd?: (item: FirestoreItem, quantity: number, notes?: string, customPrice?: number) => void;
    onRemove?: (item: FirestoreItem) => void;
    onEdit?: (item: FirestoreItem) => void;
    onDelete?: (item: FirestoreItem) => void;
    quantityInOrder?: number;
    activeContext?: 'salon' | 'llevar';
}

export function MenuItemCard({ item, mode, onAdd, onRemove, onEdit, onDelete, quantityInOrder = 0, activeContext = 'salon' }: MenuItemCardProps) {
    const [openFlavorPopover, setOpenFlavorPopover] = useState(false);

    // Filter logic for 'order' mode is handled by parent or here?
    // Let's assume parent filters items, but we handle variants display if needed.

    if (mode === 'edit') {
        return (
            <Card className="overflow-hidden">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {item.type === 'plato' ? 'Variantes múltiples' : `$${item.price.toFixed(2)}`}
                        </p>
                        {item.paraLlevar && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Para Llevar</span>}
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                        <Button variant="outline" size="icon" onClick={() => onEdit?.(item)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => onDelete?.(item)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Order Mode
    if (item.type === 'plato') {
        return (
            <Card
                className="overflow-hidden cursor-pointer hover:bg-muted transition-colors"
                onClick={() => onAdd?.(item, 1)} // For platos, this usually opens a modal in parent
            >
                <CardContent className="p-8 flex items-center justify-center h-full">
                    <p className="font-semibold text-center text-lg">{item.name}</p>
                </CardContent>
            </Card>
        );
    }

    // Simple Item (Bebidas, Adicionales)
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-end gap-2 mt-2">
                    {item.flavors && item.flavors.length > 0 ? (
                        <Popover open={openFlavorPopover} onOpenChange={setOpenFlavorPopover}>
                            <PopoverTrigger asChild>
                                <Button variant="outline"><Plus className="mr-2 h-4 w-4" />Añadir</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto">
                                <div className="flex flex-col gap-2">
                                    <p className="font-semibold text-sm">Seleccione un sabor:</p>
                                    {item.flavors.map(sabor => (
                                        <Button
                                            key={sabor}
                                            variant="ghost"
                                            className="justify-start"
                                            onClick={() => {
                                                onAdd?.(item, 1, sabor);
                                                setOpenFlavorPopover(false);
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
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onAdd?.(item, -1)} disabled={quantityInOrder === 0}><MinusCircle className="h-4 w-4" /></Button>
                            <span className="font-bold w-4 text-center">{quantityInOrder}</span>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onAdd?.(item, 1)}><PlusCircle className="h-4 w-4" /></Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
