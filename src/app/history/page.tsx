
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { MENU_ITEMS, TAKEAWAY_MENU_ITEMS } from '@/lib/data';
import type { Order, OrderItem, MenuItem } from '@/types';
import { format, subDays, startOfDay, isSameDay, startOfYesterday, endOfDay, endOfYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, History as HistoryIcon, Search, DollarSign, XCircle, Edit, PiggyBank, Wallet, Calendar as CalendarIcon, FilterX } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

type OrderFilter = 'all' | 'tables' | 'takeaway';
type FilterPreset = 'today' | 'yesterday' | 'this_week' | 'last_7_days' | 'this_month' | 'last_month' | 'custom';

interface SoldItemInfo {
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  name: string;
  notesBreakdown: { [note: string]: number };
}

export default function HistoryPage() {
  const { isMounted, currentUser, orders, expenses, cancelOrder, dailyData, setInitialCash } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [orderToCancelId, setOrderToCancelId] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [filterPreset, setFilterPreset] = useState<FilterPreset>('today');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  
  const [initialCashInput, setInitialCashInput] = useState('');

  useEffect(() => {
    if (isMounted && !currentUser) {
      router.push('/');
    }
  }, [currentUser, isMounted, router]);
  
  useEffect(() => {
    if (dailyData) {
      setInitialCashInput(dailyData.initialCash.toString());
    } else {
        setInitialCashInput('0');
    }
  }, [dailyData]);

  const handleSetInitialCash = async () => {
    const amount = parseFloat(initialCashInput);
    if (isNaN(amount) || amount < 0) {
      toast({
        variant: 'destructive',
        title: 'Monto inválido',
        description: 'Por favor, ingrese un número positivo.',
      });
      return;
    }
    try {
      await setInitialCash(amount);
      toast({
        title: 'Caja Inicial Guardada',
        description: `Se estableció la caja inicial en $${amount.toFixed(2)}.`,
      });
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo guardar el monto.',
      });
    }
  };

  const completedOrders = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter(o => o.status === 'completed')
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [orders]);
  
  const dateFilterRange = useMemo(() => {
    const now = new Date();
    switch (filterPreset) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'yesterday':
        const yesterday = startOfYesterday();
        return { from: yesterday, to: endOfYesterday() };
      case 'this_week':
        return { from: startOfWeek(now, { locale: es }), to: endOfWeek(now, { locale: es }) };
      case 'last_7_days':
        return { from: subDays(startOfDay(now), 6), to: endOfDay(now) };
      case 'this_month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'last_month':
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        return { from: lastMonthStart, to: endOfMonth(lastMonthStart) };
      case 'custom':
        if (!customDateRange?.from) return null;
        return { 
          from: startOfDay(customDateRange.from), 
          to: customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(customDateRange.from) 
        };
      default:
        return null;
    }
  }, [filterPreset, customDateRange]);

  const ordersInDateRange = useMemo(() => {
    if (!completedOrders || !dateFilterRange || !dateFilterRange.from) return completedOrders;

    return completedOrders.filter(order => {
        const dateMatch = isWithinInterval(new Date(order.createdAt), { start: dateFilterRange.from!, end: dateFilterRange.to! });
        return dateMatch;
    });
  }, [completedOrders, dateFilterRange]);

  const summaryData = useMemo(() => {
    if (!isMounted || !ordersInDateRange || !expenses) {
        return {
            totalToday: 0,
            ordersTodayCount: 0,
            expectedCashInDrawer: 0,
            weeklyData: [],
        };
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    
    const todaysOrders = completedOrders.filter(o => isSameDay(new Date(o.createdAt), todayStart));
    const totalToday = todaysOrders.reduce((sum, o) => sum + o.total, 0);

    const totalCashToday = todaysOrders
      .filter(o => o.paymentMethod === 'Efectivo')
      .reduce((sum, o) => sum + o.total, 0);

    const cashExpensesToday = (expenses || [])
      .filter(e => isSameDay(new Date(e.createdAt), todayStart) && e.source === 'caja')
      .reduce((sum, e) => sum + e.amount, 0);
      
    const initialCashToday = dailyData?.initialCash || 0;

    const expectedCashInDrawer = (initialCashToday + totalCashToday) - cashExpensesToday;

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

    return {
      totalToday,
      expectedCashInDrawer,
      ordersTodayCount: todaysOrders.length,
      weeklyData,
    };
  }, [completedOrders, expenses, isMounted, dailyData, ordersInDateRange]);

  const { filteredOrders, soldItemInfo } = useMemo(() => {
    let baseOrders = [...ordersInDateRange];
    let soldItemInfo: SoldItemInfo | null = null;
    const lowerCaseSearch = searchTerm.toLowerCase();

    // Filter by order type
    if (orderFilter === 'tables') {
        baseOrders = baseOrders.filter(order => order.tableId !== 'takeaway');
    } else if (orderFilter === 'takeaway') {
        baseOrders = baseOrders.filter(order => order.tableId === 'takeaway');
    }
    
    if (!lowerCaseSearch) {
        return { filteredOrders: baseOrders, soldItemInfo: null };
    }

    const allMenuItems = [...MENU_ITEMS, ...TAKEAWAY_MENU_ITEMS];
    const matchedMenuItems = allMenuItems.filter(item => item.nombre.toLowerCase().includes(lowerCaseSearch));

    // If search term is a menu item, calculate sales data
    if (matchedMenuItems.length > 0 && lowerCaseSearch.length > 3) {
      soldItemInfo = { totalQuantity: 0, totalRevenue: 0, orderCount: 0, name: lowerCaseSearch, notesBreakdown: {} };
      const ordersWithItem = new Set<string>();

      baseOrders.forEach(order => {
        const menuList = order.tableId === 'takeaway' ? TAKEAWAY_MENU_ITEMS : MENU_ITEMS;
        order.items.forEach(item => {
          const menuItem = menuList.find(mi => mi.id === item.menuItemId);
          if (menuItem && menuItem.nombre.toLowerCase().includes(lowerCaseSearch)) {
            soldItemInfo!.totalQuantity += item.quantity;
            const price = item.customPrice || menuItem.precio;
            soldItemInfo!.totalRevenue += price * item.quantity;
            ordersWithItem.add(order.id);
            if(item.notes) {
              soldItemInfo!.notesBreakdown[item.notes] = (soldItemInfo!.notesBreakdown[item.notes] || 0) + item.quantity;
            }
          }
        });
      });
      soldItemInfo.orderCount = ordersWithItem.size;
      return { filteredOrders: baseOrders, soldItemInfo };
    }

    // Otherwise, filter orders by ID or table
    const filtered = baseOrders.filter(order => {
        const tableIdMatch = `mesa ${order.tableId}`.includes(lowerCaseSearch) || (order.tableId === 'takeaway' && 'para llevar'.includes(lowerCaseSearch));
        const orderIdMatch = order.id.toString().includes(lowerCaseSearch);
        return tableIdMatch || orderIdMatch;
    });

    return { filteredOrders: filtered, soldItemInfo: null };
  }, [ordersInDateRange, searchTerm, orderFilter]);

  const handleCancelOrder = (orderId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Acción no permitida',
        description: 'Solo los administradores pueden anular pedidos.',
      });
      return;
    }
    setOrderToCancelId(orderId);
    setIsAlertDialogOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (orderToCancelId) {
      await cancelOrder(orderToCancelId);
    }
    setIsAlertDialogOpen(false);
    setOrderToCancelId(null);
  };
  
  const resetFilters = () => {
    setOrderFilter('all');
    setFilterPreset('today');
    setCustomDateRange(undefined);
    setSearchTerm('');
  };

  if (!isMounted || !currentUser || !orders || !expenses) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <HistoryIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-4">Cargando historial...</h1>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
                <HistoryIcon className="h-6 w-6" />
                Historial y Reportes
            </h1>
            <div className="flex items-center gap-2">
              {currentUser?.role === 'admin' && (
                <Link href="/reports">
                  <Button variant="outline">Ver Reportes Financieros</Button>
                </Link>
              )}
              <Link href="/dashboard">
                  <Button variant="outline" className="flex items-center gap-2">
                      <ArrowLeft className="h-5 w-5" />
                      Volver al Salón
                  </Button>
              </Link>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-primary text-primary-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Efectivo Esperado en Caja</CardTitle>
                    <PiggyBank className="h-4 w-4 text-primary-foreground/80" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">${summaryData.expectedCashInDrawer.toFixed(2)}</div>
                    <p className="text-xs text-primary-foreground/80">
                        (Caja Inicial + Ventas Efectivo) - Gastos de Caja.
                        {(dailyData?.initialCash || 0) > 0 && <span><br />+ ${dailyData.initialCash.toFixed(2)} de caja inicial</span>}
                    </p>
                </CardContent>
            </Card>
            
            {currentUser.role === 'admin' && (
              <>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas Totales (Hoy)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${summaryData.totalToday.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">{summaryData.ordersTodayCount} pedidos hoy</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Configurar Caja Inicial
                            <Edit className="h-4 w-4 text-muted-foreground"/>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                placeholder="Monto inicial..."
                                value={initialCashInput}
                                onChange={(e) => setInitialCashInput(e.target.value)}
                                className="h-9"
                            />
                            <Button size="sm" onClick={handleSetInitialCash}>Guardar</Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gastos de Caja (Hoy)</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">-${(expenses?.filter(e => isSameDay(new Date(e.createdAt), new Date()) && e.source === 'caja').reduce((s, e) => s + e.amount, 0) || 0).toFixed(2)}</div>
                    </CardContent>
                </Card>
              </>
            )}
        </div>
        
        <div className={`grid gap-4 ${currentUser.role === 'admin' ? 'lg:grid-cols-3 xl:grid-cols-5' : 'md:grid-cols-2'}`}>
            {currentUser.role === 'admin' && (
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
                </div>
            )}
            
            <div className={currentUser.role === 'admin' ? "lg:col-span-2 xl:col-span-3" : "md:col-span-1"}>
                <Card>
                    <CardHeader>
                        <CardTitle>Todos los Pedidos</CardTitle>
                        <CardDescription>Busca y selecciona un pedido para ver los detalles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 mb-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Select value={orderFilter} onValueChange={(v) => setOrderFilter(v as OrderFilter)}>
                                    <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Tipo de pedido" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los pedidos</SelectItem>
                                        <SelectItem value="tables">Mesas</SelectItem>
                                        <SelectItem value="takeaway">Para Llevar</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filterPreset} onValueChange={(v) => { setFilterPreset(v as FilterPreset); setCustomDateRange(undefined); }}>
                                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filtrar por fecha" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Hoy</SelectItem>
                                        <SelectItem value="yesterday">Ayer</SelectItem>
                                        <SelectItem value="this_week">Esta semana</SelectItem>
                                        <SelectItem value="last_7_days">Últimos 7 días</SelectItem>
                                        <SelectItem value="this_month">Este mes</SelectItem>
                                        <SelectItem value="last_month">Mes pasado</SelectItem>
                                    </SelectContent>
                                </Select>
                                
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full sm:w-auto justify-start text-left font-normal", !customDateRange && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {customDateRange?.from ? 
                                            customDateRange.to ? `${format(customDateRange.from, 'LLL dd')} - ${format(customDateRange.to, 'LLL dd, y')}` : format(customDateRange.from, 'LLL dd, y') :
                                            <span>Rango personalizado</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus mode="range"
                                        defaultMonth={customDateRange?.from}
                                        selected={customDateRange}
                                        onSelect={(range) => { setCustomDateRange(range); if (range?.from) setFilterPreset('custom'); }}
                                        numberOfMonths={2} locale={es}
                                    />
                                    </PopoverContent>
                                </Popover>
                                
                                <Button variant="ghost" size="icon" onClick={resetFilters}><FilterX className="h-4 w-4" /></Button>
                            </div>
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="search"
                                    placeholder="Buscar por artículo, ID de pedido o mesa..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {soldItemInfo && soldItemInfo.totalQuantity > 0 && (
                            <Card className="mb-4 bg-blue-50 border-blue-200">
                                <CardContent className="p-3 text-sm">
                                    <p>
                                        Se vendieron <strong>{soldItemInfo.totalQuantity} '{soldItemInfo.name}'</strong> en <strong>{soldItemInfo.orderCount}</strong> pedidos, generando un total de <strong className="text-blue-800">${soldItemInfo.totalRevenue.toFixed(2)}</strong>.
                                    </p>
                                    {Object.keys(soldItemInfo.notesBreakdown).length > 0 && (
                                        <div className="mt-2 text-xs">
                                            <strong>Desglose:</strong> {Object.entries(soldItemInfo.notesBreakdown).map(([note, qty]) => `${note} (x${qty})`).join(', ')}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <ScrollArea className="h-[40vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pedido</TableHead>
                                        <TableHead className="w-[150px] hidden sm:table-cell">Fecha</TableHead>
                                        <TableHead>Pago</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        {currentUser?.role === 'admin' && <TableHead className="w-[120px] text-center">Acción</TableHead>}
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
                                            <TableCell>
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                                    order.paymentMethod === 'Efectivo' ? 'bg-green-100 text-green-800' :
                                                    order.paymentMethod === 'DeUna' ? 'bg-blue-100 text-blue-800' :
                                                    order.paymentMethod === 'Transferencia' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {order.paymentMethod || 'N/A'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                                            {currentUser?.role === 'admin' && order.status === 'completed' && (
                                            <TableCell className="text-center">
                                                <Button variant="destructive" size="sm" onClick={(e) => {e.stopPropagation(); handleCancelOrder(order.id)}}>Anular</Button>
                                            </TableCell>)}
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={currentUser?.role === 'admin' ? 5 : 4} className="h-24 text-center">
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
            
            <div className={currentUser.role === 'admin' ? "lg:col-span-1 xl:col-span-2" : "md:col-span-1"}>
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
                                    {selectedOrder.paymentMethod && <p className="text-sm font-medium">Pagado con: {selectedOrder.paymentMethod}</p>}
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
                                            const menuList = selectedOrder.tableId === 'takeaway' ? TAKEAWAY_MENU_ITEMS : MENU_ITEMS;
                                            const menuItem = menuList.find(mi => mi.id === item.menuItemId);
                                            const price = item.customPrice || (menuItem ? menuItem.precio : 0);
                                            return (
                                                <li key={`${item.menuItemId}-${index}`} className="flex justify-between border-b pb-2">
                                                    <div>
                                                        <span className="font-medium">{menuItem?.nombre} x{item.quantity}</span>
                                                        {item.notes && <p className="text-xs text-amber-700">Nota: {item.notes}</p>}
                                                    </div>
                                                    <span>${(price * item.quantity).toFixed(2)}</span>
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

      </main>
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Anulación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas anular este pedido? Esta acción no se puede deshacer y el monto se restará de las ventas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelOrder}>Sí, Anular Pedido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

    