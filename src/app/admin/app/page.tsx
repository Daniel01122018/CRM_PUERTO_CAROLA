"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Smartphone, ShoppingCart, UtensilsCrossed } from 'lucide-react';

// Import the content from the separate pages
import AppMenuContent from './menu-content';
import AppOrdersContent from './orders-content';

export default function AppManagementPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('orders');

    return (
        <div className="flex flex-col min-h-screen p-6 gap-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/admin/dashboard')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                    <Smartphone className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Aplicación</h1>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="orders" className="gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Pedidos
                    </TabsTrigger>
                    <TabsTrigger value="menu" className="gap-2">
                        <UtensilsCrossed className="h-4 w-4" />
                        Menú
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="flex-1 mt-4">
                    <AppOrdersContent />
                </TabsContent>

                <TabsContent value="menu" className="flex-1 mt-4">
                    <AppMenuContent />
                </TabsContent>
            </Tabs>
        </div>
    );
}
