import React from 'react';
import { Card } from '@/components/ui/card';
import { Smartphone, TrendingUp, Users, Activity, CheckCircle, ShoppingBag, Globe, Server } from 'lucide-react';
import { useAppOrders } from '@/hooks/use-app-orders';
import { useAppMenu } from '@/hooks/use-app-menu';

export default function AppDashboardView() {
    const { activeOrders } = useAppOrders();
    const { items, categories } = useAppMenu();

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-4 sm:p-8 space-y-8 animate-fade-in">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="flex flex-col gap-2 p-6 border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors group relative overflow-hidden">
                        <div className="flex items-center justify-between mb-2 z-10">
                            <p className="text-muted-foreground text-sm font-medium">Pedidos Activos</p>
                            <ShoppingBag className="text-primary group-hover:scale-110 transition-transform h-5 w-5" />
                        </div>
                        <p className="text-3xl font-black leading-tight z-10">{activeOrders.length}</p>
                        <div className="flex items-center gap-1 mt-1 z-10">
                            <TrendingUp className="text-primary h-4 w-4" />
                            <p className="text-primary text-sm font-bold">En tiempo real</p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
                    </Card>

                    <Card className="flex flex-col gap-2 p-6 border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors group relative overflow-hidden">
                        <div className="flex items-center justify-between mb-2 z-10">
                            <p className="text-muted-foreground text-sm font-medium">Catálogo App</p>
                            <Smartphone className="text-primary group-hover:scale-110 transition-transform h-5 w-5" />
                        </div>
                        <p className="text-3xl font-black leading-tight z-10">{items.length}</p>
                        <div className="flex items-center gap-1 mt-1 z-10">
                            <p className="text-muted-foreground text-sm">Items en {categories.length} categorías</p>
                        </div>
                    </Card>

                    <Card className="flex flex-col gap-2 p-6 border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors group relative overflow-hidden">
                        <div className="flex items-center justify-between mb-2 z-10">
                            <p className="text-muted-foreground text-sm font-medium">Usuarios App</p>
                            <Users className="text-primary group-hover:scale-110 transition-transform h-5 w-5" />
                        </div>
                        <p className="text-3xl font-black leading-tight z-10">~50</p>
                        <div className="flex items-center gap-1 mt-1 z-10">
                            <p className="text-muted-foreground text-sm">Clientes registrados</p>
                        </div>
                    </Card>

                    <Card className="flex flex-col gap-2 p-6 border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors group relative overflow-hidden">
                        <div className="flex items-center justify-between mb-2 z-10">
                            <p className="text-muted-foreground text-sm font-medium">Estado Sistema</p>
                            <Activity className="text-primary group-hover:scale-110 transition-transform h-5 w-5" />
                        </div>
                        <p className="text-2xl font-black leading-tight z-10">Operativo</p>
                        <div className="flex items-center gap-1 mt-1 z-10">
                            <CheckCircle className="text-primary h-4 w-4" />
                            <p className="text-primary text-sm font-bold">Todo funcionando</p>
                        </div>
                    </Card>
                </div>

                {/* Secondary Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Service Status List */}
                    <Card className="lg:col-span-2 flex flex-col border-primary/20 overflow-hidden bg-background/50 backdrop-blur-sm">
                        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Server className="h-5 w-5 text-primary" />
                                Estado de Servicios
                            </h3>
                            <button className="text-primary text-sm font-bold hover:underline">Ver Logs</button>
                        </div>
                        <div className="flex flex-col divide-y divide-border/50">
                            <div className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="font-bold">Base de Datos (Firestore)</p>
                                        <p className="text-xs text-muted-foreground">Lecturas/Escrituras normales</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase tracking-wider border border-green-500/20">Operativo</span>
                            </div>

                            <div className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="relative flex h-3 w-3">
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="font-bold">Notificaciones Push</p>
                                        <p className="text-xs text-muted-foreground">Sin cola de espera</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase tracking-wider border border-green-500/20">Operativo</span>
                            </div>

                            <div className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="relative flex h-3 w-3">
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="font-bold">Sincronización POS</p>
                                        <p className="text-xs text-muted-foreground">Última sync automática</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase tracking-wider border border-green-500/20">Operativo</span>
                            </div>
                        </div>
                    </Card>

                    {/* App Store Availability */}
                    <div className="flex flex-col gap-6">
                        <Card className="flex flex-col border-primary/20 p-6 bg-background/50">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary" />
                                Disponibilidad
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <svg className="h-5 w-5 fill-current text-muted-foreground" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.3-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.21-1.96 1.07-3.11-1.05.05-2.31.74-3.03 1.59-.67.79-1.25 1.95-1.13 3.09 1.17.09 2.36-.73 3.09-1.57z" /></svg>
                                        <p className="text-sm font-medium">Apple App Store</p>
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <svg className="h-5 w-5 fill-current text-muted-foreground" viewBox="0 0 24 24"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1527-.5676.416.416 0 00-.5676.1527l-2.0225 3.503c-1.4654-.675-3.1492-1.0583-4.9606-1.071l-.0095.003L12 7.876c-1.802.0001-3.477.378-4.9365 1.0465l-2.016-3.4912a.416.416 0 00-.5676-.1527.416.416 0 00-.1527.5676l1.9904 3.447C2.793 11.218 0 15.221 0 19.897h24c0-4.6937-2.813-8.7126-6.1185-10.5756" /></svg>
                                        <p className="text-sm font-medium">Google Play Store</p>
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
                                </div>
                            </div>
                        </Card>

                        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-6 relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-primary animate-pulse" />
                                <h3 className="font-bold text-xs uppercase tracking-widest text-primary">Estado Global</h3>
                            </div>
                            <p className="text-2xl font-bold mb-1">Sistema Estable</p>
                            <p className="text-xs text-muted-foreground">Todos los sistemas operativos.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
