"use client";

import { MenuItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KioskMenuItemCardProps {
    item: MenuItem;
    onAdd: (quantity: number, notes: string) => void;
}

export function KioskMenuItemCard({ item, onAdd }: KioskMenuItemCardProps) {
    return (
        <Card className="h-full flex flex-col justify-between overflow-hidden hover:shadow-lg transition-shadow border-2 border-transparent active:border-blue-500">
            <div className="h-48 bg-gray-100 relative">
                {/* Placeholder for image */}
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                    <span className="text-4xl font-bold opacity-20">{item.nombre.charAt(0)}</span>
                </div>
                {item.paraLlevar && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500">Para Llevar</Badge>
                )}
            </div>

            <CardContent className="p-4 flex-1 flex flex-col">
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg leading-tight text-gray-900 line-clamp-2">
                            {item.nombre}
                        </h3>
                    </div>

                    <p className="text-xl font-black text-blue-600 mb-4">
                        ${item.precio.toFixed(2)}
                    </p>
                </div>

                <Button
                    size="lg"
                    className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 transition-transform"
                    onClick={() => onAdd(1, "")}
                >
                    <Plus className="mr-2 h-5 w-5" />
                    AGREGAR
                </Button>
            </CardContent>
        </Card>
    );
}
