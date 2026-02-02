"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import { useDailyStats } from '@/hooks/use-daily-stats';
import type { FirestoreItem } from '@/types';
import { useCrmMenu } from '@/hooks/use-crm-menu';
import { findMenuItem } from '@/lib/stats-helper';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppSidebar from '@/components/app-sidebar';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, BarChart2, Calendar as CalendarIcon, Filter, TrendingUp, TrendingDown, Utensils, Coffee, Plus, Search, ArrowUpDown, ShoppingBag, Store } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import type { DailyStats } from '@/types';

type FilterPreset = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

interface MenuItemPerformance {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
  cost: number;
  profit: number;
  contexto?: 'salon' | 'llevar';
}

interface MenuItemComparisonPerformance extends MenuItemPerformance {
  comparisonQuantitySold: number;
  comparisonTotalRevenue: number;
  comparisonProfit: number;
  // Diffs
  quantityDiff: number;
  revenueDiff: number;
  // Percentages
  quantitySoldChange: number;
  totalRevenueChange: number;
  profitChange: number;
}

type SortKey = 'name' | 'quantitySold' | 'totalRevenue' | 'profit';
type SortDirection = 'asc' | 'desc';

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
const calculatePerformanceData = (stats: DailyStats[], menuItems: FirestoreItem[]): Map<string, MenuItemPerformance> => {
  const itemMap = new Map<string, MenuItemPerformance>();

  stats.forEach(stat => {
    if (stat.itemSales) {
      Object.entries(stat.itemSales).forEach(([itemId, salesInfo]) => {
        // Type assertion for salesInfo
        const typedSalesInfo = salesInfo as { name: string; quantity: number; revenue: number };

        const menuItem = findMenuItem(menuItems, itemId);

        let category = 'Sin Categoría';
        let cost = 0;
        let contexto: 'salon' | 'llevar' | undefined = undefined;

        if (menuItem) {
          category = menuItem.category || 'Sin Categoría';
          contexto = menuItem.contexto;
          cost = menuItem.price || 0;
        }

        if (!itemMap.has(itemId)) {
          itemMap.set(itemId, {
            id: itemId,
            name: typedSalesInfo.name,
            category,
            quantitySold: 0,
            totalRevenue: 0,
            cost,
            profit: 0,
            contexto
          });
        }

        const currentStats = itemMap.get(itemId)!;
        currentStats.quantitySold += typedSalesInfo.quantity;
        currentStats.totalRevenue += typedSalesInfo.revenue;
        currentStats.profit = currentStats.totalRevenue - (currentStats.cost * currentStats.quantitySold);
      });
    }
  });

  return itemMap;
};

const categorizeMenuItems = (performanceData: MenuItemComparisonPerformance[]) => {
  const bebidas: MenuItemComparisonPerformance[] = [];
  const adicionales: MenuItemComparisonPerformance[] = [];
  const platosSalon: MenuItemComparisonPerformance[] = [];
  const platosLlevar: MenuItemComparisonPerformance[] = [];

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
      // Logic for Platos Split
      if (item.contexto === 'llevar') {
        platosLlevar.push(item);
      } else {
        platosSalon.push(item);
      }
    }
  });

  return { platosSalon, platosLlevar, bebidas, adicionales };
};

