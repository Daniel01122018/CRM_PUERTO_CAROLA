
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { MENU_ITEMS, TAKEAWAY_MENU_ITEMS } from '@/lib/data';
import type { Order } from '@/types';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, History as HistoryIcon, Search, DollarSign, FileText, XCircle, Banknote, Wallet, PiggyBank, Edit } from 'lucide-react';

export default function HistoryPage() {
  const { isMounted, currentUser, orders, expenses, cancelOrder, dailyData, setInitialCash } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [orderToCancelId, setOrderToCancelId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'tables' | 'takeaway'>('all');

  const [initialCashInput, setInitialCashInput] = useState('');

  useEffect(() => {
    if (dailyData) {
      setInitialCashInput(dailyData.initialCash.toString());
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


  const [summaryData, setSummaryData] = useState<{
    totalToday: number;
    totalCashToday: number;
    totalCardToday: number;
    totalTransferToday: number;
    totalExpensesToday: number;
    expectedCashInDrawer: number;
    ordersTodayCount: number;
    weeklyData: { date: string; Ventas: number }[];
  }>({
    totalToday: 0,
    totalCashToday: 0,
    totalCardToday: 0,
    totalTransferToday: 0,
    totalExpensesToday: 0,
    expectedCashInDrawer: 0,
    ordersTodayCount: 0,
    weeklyData: [],
  });

  useEffect(() => {
    if (isMounted && !currentUser) {
      router.push('/');
    }
  }, [currentUser, isMounted, router]);
  
  const completedOrders = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter(o => o.status === 'completed')
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [orders]);

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
            const menuList = order.tableId === 'takeaway' ? TAKEAWAY_MENU_ITEMS : MENU_ITEMS;
            const menuItem = menuList.find(mi => mi.id === item.menuItemId);
            return menuItem?.nombre.toLowerCase().includes(lowerCaseSearch);
        });
        return tableIdMatch || orderIdMatch || totalMatch || itemMatch;
    });
  }, [completedOrders, searchTerm, filter]);

  useEffect(() => {
    if (!isMounted || !completedOrders || !expenses || !dailyData) return;

    const today = new Date();
    const todayStart = startOfDay(today);
    
    const todaysOrders = completedOrders.filter(o => isSameDay(new Date(o.createdAt), todayStart));
    const totalToday = todaysOrders.reduce((sum, o) => sum + o.total, 0);

    const totalCashToday = todaysOrders
      .filter(o => o.paymentMethod === 'Efectivo')
      .reduce((sum, o) => sum + o.total, 0);
    const totalCardToday = todaysOrders
      .filter(o => o.paymentMethod === 'Tarjeta')
      .reduce((sum, o) => sum + o.total, 0);
    const totalTransferToday = todaysOrders
      .filter(o => o.paymentMethod === 'Transferencia')
      .reduce((sum, o) => sum + o.total, 0);
    
    const todaysExpenses = expenses.filter(e => isSameDay(new Date(e.createdAt), todayStart));
    const totalExpensesToday = todaysExpenses.reduce((sum, e) => sum + e.amount, 0);

    const cashExpensesToday = todaysExpenses
      .filter(e => e.source === 'caja')
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

    setSummaryData({
      totalToday,
      totalCashToday,
      totalCardToday,
      totalTransferToday,
      totalExpensesToday,
      expectedCashInDrawer,
      ordersTodayCount: todaysOrders.length,
      weeklyData,
    });
  }, [completedOrders, expenses, isMounted, dailyData]);
  
  const handlePrintReport = () => {
    window.print();
  };

  const handleCancelOrder = (orderId: string) => {
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
            <Card className="bg-primary text-primary-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Efectivo Esperado en Caja</CardTitle>
                    <PiggyBank className="h-4 w-4 text-primary-foreground/80" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">${summaryData.expectedCashInDrawer.toFixed(2)}</div>
                    <p className="text-xs text-primary-foreground/80">
                        (Caja Inicial + Ventas Efectivo) - Gastos de Caja.
                        {dailyData?.initialCash && <span><br />+ ${dailyData.initialCash.toFixed(2)} de caja inicial</span>}
                    </p>
                </CardContent>
            </Card>
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
             {currentUser.role === 'admin' && (
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
            )}
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gastos de Caja (Hoy)</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">-${(expenses?.filter(e => isSameDay(new Date(e.createdAt), new Date()) && e.source === 'caja').reduce((s, e) => s + e.amount, 0) || 0).toFixed(2)}</div>
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
                                        <TableHead className="w-[150px] hidden sm:table-cell">Fecha</TableHead>
                                        <TableHead className="w-[100px]">Estado</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        {currentUser?.role === 'admin' && <TableHead className="w-[120px] text-center print:hidden">Acción</TableHead>}
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
                                                {order.status === 'completed' && <span className="text-green-600">Completado</span>}
                                                {order.status === 'cancelled' && <span className="text-red-600">Cancelado</span>}
                                                {/* Add other statuses if needed */}
                                            </TableCell>
                                            <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                                            {currentUser?.role === 'admin' && order.status === 'completed' && (
                                            <TableCell className="text-center print:hidden">
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
                                    <span className="text-xs text-muted-foreground">ID: {order.id.slice(-6)}</span>
                                </TableCell>
                                <TableCell>{format(new Date(order.createdAt), "dd/MM/yy HH:mm")}</TableCell>
                                <TableCell>
                                    <ul className="text-xs">
                                        {order.items.map((item, index) => {
                                            const menuList = order.tableId === 'takeaway' ? TAKEAWAY_MENU_ITEMS : MENU_ITEMS;
                                            const menuItem = menuList.find(mi => mi.id === item.menuItemId);
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

    