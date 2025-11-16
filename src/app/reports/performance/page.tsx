"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppSidebar from '@/components/app-sidebar';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, isWithinInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, BarChart2, Calendar as CalendarIcon, DollarSign, Gem, TrendingUp, TrendingDown } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { ALL_MENU_ITEMS } from '@/lib/data';
import { Order, OrderItem, MenuItem } from '@/types';

type FilterPreset = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

interface MenuItemPerformance {
  id: number;
  name: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
  averagePrice: number;
}

interface MenuItemComparisonPerformance extends MenuItemPerformance {
  comparisonQuantitySold: number;
  comparisonTotalRevenue: number;
  quantitySoldChange: number;
  totalRevenueChange: number;
}

// Helper function to calculate performance data for a given set of orders
const calculatePerformanceData = (orders: Order[]): Map<number, MenuItemPerformance> => {
  const itemMap = new Map<number, MenuItemPerformance>();

  orders.forEach(order => {
    order.items.forEach(orderItem => {
      const menuItem = ALL_MENU_ITEMS.find(item => item.id === orderItem.menuItemId);
      if (menuItem) {
        if (!itemMap.has(menuItem.id)) {
          itemMap.set(menuItem.id, {
            id: menuItem.id,
            name: menuItem.nombre,
            category: menuItem.category,
            quantitySold: 0,
            totalRevenue: 0,
            averagePrice: 0,
          });
        }
        const currentStats = itemMap.get(menuItem.id)!;
        const itemPrice = orderItem.customPrice !== undefined ? orderItem.customPrice : menuItem.precio;

        currentStats.quantitySold += orderItem.quantity;
        currentStats.totalRevenue += itemPrice * orderItem.quantity;
      }
    });
  });

  itemMap.forEach(stats => {
    stats.averagePrice = stats.quantitySold > 0 ? stats.totalRevenue / stats.quantitySold : 0;
  });

  return itemMap;
};

