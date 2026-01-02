"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import { useDailyStats } from '@/hooks/use-daily-stats';
import { migrateDailyStats } from '@/lib/migrate-daily-stats';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppSidebar from '@/components/app-sidebar';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, isWithinInterval, eachDayOfInterval, isSameDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, BarChart2, Calendar as CalendarIcon, DollarSign, Wallet, PiggyBank, FileText, RefreshCw, CreditCard, Utensils, Clock, TrendingUp, ShoppingBag, Store } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FilterPreset = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

const PIE_CHART_COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8",
  "#fa8072", "#7cebe1", "#ffc0cb", "#bada55", "#4cbb17"
];

const chartConfig = {
  Ingresos: { label: "Ingresos", color: "hsl(var(--primary))" },
  Gastos: { label: "Gastos", color: "hsl(var(--destructive))" },
};

export default function ReportsPage() {
  const { isMounted, currentUser } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();

  const [filterPreset, setFilterPreset] = useState<FilterPreset>('this_week');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isRecalculateAlertOpen, setIsRecalculateAlertOpen] = useState(false);

  useEffect(() => {
    if (isMounted && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [currentUser, isMounted, router]);

  const dateFilterRange = useMemo(() => {
    const now = new Date();
    switch (filterPreset) {
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
        if (!customDateRange?.from) return null;
        return {
          from: startOfDay(customDateRange.from),
          to: customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(customDateRange.from)
        };
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  }, [filterPreset, customDateRange]);

  // Use the new hook for daily stats
  const { stats, loading } = useDailyStats(dateFilterRange || undefined);

  const summaryKpis = useMemo(() => {
    const totalIncome = stats.reduce((sum, day) => sum + day.totalRevenue, 0);
    const totalExpenses = stats.reduce((sum, day) => sum + day.totalExpenses, 0);
    const netProfit = totalIncome - totalExpenses;
    const totalOrders = stats.reduce((sum, day) => sum + day.orderCount, 0);
    return { totalIncome, totalExpenses, netProfit, totalOrders };
  }, [stats]);

  const insights = useMemo(() => {
    // 1. Payment Methods
    const paymentMethods: { [key: string]: number } = {};
    let totalPaymentRevenue = 0;

    // 2. Service Type
    let mesaCount = 0;
    let llevarCount = 0;
    let mesaRevenue = 0;
    let llevarRevenue = 0;

    // 3. Hourly
    const hourlyDistribution: { [key: string]: number } = {};

    // 4. Products
    const productSales: { [id: string]: { id: string, name: string, quantity: number, revenue: number } } = {};

    stats.forEach(day => {
      // Payments
      if (day.paymentMethods) {
        Object.entries(day.paymentMethods).forEach(([method, amount]) => {
          paymentMethods[method] = (paymentMethods[method] || 0) + amount;
          totalPaymentRevenue += amount;
        });
      }

      // Service Type (New Field)
      if (day.serviceTypeBreakdown) {
        mesaCount += day.serviceTypeBreakdown.mesa?.count || 0;
        mesaRevenue += day.serviceTypeBreakdown.mesa?.revenue || 0;
        llevarCount += day.serviceTypeBreakdown.llevar?.count || 0;
        llevarRevenue += day.serviceTypeBreakdown.llevar?.revenue || 0;
      }

      // Hourly (New Field)
      if (day.hourlyOrders) {
        Object.entries(day.hourlyOrders).forEach(([hour, count]) => {
          hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + count;
        });
      }

      // Products
      if (day.itemSales) {
        Object.entries(day.itemSales).forEach(([id, item]) => {
          if (!productSales[id]) productSales[id] = { id, name: item.name, quantity: 0, revenue: 0 };
          productSales[id].quantity += item.quantity;
          productSales[id].revenue += item.revenue;
        });
      }
    });

    // Process Top Products
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    // Process Peak Hour
    let peakHour = "-";
    let maxOrders = 0;
    Object.entries(hourlyDistribution).forEach(([hour, count]) => {
      if (count > maxOrders) {
        maxOrders = count;
        peakHour = `${hour}:00 - ${parseInt(hour) + 1}:00`;
      }
    });

    // Average Ticket
    const averageTicket = summaryKpis.totalOrders > 0 ? summaryKpis.totalIncome / summaryKpis.totalOrders : 0;

    return {
      paymentMethods,
      totalPaymentRevenue,
      serviceType: { mesaCount, mesaRevenue, llevarCount, llevarRevenue },
      peakHour,
      topProducts,
      averageTicket
    };
  }, [stats, summaryKpis]);

  const dailyChartData = useMemo(() => {
    if (!dateFilterRange?.from || !dateFilterRange.to) return [];
    const days = eachDayOfInterval({ start: dateFilterRange.from, end: dateFilterRange.to });

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayStat = stats.find(s => s.date === dateStr);
      return {
        date: format(day, 'dd/MM'),
        Ingresos: dayStat ? parseFloat(dayStat.totalRevenue.toFixed(2)) : 0,
        Gastos: dayStat ? parseFloat(dayStat.totalExpenses.toFixed(2)) : 0,
      };
    });
  }, [stats, dateFilterRange]);

  const expenseBreakdownData = useMemo(() => {
    const breakdown: { [key: string]: number } = {};
    stats.forEach(day => {
      if (day.categoryBreakdown) {
        Object.entries(day.categoryBreakdown).forEach(([cat, amount]) => {
          breakdown[cat] = (breakdown[cat] || 0) + amount;
        });
      }
    });
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const handlePrintReport = () => window.print();

  /* New Recalculation Flow State */
  const [isRecalculateDialogOpen, setIsRecalculateDialogOpen] = useState(false);
  const [recalculateStep, setRecalculateStep] = useState<'select' | 'confirm'>('select');
  const [recalculateRange, setRecalculateRange] = useState<'all' | 'last_30' | 'last_7' | 'this_month'>('all');

  const handleRecalculateOpen = () => {
    setRecalculateStep('select');
    setRecalculateRange('all'); // Default
    setIsRecalculateDialogOpen(true);
  };

  const handleRecalculateNext = () => {
    setRecalculateStep('confirm');
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    // Keep dialog open during process or close it? 
    // Usually close and show loading toast/indicator elsewhere, OR keep valid loading state in dialog.
    // For now, close dialog and show button spinner.
    setIsRecalculateDialogOpen(false);

    try {
      let startDate: Date | undefined;
      const now = new Date();

      switch (recalculateRange) {
        case 'last_30':
          startDate = subDays(startOfDay(now), 30);
          break;
        case 'last_7':
          startDate = subDays(startOfDay(now), 7);
          break;
        case 'this_month':
          startDate = startOfMonth(now);
          break;
        case 'all':
        default:
          startDate = undefined;
      }

      const result = await migrateDailyStats(startDate);
      if (result.success) {
        toast({
          title: "Datos Recalculados",
          description: `Se han procesado ${result.daysProcessed} días correctamente.`,
        });
        window.location.reload();
      } else {
        throw new Error("Error en la migración");
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron recalcular los datos.",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const getFilterDateRangeString = () => {
    if (!dateFilterRange?.from) return "Rango no definido";
    const fromStr = format(dateFilterRange.from, 'dd/MM/yyyy');
    if (!dateFilterRange.to || isSameDay(dateFilterRange.from, dateFilterRange.to)) return fromStr;
    const toStr = format(dateFilterRange.to, 'dd/MM/yyyy');
    return `${fromStr} - ${toStr}`;
  };

  if (!isMounted || !currentUser) {
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
            <div className='flex items-center gap-3'>
              <Link href="/admin/dashboard">
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Volver</span>
                </Button>
              </Link>
              <AppSidebar />
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <BarChart2 className="h-6 w-6" />
                <span className="hidden sm:inline">Reportes Financieros</span>
                <span className="sm:hidden">Reportes</span>
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Filters moved to header */}
              <Select value={filterPreset} onValueChange={(v) => { setFilterPreset(v as FilterPreset); setCustomDateRange(undefined); }}>
                <SelectTrigger className="w-full sm:w-[150px] h-9">
                  <SelectValue placeholder="Periodo" />
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
                  <Button id="date" variant={"outline"} size="sm" className={cn("w-full sm:w-auto justify-start text-left font-normal h-9", !customDateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange?.from ?
                      customDateRange.to ?
                        `${format(customDateRange.from, 'dd/MM')} - ${format(customDateRange.to, 'dd/MM')}` :
                        format(customDateRange.from, 'dd/MM') :
                      <span>Personalizado</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
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

              <div className="h-6 w-px bg-border hidden sm:block mx-1" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculateOpen}
                disabled={isRecalculating}
                className="h-9"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", isRecalculating && "animate-spin")} />
                <span className="hidden lg:inline">Recalcular</span>
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrintReport} className="h-9 w-9">
                <FileText className="h-4 w-4" />
                <span className="sr-only">Imprimir</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="resumen" className="space-y-4">
            <TabsList>
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="analisis">Análisis</TabsTrigger>
              <TabsTrigger value="detalles">Detalles</TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="space-y-4">
              {/* KPIs Grid */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${summaryKpis.totalIncome.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{summaryKpis.totalOrders} ventas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gastos</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">${summaryKpis.totalExpenses.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Registros de egresos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ticket Prom.</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${insights.averageTicket.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Por pedido</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary text-primary-foreground">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Utilidad</CardTitle>
                    <PiggyBank className="h-4 w-4 text-primary-foreground/80" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">${summaryKpis.netProfit.toFixed(2)}</div>
                    <p className="text-xs text-primary-foreground/80">Neta</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts moved here from deleted tab */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-5 pt-2">
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-lg">Ingresos vs. Gastos</CardTitle>
                    <CardDescription>Comparación diaria.</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-0 sm:pl-2">
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                      <BarChart accessibilityLayer data={dailyChartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} fontSize={12} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Legend content={<ChartLegendContent />} />
                        <Bar dataKey="Ingresos" fill="var(--color-Ingresos)" radius={4} />
                        <Bar dataKey="Gastos" fill="var(--color-Gastos)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Desglose Gastos</CardTitle>
                    <CardDescription>Por categoría.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {expenseBreakdownData.length > 0 ? (
                      <ChartContainer config={{}} className="h-[250px] w-full">
                        <PieChart>
                          <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                          <Pie
                            data={expenseBreakdownData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            innerRadius={30}
                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                          >
                            {expenseBreakdownData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                        No hay datos.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analisis" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Payment Methods Card */}
                <Card className="col-span-1 lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Métodos de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(insights.paymentMethods).sort((a, b) => b[1] - a[1]).map(([method, amount]) => (
                        <div key={method} className="flex items-center justify-between">
                          <span className="capitalize text-sm">{method === 'deuna' ? 'DeUna' : method}</span>
                          <div className="text-right">
                            <div className="font-bold text-sm">${amount.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              {((amount / insights.totalPaymentRevenue) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                      {Object.keys(insights.paymentMethods).length === 0 && (
                        <p className="text-sm text-muted-foreground">No hay datos de pagos.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Service Type Card */}
                <Card className="col-span-1 lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Utensils className="h-4 w-4" />
                      Tipo de Servicio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Store className="h-8 w-8 text-muted-foreground/50" />
                          <div>
                            <p className="text-sm font-medium">En Mesa</p>
                            <p className="text-xs text-muted-foreground">{insights.serviceType.mesaCount} pedidos</p>
                          </div>
                        </div>
                        <div className="font-bold">${insights.serviceType.mesaRevenue.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                          <div>
                            <p className="text-sm font-medium">Para Llevar</p>
                            <p className="text-xs text-muted-foreground">{insights.serviceType.llevarCount} pedidos</p>
                          </div>
                        </div>
                        <div className="font-bold">${insights.serviceType.llevarRevenue.toFixed(2)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Peak Hour & Top Products Combined Column */}
                <div className="space-y-4 col-span-1 lg:col-span-1">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Hora Pico</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{insights.peakHour}</div>
                      <p className="text-xs text-muted-foreground">Mayor volumen de ventas</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Top 3 Productos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {insights.topProducts.map((product, i) => (
                          <div key={product.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-muted-foreground w-4">#{i + 1}</span>
                              <span className="truncate max-w-[120px]" title={product.name}>{product.name}</span>
                            </div>
                            <span className="font-medium">{product.quantity} un.</span>
                          </div>
                        ))}
                        {insights.topProducts.length === 0 && (
                          <p className="text-xs text-muted-foreground">No hay datos de productos.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="detalles" className="space-y-4">
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Resumen por Día</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Ingresos</TableHead>
                          <TableHead className="text-right">Gastos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyChartData.map(day => (
                          <TableRow key={day.date}>
                            <TableCell>{day.date}</TableCell>
                            <TableCell className="text-right">${day.Ingresos.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${day.Gastos.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Desglose de Gastos</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoría</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenseBreakdownData.length > 0 ? expenseBreakdownData.map(cat => (
                          <TableRow key={cat.name}>
                            <TableCell>{cat.name}</TableCell>
                            <TableCell className="text-right">${cat.value.toFixed(2)}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center h-24">No hay gastos en este período.</TableCell>
                          </TableRow>
                        )}
                        <TableRow className="font-bold bg-muted/50">
                          <TableCell>Total Gastos</TableCell>
                          <TableCell className="text-right">${summaryKpis.totalExpenses.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="hidden">
            {/* Note: Printing structure is kept separate at the bottom in existing code */}
          </div>
        </div>

        {/* Printable Report Section */}
        <div className="hidden print:block print-report-container print:p-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">El Puerto de Carola</h1>
            <h2 className="text-xl font-semibold">Reporte Financiero</h2>
            <p className="text-sm">Período: {getFilterDateRangeString()}</p>
            <p className="text-xs">Generado el: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border p-4 rounded-lg print:border print:shadow-none">
              <h3 className="font-semibold text-sm">Ingresos Totales</h3>
              <p className="text-xl font-bold">${summaryKpis.totalIncome.toFixed(2)}</p>
              <p className="text-xs">{summaryKpis.totalOrders} ventas</p>
            </div>
            <div className="border p-4 rounded-lg print:border print:shadow-none">
              <h3 className="font-semibold text-sm">Gastos Totales</h3>
              <p className="text-xl font-bold">${summaryKpis.totalExpenses.toFixed(2)}</p>
              <p className="text-xs">{stats.reduce((acc, curr) => acc + (curr.totalExpenses > 0 ? 1 : 0), 0)} días con egresos</p>
            </div>
            <div className="border p-4 rounded-lg print:border print:shadow-none print:bg-transparent print:text-black">
              <h3 className="font-semibold text-sm">Utilidad Neta</h3>
              <p className="text-xl font-bold">${summaryKpis.netProfit.toFixed(2)}</p>
              <p className="text-xs">Ingresos - Gastos</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Resumen por Día</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Gastos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyChartData.map(day => (
                    <TableRow key={day.date}>
                      <TableCell>{day.date}</TableCell>
                      <TableCell className="text-right">${day.Ingresos.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${day.Gastos.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Desglose de Gastos</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseBreakdownData.length > 0 ? expenseBreakdownData.map(cat => (
                    <TableRow key={cat.name}>
                      <TableCell>{cat.name}</TableCell>
                      <TableCell className="text-right">${cat.value.toFixed(2)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center h-24">No hay gastos en este período.</TableCell>
                    </TableRow>
                  )}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell>Total Gastos</TableCell>
                    <TableCell className="text-right">${summaryKpis.totalExpenses.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isRecalculateDialogOpen} onOpenChange={setIsRecalculateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recalcular Estadísticas</DialogTitle>
            <DialogDescription>
              {recalculateStep === 'select'
                ? "Seleccione el rango de tiempo para actualizar."
                : "Confirme la operación para el rango seleccionado."}
            </DialogDescription>
          </DialogHeader>

          {recalculateStep === 'select' ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant={recalculateRange === 'all' ? 'default' : 'outline'} onClick={() => setRecalculateRange('all')} className="h-20 flex-col">
                  <span className="text-lg font-bold">Todo</span>
                  <span className="text-xs font-normal opacity-80">Reconstruir historial completo</span>
                </Button>
                <Button variant={recalculateRange === 'last_30' ? 'default' : 'outline'} onClick={() => setRecalculateRange('last_30')} className="h-20 flex-col">
                  <span className="text-lg font-bold">30 Días</span>
                  <span className="text-xs font-normal opacity-80">Último mes de actividad</span>
                </Button>
                <Button variant={recalculateRange === 'this_month' ? 'default' : 'outline'} onClick={() => setRecalculateRange('this_month')} className="h-20 flex-col">
                  <span className="text-lg font-bold">Este Mes</span>
                  <span className="text-xs font-normal opacity-80">Mes actual ({format(new Date(), 'MMMM', { locale: es })})</span>
                </Button>
                <Button variant={recalculateRange === 'last_7' ? 'default' : 'outline'} onClick={() => setRecalculateRange('last_7')} className="h-20 flex-col">
                  <span className="text-lg font-bold">7 Días</span>
                  <span className="text-xs font-normal opacity-80">Última semana</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-900 text-sm mb-4">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Advertencia de Rendimiento</p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Está a punto de recalcular datos para:
                  <strong>
                    {recalculateRange === 'all' ? ' Todo el historial' :
                      recalculateRange === 'last_30' ? ' Últimos 30 días' :
                        recalculateRange === 'this_month' ? ' Este mes' : ' Últimos 7 días'}
                  </strong>.
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-2">
                  Esta operación puede tardar unos momentos y afectar el rendimiento si el rango es muy grande.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {recalculateStep === 'select' ? (
              <>
                <Button variant="outline" onClick={() => setIsRecalculateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleRecalculateNext}>Siguiente</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setRecalculateStep('select')} className="mr-auto">Atrás</Button>
                <Button variant="destructive" onClick={handleRecalculate}>Confirmar y Recalcular</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}