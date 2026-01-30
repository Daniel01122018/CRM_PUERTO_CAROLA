"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Smartphone, ShoppingCart, UtensilsCrossed, LayoutDashboard, Settings, Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from '@/hooks/use-app-store';

// Import the content from the separate pages
import AppMenuContent from './menu-content';
import AppOrdersContent from './orders-content';
import AppDashboardView from './dashboard-view';

type View = 'dashboard' | 'orders' | 'menu' | 'settings';

export default function AppManagementPage() {
    const router = useRouter();
    const [activeView, setActiveView] = useState<View>('dashboard');
    const { currentUser } = useAppStore();

    const menuItems = [
        { id: 'dashboard', label: 'Resumen Global', icon: LayoutDashboard },
        { id: 'orders', label: 'Gestión de Pedidos', icon: ShoppingCart },
        { id: 'menu', label: 'Catálogo App', icon: UtensilsCrossed },
        { id: 'settings', label: 'Configuración', icon: Settings },
    ];

    return (
        <div className="flex bg-muted/20 min-h-[calc(100vh-4rem)] rounded-xl border border-border/50 overflow-hidden shadow-sm">
            {/* Inner Sidebar Navigation */}
            <aside className="w-64 bg-background border-r border-border/50 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg leading-tight">Puerto Carola</h2>
                            <p className="text-xs text-muted-foreground font-medium">App Hub</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id as View)}
                            className={cn(
                                "flex items-center w-full gap-3 px-3 py-3 rounded-lg transition-all text-sm font-medium",
                                activeView === item.id
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-border/50">
                    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" onClick={() => router.push('/admin/dashboard')}>
                        <ArrowLeft className="h-4 w-4" />
                        Volver al CRM
                    </Button>
                </div>
            </aside>

            {/* Mobile Navigation (Simple top bar for small screens) */}
            <div className="md:hidden flex flex-col w-full">
                {/* Note: In a real mobile implementation, we'd use a Sheet/Drawer here. 
                   For now, we rely on the main CRM shell for mobile nav or simplify. */}
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Module Header */}
                <header className="h-16 border-b border-border/50 bg-background/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-full max-w-md hidden sm:block">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar en la aplicación..."
                                className="pl-9 bg-muted/20 border-transparent focus:bg-background transition-colors"
                            />
                        </div>
                        {/* Mobile Menu Toggle would go here */}
                        <div className="md:hidden flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Smartphone className="h-5 w-5" />
                            </div>
                            <span className="font-bold">App Hub</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <div className="h-8 w-[1px] bg-border/50 mx-1"></div>
                        <div className="flex items-center gap-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold leading-none">{currentUser?.username || 'Admin'}</p>
                                <p className="text-xs text-muted-foreground">Administrador</p>
                            </div>
                            <Avatar className="h-9 w-9 border border-border">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.username}`} />
                                <AvatarFallback>{currentUser?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </header>

                {/* View Content */}
                <div className="flex-1 overflow-auto bg-muted/10 relative">
                    {/* Floating Emergency/Action Button - Always visible on top right of content area */}
                    <div className="absolute top-6 right-8 z-20 hidden lg:block">
                        {/* Example global action */}
                    </div>

                    {activeView === 'dashboard' && <AppDashboardView />}

                    {activeView === 'orders' && (
                        <div className="p-6 h-full overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight">Gestión de Pedidos</h2>
                                    <p className="text-muted-foreground">Monitorea y procesa órdenes entrantes.</p>
                                </div>
                            </div>
                            <AppOrdersContent />
                        </div>
                    )}

                    {activeView === 'menu' && (
                        <div className="p-6 h-full overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight">Catálogo de la App</h2>
                                    <p className="text-muted-foreground">Gestiona productos, precios y disponibilidad.</p>
                                </div>
                            </div>
                            <AppMenuContent />
                        </div>
                    )}

                    {activeView === 'settings' && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Settings className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h2 className="text-xl font-bold">Configuración en construcción</h2>
                            <p className="text-muted-foreground max-w-md mt-2">
                                Próximamente podrás configurar horarios de atención, zonas de entrega y banners promocionales desde aquí.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