export default function PerformanceReportPage() {
  const { isMounted, currentUser, orders } = useAppStore();
  const router = useRouter();

  // Primary Period State
  const [filterPreset, setFilterPreset] = useState<FilterPreset>('this_week');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  // Comparison Period State
  const [comparisonFilterPreset, setComparisonFilterPreset] = useState<FilterPreset>('last_week');
  const [comparisonCustomDateRange, setComparisonCustomDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    if (isMounted && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [currentUser, isMounted, router]);

  const completedOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => o.status === 'completed');
  }, [orders]);

  // Helper to generate date range based on preset and custom range
  const generateDateRange = (preset: FilterPreset, customRange: DateRange | undefined) => {
    const now = new Date();
    switch (preset) {
      case 'this_week':
        return { from: startOfWeek(now, { locale: es, weekStartsOn: 1 }), to: endOfWeek(now, { locale: es, weekStartsOn: 1 }) };
      case 'last_week':
        const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: es, weekStartsOn: 1 });
        return { from: lastWeekStart, to: endOfWeek(lastWeekStart, { locale: es, weekStartsOn: 1 }) };
      case 'this_month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'last_month':
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        return { from: lastMonthStart, to: endOfMonth(lastMonthStart) };
      case 'custom':
        if (!customRange?.from) return null;
        return { 
          from: startOfDay(customRange.from), 
          to: customRange.to ? endOfDay(customRange.to) : endOfDay(customRange.from) 
        };
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  };

  const primaryDateFilterRange = useMemo(() => generateDateRange(filterPreset, customDateRange), [filterPreset, customDateRange]);
  const comparisonDateFilterRange = useMemo(() => generateDateRange(comparisonFilterPreset, comparisonCustomDateRange), [comparisonFilterPreset, comparisonCustomDateRange]);

  const filteredPrimaryOrders = useMemo(() => {
    if (!completedOrders || !primaryDateFilterRange) return [];
    const { from, to } = primaryDateFilterRange;
    if (!from || !to) return [];
    const interval = { start: from, end: to };
    return completedOrders.filter(o => isWithinInterval(new Date(o.createdAt), interval));
  }, [completedOrders, primaryDateFilterRange]);

  const filteredComparisonOrders = useMemo(() => {
    if (!completedOrders || !comparisonDateFilterRange) return [];
    const { from, to } = comparisonDateFilterRange;
    if (!from || !to) return [];
    const interval = { start: from, end: to };
    return completedOrders.filter(o => isWithinInterval(new Date(o.createdAt), interval));
  }, [completedOrders, comparisonDateFilterRange]);

  const primaryPerformanceDataMap = useMemo(() => calculatePerformanceData(filteredPrimaryOrders), [filteredPrimaryOrders]);
  const comparisonPerformanceDataMap = useMemo(() => calculatePerformanceData(filteredComparisonOrders), [filteredComparisonOrders]);

  const combinedPerformanceData = useMemo(() => {
    const combined: MenuItemComparisonPerformance[] = [];
    const allMenuItemIds = new Set([...Array.from(primaryPerformanceDataMap.keys()), ...Array.from(comparisonPerformanceDataMap.keys())]);

    allMenuItemIds.forEach(id => {
      const primaryItem = primaryPerformanceDataMap.get(id);
      const comparisonItem = comparisonPerformanceDataMap.get(id);

      const name = primaryItem?.name || comparisonItem?.name || ALL_MENU_ITEMS.find(item => item.id === id)?.nombre || `Unknown Item ${id}`;
      const category = primaryItem?.category || comparisonItem?.category || ALL_MENU_ITEMS.find(item => item.id === id)?.category || 'N/A';

      const quantitySold = primaryItem?.quantitySold || 0;
      const totalRevenue = primaryItem?.totalRevenue || 0;
      const averagePrice = primaryItem?.averagePrice || 0;

      const comparisonQuantitySold = comparisonItem?.quantitySold || 0;
      const comparisonTotalRevenue = comparisonItem?.totalRevenue || 0;

      const quantitySoldChange = comparisonQuantitySold === 0 ? 
        (quantitySold > 0 ? 100 : 0) : 
        ((quantitySold - comparisonQuantitySold) / comparisonQuantitySold) * 100;
      
      const totalRevenueChange = comparisonTotalRevenue === 0 ? 
        (totalRevenue > 0 ? 100 : 0) : 
        ((totalRevenue - comparisonTotalRevenue) / comparisonTotalRevenue) * 100;

      combined.push({
        id,
        name,
        category,
        quantitySold,
        totalRevenue,
        averagePrice,
        comparisonQuantitySold,
        comparisonTotalRevenue,
        quantitySoldChange,
        totalRevenueChange,
      });
    });

    return combined.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [primaryPerformanceDataMap, comparisonPerformanceDataMap]);

  const mostSoldItem = useMemo(() => {
    return combinedPerformanceData.length > 0 
      ? combinedPerformanceData.reduce((prev, current) => (prev.quantitySold > current.quantitySold ? prev : current))
      : null;
  }, [combinedPerformanceData]);

  const mostProfitableItem = useMemo(() => {
    return combinedPerformanceData.length > 0 
      ? combinedPerformanceData.reduce((prev, current) => (prev.totalRevenue > current.totalRevenue ? prev : current))
      : null;
  }, [combinedPerformanceData]);

  const getFilterDateRangeString = (range: DateRange | null | undefined) => {
    if (!range?.from) return "Rango no definido";
    const fromStr = format(range.from, 'dd/MM/yyyy');
    if (!range.to || isSameDay(range.from, range.to)) return fromStr;
    const toStr = format(range.to, 'dd/MM/yyyy');
    return `${fromStr} - ${toStr}`;
  };

  if (!isMounted || !currentUser || !orders) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <BarChart2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-4">Cargando reportes...</h1>
      </div>
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <BarChart2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-4">Acceso solo para administradores.</h1>
        <Link href="/dashboard">
          <Button>Volver al Salón</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex-1 p-4 sm:p-6 md:p-8 print:p-0">
        <div className="print:hidden">
          {/* Header Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className='flex items-center gap-3 flex-wrap'>
                <AppSidebar />
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                <BarChart2 className="h-6 w-6 sm:h-8 sm:w-8" />
                Reporte de Rendimiento
                </h1>
            </div>
            <div className="flex items-center flex-wrap gap-2 justify-start md:justify-end">
                <Link href="/admin/dashboard" className="flex-1 sm:flex-none">
                    <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Volver al Dashboard</span>
                    <span className="sm:hidden">Volver</span>
                    </Button>
                </Link>
            </div>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
              <CardHeader>
                <CardTitle>Período Principal</CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <Select value={filterPreset} onValueChange={(v) => { setFilterPreset(v as FilterPreset); setCustomDateRange(undefined); }}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrar por fecha" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="this_week">Esta semana</SelectItem>
                          <SelectItem value="last_week">Semana pasada</SelectItem>
                          <SelectItem value="this_month">Este mes</SelectItem>
                          <SelectItem value="last_month">Mes pasado</SelectItem>
                      </SelectContent>
                  </Select>
                  
                  <Popover>
                      <PopoverTrigger asChild>
                      <Button id="date" variant={"outline"} className={cn("w-full sm:w-auto justify-start text-left font-normal flex-1", !customDateRange && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customDateRange?.from ? 
                              customDateRange.to ? 
                              `${format(customDateRange.from, 'LLL dd, y')} - ${format(customDateRange.to, 'LLL dd, y')}` : 
                              format(customDateRange.from, 'LLL dd, y') : 
                              <span>Rango personalizado</span>}
                      </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={customDateRange?.from}
                          selected={customDateRange}
                          onSelect={(range) => { setCustomDateRange(range); if(range?.from) setFilterPreset('custom'); }}
                          numberOfMonths={2}
                          locale={es}
                      />
                      </PopoverContent>
                  </Popover>
              </CardContent>
          </Card>

          <Card className="mb-6">
              <CardHeader>
                <CardTitle>Período de Comparación</CardTitle>
                <CardDescription>Selecciona un período para comparar el rendimiento.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <Select value={comparisonFilterPreset} onValueChange={(v) => { setComparisonFilterPreset(v as FilterPreset); setComparisonCustomDateRange(undefined); }}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrar por fecha" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="last_week">Semana pasada</SelectItem>
                          <SelectItem value="this_week">Esta semana</SelectItem>
                          <SelectItem value="last_month">Mes pasado</SelectItem>
                          <SelectItem value="this_month">Este mes</SelectItem>
                      </SelectContent>
                  </Select>
                  
                  <Popover>
                      <PopoverTrigger asChild>
                      <Button id="comparison-date" variant={"outline"} className={cn("w-full sm:w-auto justify-start text-left font-normal flex-1", !comparisonCustomDateRange && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {comparisonCustomDateRange?.from ? 
                              comparisonCustomDateRange.to ? 
                              `${format(comparisonCustomDateRange.from, 'LLL dd, y')} - ${format(comparisonCustomDateRange.to, 'LLL dd, y')}` : 
                              format(comparisonCustomDateRange.from, 'LLL dd, y') : 
                              <span>Rango personalizado</span>}
                      </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={comparisonCustomDateRange?.from}
                          selected={comparisonCustomDateRange}
                          onSelect={(range) => { setComparisonCustomDateRange(range); if(range?.from) setComparisonFilterPreset('custom'); }}
                          numberOfMonths={2}
                          locale={es}
                      />
                      </PopoverContent>
                  </Popover>
              </CardContent>
          </Card>

          {/* Highlights */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Más Vendido</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {mostSoldItem ? (
                  <div className="text-2xl font-bold">
                    {mostSoldItem.name}
                    <p className="text-xs text-muted-foreground">{mostSoldItem.quantitySold} unidades vendidas</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay datos de ventas para el período principal</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Más Rentable (por Ingreso)</CardTitle>
                <Gem className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {mostProfitableItem ? (
                  <div className="text-2xl font-bold">
                    {mostProfitableItem.name}
                    <p className="text-xs text-muted-foreground">${mostProfitableItem.totalRevenue.toFixed(2)} en ingresos</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay datos de ingresos para el período principal</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Rendimiento de Ítems del Menú</CardTitle>
              <CardDescription>
                Comparación de rendimiento de cada ítem entre el período principal ({getFilterDateRangeString(primaryDateFilterRange)}) y el período de comparación ({getFilterDateRangeString(comparisonDateFilterRange)}).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {combinedPerformanceData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ítem</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Cant. Vendida ({getFilterDateRangeString(primaryDateFilterRange)})</TableHead>
                        <TableHead className="text-right">% Cambio Cant.</TableHead>
                        <TableHead className="text-right">Ingresos Totales ({getFilterDateRangeString(primaryDateFilterRange)})</TableHead>
                        <TableHead className="text-right">% Cambio Ingresos</TableHead>
                        <TableHead className="text-right">Precio Promedio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {combinedPerformanceData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-right">{item.quantitySold}</TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "flex items-center justify-end gap-1",
                              item.quantitySoldChange > 0 && "text-green-500",
                              item.quantitySoldChange < 0 && "text-red-500"
                            )}>
                              {item.quantitySoldChange.toFixed(2)}%
                              {item.quantitySoldChange > 0 && <TrendingUp className="h-4 w-4" />}
                              {item.quantitySoldChange < 0 && <TrendingDown className="h-4 w-4" />}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">${item.totalRevenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "flex items-center justify-end gap-1",
                              item.totalRevenueChange > 0 && "text-green-500",
                              item.totalRevenueChange < 0 && "text-red-500"
                            )}>
                              {item.totalRevenueChange.toFixed(2)}%
                              {item.totalRevenueChange > 0 && <TrendingUp className="h-4 w-4" />}
                              {item.totalRevenueChange < 0 && <TrendingDown className="h-4 w-4" />}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">${item.averagePrice.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  No hay datos de rendimiento para los períodos seleccionados.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Printable Report Section */}
        <div className="hidden print:block print-report-container print:p-4">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">El Puerto de Carola</h1>
                <h2 className="text-xl font-semibold">Reporte de Rendimiento de Menú</h2>
                <p className="text-sm">Período Principal: {getFilterDateRangeString(primaryDateFilterRange)}</p>
                <p className="text-sm">Período de Comparación: {getFilterDateRangeString(comparisonDateFilterRange)}</p>
                <p className="text-xs">Generado el: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Highlights (Período Principal)</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border p-4 rounded-lg print:border print:shadow-none">
                  <h4 className="font-semibold text-sm">Más Vendido</h4>
                  <p className="text-xl font-bold">{mostSoldItem?.name || 'N/A'}</p>
                  <p className="text-xs">{mostSoldItem?.quantitySold || 0} unidades</p>
              </div>
              <div className="border p-4 rounded-lg print:border print:shadow-none">
                  <h4 className="font-semibold text-sm">Más Rentable (por Ingreso)</h4>
                  <p className="text-xl font-bold">{mostProfitableItem?.name || 'N/A'}</p>
                  <p className="text-xs">${mostProfitableItem?.totalRevenue.toFixed(2) || '0.00'} en ingresos</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">Detalle de Rendimiento Comparado</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ítem</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Cant. Vendida ({getFilterDateRangeString(primaryDateFilterRange)})</TableHead>
                        <TableHead className="text-right">% Cambio Cant.</TableHead>
                        <TableHead className="text-right">Ingresos Totales ({getFilterDateRangeString(primaryDateFilterRange)})</TableHead>
                        <TableHead className="text-right">% Cambio Ingresos</TableHead>
                        <TableHead className="text-right">Precio Promedio</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {combinedPerformanceData.length > 0 ? combinedPerformanceData.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="text-right">{item.quantitySold}</TableCell>
                            <TableCell className="text-right">
                                {item.quantitySoldChange.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right">${item.totalRevenue.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                                {item.totalRevenueChange.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right">${item.averagePrice.toFixed(2)}</TableCell>
                        </TableRow>
                    )) : (
                       <TableRow>
                         <TableCell colSpan={7} className="text-center h-24">No hay datos de rendimiento en este período.</TableCell>
                       </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </main>
    </div>
  );
}