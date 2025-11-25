"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import { useDailyStats } from '@/hooks/use-daily-stats';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import AppSidebar from '@/components/app-sidebar';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, isWithinInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, BarChart2, Calendar as CalendarIcon, DollarSign, Gem, TrendingUp, TrendingDown, Utensils, Coffee, Plus } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { ALL_MENU_ITEMS } from '@/lib/data';
import { Order, MenuItem, DailyStats } from '@/types';

type FilterPreset = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

interface MenuItemPerformance {
  id: string; // Changed to string to match key in daily stats
  name: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
  cost: number;
  profit: number;
}

interface MenuItemComparisonPerformance extends MenuItemPerformance {
  comparisonQuantitySold: number;
  comparisonTotalRevenue: number;
  comparisonProfit: number;
  quantitySoldChange: number;
  totalRevenueChange: number;
  profitChange: number;
}

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
      if (!customRange?.from) return { from: startOfMonth(now), to: endOfMonth(now) }; // Default fallback
      return {
        from: startOfDay(customRange.from),
        to: customRange.to ? endOfDay(customRange.to) : endOfDay(customRange.from)
      };
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
};

// Helper function to calculate performance data from DailyStats
const calculatePerformanceData = (stats: DailyStats[]): Map<string, MenuItemPerformance> => {
  const itemMap = new Map<string, MenuItemPerformance>();

  stats.forEach(stat => {
    if (stat.itemSales) {
      Object.entries(stat.itemSales).forEach(([itemId, salesInfo]) => {
        // Try to find static item info for category and cost
        // itemId might be string or number in string form
        const menuItem = ALL_MENU_ITEMS.find(item => item.id.toString() === itemId);

        // If not found, try to find in variants (less reliable without parent ID, but we can try)
        let category = 'Sin Categoría';
        let cost = 0;

        if (menuItem) {
          category = menuItem.category || 'Sin Categoría';
          cost = menuItem.precio || 0;
        } else {
          // Fallback or variants logic if needed. 
          // For now, if we can't find it in ALL_MENU_ITEMS, we default.
          // Ideally we should have category in itemSales too, but we didn't add it to save space.
          // We can infer category from name if needed or just leave as Unknown.
        }

        if (!itemMap.has(itemId)) {
          itemMap.set(itemId, {
            id: itemId,
            name: salesInfo.name,
            category,
            quantitySold: 0,
            totalRevenue: 0,
            cost,
            profit: 0
          });
        }

        const currentStats = itemMap.get(itemId)!;
        currentStats.quantitySold += salesInfo.quantity;
        currentStats.totalRevenue += salesInfo.revenue;
        currentStats.profit = currentStats.totalRevenue - (currentStats.cost * currentStats.quantitySold);
      });
    }
  });

  return itemMap;
};

const categorizeMenuItems = (performanceData: MenuItemComparisonPerformance[]) => {
  const bebidas: MenuItemComparisonPerformance[] = [];
  const adicionales: MenuItemComparisonPerformance[] = [];
  const platos: MenuItemComparisonPerformance[] = [];

  performanceData.forEach(item => {
    const category = item.category.toLowerCase();

    if (category.includes('bebida') ||
      category.includes('jugo') ||
      category.includes('gaseosa')) {
      bebidas.push(item);
    } else if (category.includes('adicional') ||
      category.includes('acompanamiento')) {
      adicionales.push(item);
    } else {
      platos.push(item);
    }
  });

  return { platos, bebidas, adicionales };
};