export default function PerformanceReportPage() {
  const { isMounted, currentUser } = useAppStore();
  const { items: menuItems } = useCrmMenu();
  const router = useRouter();

  // Primary Period State
  const [filterPreset, setFilterPreset] = useState<FilterPreset>('this_week');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  // Comparison Period State
  const [comparisonFilterPreset, setComparisonFilterPreset] = useState<FilterPreset>('last_week');
  const [comparisonCustomDateRange, setComparisonCustomDateRange] = useState<DateRange | undefined>(undefined);

  // UI State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mainTab, setMainTab] = useState('insights'); // 'insights' | 'table'
  const [tableTab, setTableTab] = useState('platos_salon');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'quantitySold', direction: 'desc' });

  useEffect(() => {
    if (isMounted && (!currentUser || currentUser.role !== 'admin')) {
      // router.push('/dashboard'); // Commented out for dev flow if needed, but safer to keep
    }
  }, [currentUser, isMounted, router]);

  const primaryDateFilterRange = useMemo(() => generateDateRange(filterPreset, customDateRange), [filterPreset, customDateRange]);
  const comparisonDateFilterRange = useMemo(() => generateDateRange(comparisonFilterPreset, comparisonCustomDateRange), [comparisonFilterPreset, comparisonCustomDateRange]);

  // Fetch data using hooks
  const { stats: primaryStats, loading: primaryLoading } = useDailyStats(primaryDateFilterRange);
  const { stats: comparisonStats, loading: comparisonLoading } = useDailyStats(comparisonDateFilterRange);

  const primaryPerformanceDataMap = useMemo(() => calculatePerformanceData(primaryStats || [], menuItems), [primaryStats, menuItems]);
  const comparisonPerformanceDataMap = useMemo(() => calculatePerformanceData(comparisonStats || [], menuItems), [comparisonStats, menuItems]);

  const combinedPerformanceData = useMemo(() => {
    const combined: MenuItemComparisonPerformance[] = [];
    const allMenuItemIds = new Set([...Array.from(primaryPerformanceDataMap.keys()), ...Array.from(comparisonPerformanceDataMap.keys())]);

    allMenuItemIds.forEach(id => {
      const primaryItem = primaryPerformanceDataMap.get(id);
      const comparisonItem = comparisonPerformanceDataMap.get(id);

      const name = primaryItem?.name || comparisonItem?.name || `Unknown Item ${id}`;
      const category = primaryItem?.category || comparisonItem?.category || 'Sin Categoría';
      const cost = primaryItem?.cost || comparisonItem?.cost || 0;
      const contexto = primaryItem?.contexto || comparisonItem?.contexto;

      const quantitySold = primaryItem?.quantitySold || 0;
      const totalRevenue = primaryItem?.totalRevenue || 0;
      const profit = primaryItem?.profit || 0;

      const comparisonQuantitySold = comparisonItem?.quantitySold || 0;
      const comparisonTotalRevenue = comparisonItem?.totalRevenue || 0;
      const comparisonProfit = comparisonItem?.profit || 0;

      // Diffs
      const quantityDiff = quantitySold - comparisonQuantitySold;
      const revenueDiff = totalRevenue - comparisonTotalRevenue;

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
        contexto,
        comparisonQuantitySold,
        comparisonTotalRevenue,
        comparisonProfit,
        quantityDiff,
        revenueDiff,
        quantitySoldChange,
        totalRevenueChange,
        profitChange,
      });
    });

    return combined;
  }, [primaryPerformanceDataMap, comparisonPerformanceDataMap]);

  const categorizedData = useMemo(() => categorizeMenuItems(combinedPerformanceData), [combinedPerformanceData]);

  const currentTabData = useMemo(() => {
    switch (tableTab) {
      case 'bebidas': return categorizedData.bebidas;
      case 'adicionales': return categorizedData.adicionales;
      case 'platos_llevar': return categorizedData.platosLlevar;
      default: return categorizedData.platosSalon;
    }
  }, [tableTab, categorizedData]);

  const filteredAndSortedData = useMemo(() => {
    let data = [...currentTabData];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(item => item.name.toLowerCase().includes(lowerQuery));
    }

    data.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [currentTabData, searchQuery, sortConfig]);

  // Insights Calculations
  const mostSoldItem = useMemo(() => combinedPerformanceData.length > 0 ? combinedPerformanceData.reduce((prev, current) => (prev.quantitySold > current.quantitySold ? prev : current)) : null, [combinedPerformanceData]);
  const mostProfitableItem = useMemo(() => combinedPerformanceData.length > 0 ? combinedPerformanceData.reduce((prev, current) => (prev.profit > current.profit ? prev : current)) : null, [combinedPerformanceData]);

  const topGrowthItem = useMemo(() => combinedPerformanceData.length > 0 ? combinedPerformanceData.reduce((prev, current) => (prev.revenueDiff > current.revenueDiff ? prev : current)) : null, [combinedPerformanceData]);
  const topDeclineItem = useMemo(() => combinedPerformanceData.length > 0 ? combinedPerformanceData.reduce((prev, current) => (prev.revenueDiff < current.revenueDiff ? prev : current)) : null, [combinedPerformanceData]);

  const salonRevenue = useMemo(() => combinedPerformanceData.filter(i => i.contexto !== 'llevar').reduce((acc, curr) => acc + curr.totalRevenue, 0), [combinedPerformanceData]);
  const llevarRevenue = useMemo(() => combinedPerformanceData.filter(i => i.contexto === 'llevar').reduce((acc, curr) => acc + curr.totalRevenue, 0), [combinedPerformanceData]);

  const getFilterDateRangeString = (range: { from: Date; to: Date } | null) => {
    if (!range?.from) return "Rango no definido";
    const fromStr = format(range.from, 'dd/MM/yyyy');
    if (!range.to || isSameDay(range.from, range.to)) return fromStr;
    const toStr = format(range.to, 'dd/MM/yyyy');
    return `${fromStr} - ${toStr}`;
  };

  const renderBadgeChange = (val: number, isCurrency = false) => {
    if (val === 0) return <Badge variant="outline" className="text-[10px] text-muted-foreground border-slate-200">0</Badge>;
    const isPositive = val > 0;
    const text = isCurrency ? `$${Math.abs(val).toFixed(2)}` : `${Math.abs(val)}`;

    return (
      <Badge variant="outline" className={cn(
        "text-[10px] gap-1",
        isPositive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
      )}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? '+' : '-'}{text}
      </Badge>
    );
  }

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

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
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                  <BarChart2 className="h-6 w-6 sm:h-8 sm:w-8" />
                  Reporte de Rendimiento
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {getFilterDateRangeString(primaryDateFilterRange)} <span className="text-xs mx-1">vs</span> {getFilterDateRangeString(comparisonDateFilterRange)}
                </p>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2 justify-start md:justify-end">
              <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Configurar Periodos
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Configuración de Periodos</DialogTitle>
                    <DialogDescription>Seleccione los rangos de fechas para comparar.</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                      <h3 className="font-medium">Período Principal</h3>
                      <Select value={filterPreset} onValueChange={(v) => { setFilterPreset(v as FilterPreset); setCustomDateRange(undefined); }}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar periodo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="this_week">Esta semana</SelectItem>
                          <SelectItem value="last_week">Semana pasada</SelectItem>
                          <SelectItem value="this_month">Este mes</SelectItem>
                          <SelectItem value="last_month">Mes pasado</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="border rounded-md p-2">
                        <Calendar mode="range" selected={customDateRange} onSelect={(r) => { setCustomDateRange(r); if (r?.from) setFilterPreset('custom'); }} locale={es} numberOfMonths={1} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-medium">Período de Comparación</h3>
                      <Select value={comparisonFilterPreset} onValueChange={(v) => { setComparisonFilterPreset(v as FilterPreset); setComparisonCustomDateRange(undefined); }}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar periodo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="this_week">Esta semana</SelectItem>
                          <SelectItem value="last_week">Semana pasada</SelectItem>
                          <SelectItem value="this_month">Este mes</SelectItem>
                          <SelectItem value="last_month">Mes pasado</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="border rounded-md p-2">
                        <Calendar mode="range" selected={comparisonCustomDateRange} onSelect={(r) => { setComparisonCustomDateRange(r); if (r?.from) setComparisonFilterPreset('custom'); }} locale={es} numberOfMonths={1} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setIsFilterOpen(false)}>Aplicar Filtros</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Link href="/admin/dashboard" className="flex-1 sm:flex-none">
                <Button variant="ghost" className="flex items-center gap-2 w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  Volver
                </Button>
              </Link>
            </div>
          </div>

          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
              <TabsTrigger value="insights">Insights & Resumen</TabsTrigger>
              <TabsTrigger value="table">Tabla Detallada</TabsTrigger>
            </TabsList>

            <TabsContent value="insights">
              {/* Highlights */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Más Vendido</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {mostSoldItem ? (
                      <div>
                        <div className="text-2xl font-bold truncate" title={mostSoldItem.name}>{mostSoldItem.name}</div>
                        <div className="flex gap-2 mt-1">
                          {renderBadgeChange(mostSoldItem.quantityDiff)}
                          {renderBadgeChange(mostSoldItem.revenueDiff, true)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{mostSoldItem.quantitySold} vendidas / ${mostSoldItem.totalRevenue.toFixed(2)}</p>
                      </div>
                    ) : <p className="text-sm text-muted-foreground">Sin datos</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mayor Crecimiento</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    {topGrowthItem && topGrowthItem.revenueDiff > 0 ? (
                      <div>
                        <div className="text-2xl font-bold truncate" title={topGrowthItem.name}>{topGrowthItem.name}</div>
                        <div className="flex gap-2 mt-1">
                          {renderBadgeChange(topGrowthItem.quantityDiff)}
                          {renderBadgeChange(topGrowthItem.revenueDiff, true)}
                        </div>
                        <p className="text-xs text-green-600 mt-2">Ingresos aumentaron</p>
                      </div>
                    ) : <p className="text-sm text-muted-foreground">Sin crecimiento significativo</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mayor Caída</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    {topDeclineItem && topDeclineItem.revenueDiff < 0 ? (
                      <div>
                        <div className="text-2xl font-bold truncate" title={topDeclineItem.name}>{topDeclineItem.name}</div>
                        <div className="flex gap-2 mt-1">
                          {renderBadgeChange(topDeclineItem.quantityDiff)}
                          {renderBadgeChange(topDeclineItem.revenueDiff, true)}
                        </div>
                        <p className="text-xs text-red-600 mt-2">Ingresos disminuyeron</p>
                      </div>
                    ) : <p className="text-sm text-muted-foreground">Sin caídas significativas</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mix de Ventas</CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Utensils className="h-4 w-4 mr-2 text-blue-500" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">Salón</p>
                          <p className="text-sm text-muted-foreground">${salonRevenue.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <ShoppingBag className="h-4 w-4 mr-2 text-orange-500" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">Para Llevar</p>
                          <p className="text-sm text-muted-foreground">${llevarRevenue.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="table">
              {/* Performance by Category Tabs */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Detalle de Productos</CardTitle>
                    </div>
                    <div className="w-full md:w-64 relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar producto..."
                        className="pl-9 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs value={tableTab} onValueChange={setTableTab} className="w-full">
                    <div className="px-6">
                      <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="platos_salon" className="flex items-center gap-2">
                          <Utensils className="h-4 w-4" />
                          <span className="hidden sm:inline">Salón ({categorizedData.platosSalon.length})</span>
                          <span className="sm:hidden">Salón</span>
                        </TabsTrigger>
                        <TabsTrigger value="platos_llevar" className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          <span className="hidden sm:inline">Llevar ({categorizedData.platosLlevar.length})</span>
                          <span className="sm:hidden">Llevar</span>
                        </TabsTrigger>
                        <TabsTrigger value="bebidas" className="flex items-center gap-2">
                          <Coffee className="h-4 w-4" />
                          <span className="hidden sm:inline">Bebidas ({categorizedData.bebidas.length})</span>
                          <span className="sm:hidden">Bebidas</span>
                        </TabsTrigger>
                        <TabsTrigger value="adicionales" className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          <span className="hidden sm:inline">Adic. ({categorizedData.adicionales.length})</span>
                          <span className="sm:hidden">Adic.</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value={tableTab} className="m-0">
                      {filteredAndSortedData.length > 0 ? (
                        <>
                          {/* Desktop Table View */}
                          <div className="hidden md:block overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[40%] cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-2">
                                      Producto
                                      {sortConfig.key === 'name' && <ArrowUpDown className="h-3 w-3" />}
                                    </div>
                                  </TableHead>
                                  <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleSort('quantitySold')}>
                                    <div className="flex items-center justify-end gap-2">
                                      Ventas (Unid.)
                                      {sortConfig.key === 'quantitySold' && <ArrowUpDown className="h-3 w-3" />}
                                    </div>
                                  </TableHead>
                                  <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleSort('totalRevenue')}>
                                    <div className="flex items-center justify-end gap-2">
                                      Ingresos
                                      {sortConfig.key === 'totalRevenue' && <ArrowUpDown className="h-3 w-3" />}
                                    </div>
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredAndSortedData.map((item) => (
                                  <TableRow key={item.id} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                      <div className="flex flex-col">
                                        <span className="text-base">{item.name}</span>
                                        <span className="text-xs text-muted-foreground">{item.category}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex flex-col items-end gap-1">
                                        <span className="font-bold">{item.quantitySold}</span>
                                        {renderBadgeChange(item.quantityDiff)}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex flex-col items-end gap-1">
                                        <span className="font-medium">${item.totalRevenue.toFixed(2)}</span>
                                        {renderBadgeChange(item.revenueDiff, true)}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Mobile List View */}
                          <div className="md:hidden flex flex-col divide-y">
                            {filteredAndSortedData.map((item) => (
                              <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-semibold text-base">{item.name}</h3>
                                    <p className="text-xs text-muted-foreground">{item.category}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Ventas</p>
                                    <div className="flex items-baseline gap-2">
                                      <span className="font-bold">{item.quantitySold}</span>
                                      {renderBadgeChange(item.quantityDiff)}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Ingresos</p>
                                    <div className="flex items-baseline gap-2">
                                      <span className="font-medium">${item.totalRevenue.toFixed(2)}</span>
                                      {renderBadgeChange(item.revenueDiff, true)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          {searchQuery ? (
                            <p>No se encontraron productos que coincidan con "{searchQuery}"</p>
                          ) : (
                            <p>No hay datos disponibles para el período seleccionado</p>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </div>
  );
}