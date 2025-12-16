"use client";

import { MenuItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KioskMenuItemCardProps {
    item: MenuItem;
    onAdd: (quantity: number, notes: string) => void;
}

// Generate dynamic gradient based on item name
const getGradientForItem = (name: string): string => {
    const gradients = [
        "from-purple-400 via-pink-500 to-red-500",
        "from-blue-400 via-cyan-500 to-teal-500",
        "from-orange-400 via-red-500 to-pink-500",
        "from-green-400 via-emerald-500 to-teal-500",
        "from-yellow-400 via-orange-500 to-red-500",
        "from-indigo-400 via-purple-500 to-pink-500",
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
};

export function KioskMenuItemCard({ item, onAdd }: KioskMenuItemCardProps) {
    const gradient = getGradientForItem(item.nombre);

    return (
        <Card className="group h-full flex flex-col justify-between overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white rounded-2xl">
            {/* Image/Gradient Section */}
            <div className="relative h-56 overflow-hidden">
                {/* Dynamic gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />

                {/* Glassmorphism overlay */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

                {/* Animated circles */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-white/20 rounded-full blur-2xl animate-pulse" />
                <div className="absolute bottom-8 left-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                {/* Item initial letter as design element */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-9xl font-black text-white/30 select-none">
                        {item.nombre.charAt(0)}
                    </span>
                </div>

                {/* Sparkle icon for premium feel */}
                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Sparkles className="h-6 w-6 text-white drop-shadow-lg animate-pulse" />
                </div>

                {/* Para llevar badge */}
                {item.paraLlevar && (
                    <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold border-2 border-white shadow-lg px-3 py-1">
                        Para Llevar
                    </Badge>
                )}

                {/* Price tag overlay */}
                <div className="absolute bottom-0 right-0 bg-gradient-to-tl from-black/80 via-black/60 to-transparent px-6 py-4 rounded-tl-3xl">
                    <p className="text-3xl font-black text-white drop-shadow-lg">
                        ${item.precio.toFixed(2)}
                    </p>
                </div>
            </div>

            <CardContent className="p-5 flex-1 flex flex-col bg-gradient-to-b from-white to-gray-50">
                <div className="flex-1 mb-4">
                    <h3 className="font-black text-xl leading-tight text-gray-900 line-clamp-2 mb-1">
                        {item.nombre}
                    </h3>

                    {/* Variants indicator */}
                    {item.variantes && item.variantes.length > 0 && (
                        <p className="text-xs text-purple-600 font-semibold mt-2 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {item.variantes.length} opciones disponibles
                        </p>
                    )}
                </div>

                {/* Add button with gradient */}
                <Button
                    size="lg"
                    className="w-full h-14 text-lg font-black bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white rounded-xl shadow-xl shadow-blue-300/50 hover:shadow-2xl hover:shadow-blue-400/60 active:scale-95 transition-all duration-300 border-2 border-blue-400/30"
                    onClick={() => onAdd(1, "")}
                >
                    <div className="flex items-center gap-2">
                        <Plus className="h-6 w-6 font-bold" />
                        <span className="tracking-wide">AGREGAR</span>
                    </div>
                </Button>
            </CardContent>
        </Card>
    );
}