export default function PerformanceReportPage() {
  const { isMounted, currentUser } = useAppStore();
  const router = useRouter();

  // Primary Period State
  const [filterPreset, setFilterPreset] = useState<FilterPreset>('this_week');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  // Comparison Period State
  const [comparisonFilterPreset, setComparisonFilterPreset] = useState<FilterPreset>('last_week');
  const [comparisonCustomDateRange, setComparisonCustomDateRange] = useState<DateRange | undefined>(undefined);

  const [activeTab, setActiveTab] = useState('platos');

  useEffect(() => {
    if (isMounted && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [currentUser, isMounted, router]);

  const primaryDateFilterRange = useMemo(() => generateDateRange(filterPreset, customDateRange), [filterPreset, customDateRange]);
  const comparisonDateFilterRange = useMemo(() => generateDateRange(comparisonFilterPreset, comparisonCustomDateRange), [comparisonFilterPreset, comparisonCustomDateRange]);

  // Fetch data using hooks
  const { stats: primaryStats, loading: primaryLoading } = useDailyStats(primaryDateFilterRange);
  const { stats: comparisonStats, loading: comparisonLoading } = useDailyStats(comparisonDateFilterRange);

  const primaryPerformanceDataMap = useMemo(() => calculatePerformanceData(primaryStats || []), [primaryStats]);
  const comparisonPerformanceDataMap = useMemo(() => calculatePerformanceData(comparisonStats || []), [comparisonStats]);

  const combinedPerformanceData = useMemo(() => {
    const combined: MenuItemComparisonPerformance[] = [];
    const allMenuItemIds = new Set([...Array.from(primaryPerformanceDataMap.keys()), ...Array.from(comparisonPerformanceDataMap.keys())]);

    allMenuItemIds.forEach(id => {
      const primaryItem = primaryPerformanceDataMap.get(id);
      const comparisonItem = comparisonPerformanceDataMap.get(id);

      const name = primaryItem?.name || comparisonItem?.name || `Unknown Item ${id}`;
      const category = primaryItem?.category || comparisonItem?.category || 'Sin Categoría';
      const cost = primaryItem?.cost || comparisonItem?.cost || 0;

      const quantitySold = primaryItem?.quantitySold || 0;
      const totalRevenue = primaryItem?.totalRevenue || 0;
      const profit = primaryItem?.profit || 0;

      const comparisonQuantitySold = comparisonItem?.quantitySold || 0;
      const comparisonTotalRevenue = comparisonItem?.totalRevenue || 0;
      const comparisonProfit = comparisonItem?.profit || 0;

      const quantitySoldChange = comparisonQuantitySold === 0 ?
        (quantitySold > 0 ? 100 : 0) :
        ((quantitySold - comparisonQuantitySold) / comparisonQuantitySold) * 100;

      const totalRevenueChange = comparisonTotalRevenue === 0 ?
        (totalRevenue > 0 ? 100 : 0) :
        ((totalRevenue - comparisonTotalRevenue) / comparisonTotalRevenue) * 100;

      const profitChange = comparisonProfit === 0 ?
        (profit > 0 ? 100 : 0) :
        ((profit - comparisonProfit) / comparisonProfit) * 100;

      combined.push({
        id,
        name,
        category,
        quantitySold,
        totalRevenue,
        cost,
        profit,
        comparisonQuantitySold,
        comparisonTotalRevenue,
        comparisonProfit,
        quantitySoldChange,
        totalRevenueChange,
        profitChange,
      });
    });

    return combined.sort((a, b) => b.quantitySold - a.quantitySold);
  }, [primaryPerformanceDataMap, comparisonPerformanceDataMap]);

  const categorizedData = useMemo(() => categorizeMenuItems(combinedPerformanceData), [combinedPerformanceData]);

  const mostSoldItem = useMemo(() => {
    return combinedPerformanceData.length > 0
      ? combinedPerformanceData.reduce((prev, current) => (prev.quantitySold > current.quantitySold ? prev : current))
      : null;
  }, [combinedPerformanceData]);

  const mostProfitableItem = useMemo(() => {
    return combinedPerformanceData.length > 0
      ? combinedPerformanceData.reduce((prev, current) => {
        return prev.profit > current.profit ? prev : current;
      })
      : null;
  }, [combinedPerformanceData]);

  const getFilterDateRangeString = (range: { from: Date; to: Date } | null) => {
    if (!range?.from) return "Rango no definido";
    const fromStr = format(range.from, 'dd/MM/yyyy');
    if (!range.to || isSameDay(range.from, range.to)) return fromStr;
    const toStr = format(range.to, 'dd/MM/yyyy');
    return `${fromStr} - ${toStr}`;
  };

  const renderChange = (change: number) => {
    const changeText = `${change.toFixed(0)}%`;
    if (change > 0) return <span className="text-green-500 text-xs flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {changeText}</span>
    if (change < 0) return <span className="text-red-500 text-xs flex items-center gap-1"><TrendingDown className="h-3 w-3" /> {changeText}</span>
    return <span className="text-muted-foreground text-xs">{changeText}</span>
  }

  const PerformanceItemCard = ({ item }: { item: MenuItemComparisonPerformance }) => (
    <Card className="p-4 sm:p-5 rounded-xl shadow-sm hover:shadow-md transition-all h-full">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg leading-tight">{item.name}</h3>
        <Badge variant="secondary" className="ml-2 whitespace-nowrap">
          {item.quantitySold} vendidos
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
        <div>
          <p className="text-muted-foreground">Ingresos</p>
          <p className="font-bold">${item.totalRevenue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Ganancia</p>
          <p className="font-bold text-green-600">${item.profit.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t text-xs sm:text-sm">
        <div className={cn("flex items-center gap-1", item.quantitySoldChange > 0 ? "text-green-500" : item.quantitySoldChange < 0 ? "text-red-500" : "text-muted-foreground")}>
          {item.quantitySoldChange > 0 ? <TrendingUp className="h-3 w-3" /> : item.quantitySoldChange < 0 ? <TrendingDown className="h-3 w-3" /> : null}
          {item.quantitySoldChange.toFixed(0)}% cant.
        </div>

        <div className={cn("flex items-center gap-1", item.totalRevenueChange > 0 ? "text-green-500" : item.totalRevenueChange < 0 ? "text-red-500" : "text-muted-foreground")}>
          {item.totalRevenueChange > 0 ? <TrendingUp className="h-3 w-3" /> : item.totalRevenueChange < 0 ? <TrendingDown className="h-3 w-3" /> : null}
          {item.totalRevenueChange.toFixed(0)}% ingr.
        </div>

        <div className={cn("flex items-center gap-1", item.profitChange > 0 ? "text-green-500" : item.profitChange < 0 ? "text-red-500" : "text-muted-foreground")}>
          {item.profitChange > 0 ? <TrendingUp className="h-3 w-3" /> : item.profitChange < 0 ? <TrendingDown className="h-3 w-3" /> : null}
          {item.profitChange.toFixed(0)}% gan.
        </div>
      </div>
    </Card>
  );

  if (!isMounted || !currentUser || primaryLoading || comparisonLoading) {
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
    <div className="flex min-h-screen w-full overflow-x-hidden flex-col bg-muted/40">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 overflow-x-hidden">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
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
                      onSelect={(range) => { setCustomDateRange(range); if (range?.from) setFilterPreset('custom'); }}
                      numberOfMonths={2}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Período de Comparación</CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <Select value={comparisonFilterPreset} onValueChange={(v) => { setComparisonFilterPreset(v as FilterPreset); setComparisonCustomDateRange(undefined); }}>
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
                    <Button id="date-comparison" variant={"outline"} className={cn("w-full sm:w-auto justify-start text-left font-normal flex-1", !comparisonCustomDateRange && "text-muted-foreground")}>
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
                      onSelect={(range) => { setComparisonCustomDateRange(range); if (range?.from) setComparisonFilterPreset('custom'); }}
                      numberOfMonths={2}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          </div>


          {/* Highlights */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Más Vendido</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {mostSoldItem ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{mostSoldItem.name}</div>
                      {renderChange(mostSoldItem.quantitySoldChange)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{mostSoldItem.quantitySold} unidades vendidas</p>
                    <p className="text-xs text-green-600">${mostSoldItem.totalRevenue.toFixed(2)} en ingresos</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay datos de ventas para el período principal</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Más Rentable (Ganancia Total)</CardTitle>
                <Gem className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {mostProfitableItem ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{mostProfitableItem.name}</div>
                      {renderChange(mostProfitableItem.profitChange)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      ${mostProfitableItem.profit.toFixed(2)} de ganancia total
                    </p>
                    <p className="text-xs text-muted-foreground">
                      (${((mostProfitableItem.profit / mostProfitableItem.quantitySold) || 0).toFixed(2)} por unidad)
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay datos de rentabilidad</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance by Category Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Categoría</CardTitle>
              <CardDescription>
                Período principal ({getFilterDateRangeString(primaryDateFilterRange)}) vs.
                Comparación ({getFilterDateRangeString(comparisonDateFilterRange)})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="platos" className="flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    Platos ({categorizedData.platos.length})
                  </TabsTrigger>
                  <TabsTrigger value="bebidas" className="flex items-center gap-2">
                    <Coffee className="h-4 w-4" />
                    Bebidas ({categorizedData.bebidas.length})
                  </TabsTrigger>
                  <TabsTrigger value="adicionales" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionales ({categorizedData.adicionales.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="platos" className="mt-6">
                  {categorizedData.platos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorizedData.platos.map((item) => (
                        <PerformanceItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay datos de platos para el período seleccionado
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="bebidas" className="mt-6">
                  {categorizedData.bebidas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorizedData.bebidas.map((item) => (
                        <PerformanceItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay datos de bebidas para el período seleccionado
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="adicionales" className="mt-6">
                  {categorizedData.adicionales.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorizedData.adicionales.map((item) => (
                        <PerformanceItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay datos de adicionales para el período seleccionado
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}