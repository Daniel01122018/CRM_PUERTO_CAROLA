
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/app-header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { MENU_ITEMS } from '@/lib/data';
import type { Order } from '@/types';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, History as HistoryIcon, Search, DollarSign, ShoppingBag, FileText, XCircle } from 'lucide-react';

export default function HistoryPage() {
  const { isMounted, currentUser, orders } = useAppStore();
  const router = useRouter();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'tables' | 'takeaway'>('all');
  const [summaryData, setSummaryData] = useState<{
    totalToday: number;
    ordersTodayCount: number;
    weeklyData: { date: string; Ventas: number }[];
  }>({
    totalToday: 0,
    ordersTodayCount: 0,
    weeklyData: [],
  });

  useEffect(() => {
    if (isMounted && !currentUser) {
      router.push('/');
    }
  }, [currentUser, isMounted, router]);
  
  const completedOrders = useMemo(() => orders
    .filter(o => o.status === 'completed')
    .sort((a, b) => b.createdAt - a.createdAt), [orders]);

  const filteredOrders = useMemo(() => {
    const baseOrders = completedOrders.filter(order => {
      if (filter === 'tables') return order.tableId !== 'takeaway';
      if (filter === 'takeaway') return order.tableId === 'takeaway';
      return true;
    });

    if (!searchTerm) return baseOrders;
    
    return baseOrders.filter(order => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        const tableIdMatch = `mesa ${order.tableId}`.includes(lowerCaseSearch) || (order.tableId === 'takeaway' && 'para llevar'.includes(lowerCaseSearch));
        const orderIdMatch = order.id.toString().includes(lowerCaseSearch);
        const totalMatch = order.total.toFixed(2).includes(lowerCaseSearch);
        const itemMatch = order.items.some(item => {
            const menuItem = MENU_ITEMS.find(mi => mi.id === item.menuItemId);
            return menuItem?.nombre.toLowerCase().includes(lowerCaseSearch);
        });
        return tableIdMatch || orderIdMatch || totalMatch || itemMatch;
    });
  }, [completedOrders, searchTerm, filter]);

  useEffect(() => {
    if (!isMounted) return;

    const today = new Date();
    const todayStart = startOfDay(today);
    
    const todaysOrders = completedOrders.filter(o => isSameDay(new Date(o.createdAt), todayStart));
    const totalToday = todaysOrders.reduce((sum, o) => sum + o.total, 0);

    const weeklyData: { date: string, Ventas: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const day = subDays(today, i);
        const dayStart = startOfDay(day);
        const dailyTotal = completedOrders
            .filter(o => isSameDay(new Date(o.createdAt), dayStart))
            .reduce((sum, o) => sum + o.total, 0);
        
        weeklyData.push({
            date: format(day, 'EEE', { locale: es }),
            Ventas: parseFloat(dailyTotal.toFixed(2)),
        });
    }

    setSummaryData({
      totalToday,
      ordersTodayCount: todaysOrders.length,
      weeklyData,
    });
  }, [completedOrders, isMounted]);
  
  const handlePrintReport = () => {
    window.print();
  };

  if (!isMounted || !currentUser) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 print:p-0">
        <div className="flex items-center justify-between print:hidden">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
                <HistoryIcon className="h-6 w-6" />
                Historial y Reportes
            </h1>
            <Link href="/dashboard">
                <Button variant="outline" className="flex items-center gap-2">
                    <ArrowLeft className="h-5 w-5" />
                    Volver al Salón
                </Button>
            </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:hidden">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ventas de Hoy</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${summaryData.totalToday.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Total facturado en el día</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pedidos de Hoy</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summaryData.ordersTodayCount}</div>
                    <p className="text-xs text-muted-foreground">Número de pedidos completados</p>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-5">
            <div className="lg:col-span-2 xl:col-span-3 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Ventas de la Última Semana</CardTitle>
                        <CardDescription>Resumen de ingresos de los últimos 7 días.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={{ Ventas: { label: "Ventas", color: "hsl(var(--primary))" } }} className="h-[250px] w-full">
                            <BarChart accessibilityLayer data={summaryData.weeklyData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="Ventas" fill="var(--color-Ventas)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between print:hidden">
                        <div>
                            <CardTitle>Todos los Pedidos</CardTitle>
                            <CardDescription>Busca y selecciona un pedido para ver los detalles.</CardDescription>
                        </div>
                         <Button variant="outline" size="sm" onClick={handlePrintReport}>
                            <FileText className="mr-2 h-4 w-4" />
                            Generar Reporte
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4 print:hidden">
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>Todos</Button>
                                <Button size="sm" variant={filter === 'tables' ? 'default' : 'outline'} onClick={() => setFilter('tables')}>Mesas</Button>
                                <Button size="sm" variant={filter === 'takeaway' ? 'default' : 'outline'} onClick={() => setFilter('takeaway')}>Para Llevar</Button>
                            </div>
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="search"
                                    placeholder="Buscar por mesa, ID, total o artículo..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <ScrollArea className="h-[40vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pedido</TableHead>
                                        <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.length > 0 ? filteredOrders.map(order => (
                                        <TableRow key={order.id} onClick={() => setSelectedOrder(order)} className="cursor-pointer">
                                            <TableCell>
                                                <div className="font-medium">
                                                    {order.tableId === 'takeaway' ? 'PARA LLEVAR' : `Mesa ${order.tableId}`}
                                                </div>
                                                <div className="text-xs text-muted-foreground md:hidden">
                                                    {format(new Date(order.createdAt), "dd/MM/yy HH:mm", { locale: es })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                {format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                                            </TableCell>
                                            <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                No se encontraron resultados.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            
            <div className="lg:col-span-1 xl:col-span-2 print:hidden">
                <Card className="sticky top-24">
                    <CardHeader className="flex flex-row items-center justify-between">
                         <CardTitle>Detalles del Pedido</CardTitle>
                         {selectedOrder && (
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedOrder(null)}>
                                <XCircle className="h-5 w-5" />
                             </Button>
                         )}
                    </CardHeader>
                    <CardContent>
                        {selectedOrder ? (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold">{selectedOrder.tableId === 'takeaway' ? 'Pedido para llevar' : `Mesa ${selectedOrder.tableId}`}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(selectedOrder.createdAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">ID: {selectedOrder.id}</p>
                                </div>
                                {selectedOrder.notes && (
                                    <div className="text-sm border-t border-b py-2">
                                        <p className="font-semibold">Notas Generales:</p>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{selectedOrder.notes}</p>
                                    </div>
                                )}
                                <ScrollArea className="h-[45vh]">
                                    <ul className="space-y-2 text-sm pr-4">
                                        {selectedOrder.items.map((item, index) => {
                                            const menuItem = MENU_ITEMS.find(mi => mi.id === item.menuItemId);
                                            return (
                                                <li key={`${item.menuItemId}-${index}`} className="flex justify-between border-b pb-2">
                                                    <div>
                                                        <span className="font-medium">{menuItem?.nombre} x{item.quantity}</span>
                                                        {item.notes && <p className="text-xs text-amber-700">Nota: {item.notes}</p>}
                                                    </div>
                                                    <span>${(menuItem ? menuItem.precio * item.quantity : 0).toFixed(2)}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </ScrollArea>
                                <CardFooter className="font-bold text-lg flex justify-between p-0 pt-4">
                                    <span>Total:</span>
                                    <span>${selectedOrder.total.toFixed(2)}</span>
                                </CardFooter>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[60vh] text-center text-muted-foreground">
                                <Search className="h-12 w-12 mb-4" />
                                <p>Selecciona un pedido de la lista para ver sus detalles aquí.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
        
        {/* Printable report section */}
        <div className="hidden print:block">
            <div className="space-y-4 p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">El Puerto de Carola</h1>
                    <h2 className="text-xl font-semibold">Reporte de Ventas</h2>
                    <p className="text-sm text-muted-foreground">Generado el: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 my-4">
                    <div className="border p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Resumen de Hoy</h3>
                        <p>Ventas Totales: <strong>${summaryData.totalToday.toFixed(2)}</strong></p>
                        <p>Pedidos Totales: <strong>{summaryData.ordersTodayCount}</strong></p>
                    </div>
                    <div className="border p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Resumen General</h3>
                        <p>Ventas Totales Históricas: <strong>${completedOrders.reduce((acc, o) => acc + o.total, 0).toFixed(2)}</strong></p>
                        <p>Pedidos Totales Históricos: <strong>{completedOrders.length}</strong></p>
                    </div>
                </div>
                
                <h2 className="text-lg font-semibold mb-2">Todos los Pedidos Completados</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pedido</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {completedOrders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">
                                    {order.tableId === 'takeaway' ? 'LLEVAR' : `Mesa ${order.tableId}`}<br/>
                                    <span className="text-xs text-muted-foreground">ID: {order.id}</span>
                                </TableCell>
                                <TableCell>{format(new Date(order.createdAt), "dd/MM/yy HH:mm")}</TableCell>
                                <TableCell>
                                    <ul className="text-xs">
                                        {order.items.map((item, index) => {
                                            const menuItem = MENU_ITEMS.find(mi => mi.id === item.menuItemId);
                                            return <li key={index}>{menuItem?.nombre} x{item.quantity} {item.notes ? `(${item.notes})` : ''}</li>;
                                        })}
                                    </ul>
                                    {order.notes && (
                                        <div className="text-xs mt-1 pt-1 border-t border-dashed">
                                            <strong>Nota General:</strong> {order.notes}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-medium">${order.total.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>

      </main>
    </div>
  );
}
