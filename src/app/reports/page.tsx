
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
import AppHeader from '@/components/app-header';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, isWithinInterval, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, BarChart2, Calendar as CalendarIcon, DollarSign, Wallet, PiggyBank } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

type FilterPreset = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

const PIE_CHART_COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8",
  "#fa8072", "#7cebe1", "#ffc0cb", "#bada55", "#4cbb17"
];

export default function ReportsPage() {
  const { isMounted, currentUser, orders, expenses } = useAppStore();
  const router = useRouter();

  const [filterPreset, setFilterPreset] = useState<FilterPreset>('this_month');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    if (isMounted && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [currentUser, isMounted, router]);


  const completedOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => o.status === 'completed');
  }, [orders]);

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
        return null;
    }
  }, [filterPreset, customDateRange]);

  const filteredData = useMemo(() => {
    if (!completedOrders || !expenses || !dateFilterRange) {
      return { filteredOrders: [], filteredExpenses: [] };
    }

    const { from, to } = dateFilterRange;
    if (!from || !to) return { filteredOrders: [], filteredExpenses: [] };
    
    const interval = { start: from, end: to };

    const filteredOrders = completedOrders.filter(o => isWithinInterval(new Date(o.createdAt), interval));
    const filteredExpenses = expenses.filter(e => isWithinInterval(new Date(e.createdAt), interval));
    
    return { filteredOrders, filteredExpenses };
  }, [completedOrders, expenses, dateFilterRange]);

  const summaryKpis = useMemo(() => {
    const totalIncome = filteredData.filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalExpenses = filteredData.filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, netProfit };
  }, [filteredData]);
  
  const dailyChartData = useMemo(() => {
    if (!dateFilterRange?.from || !dateFilterRange.to) return [];
    
    const days = eachDayOfInterval({ start: dateFilterRange.from, end: dateFilterRange.to });
    
    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const interval = { start: dayStart, end: dayEnd };

      const income = filteredData.filteredOrders
        .filter(o => isWithinInterval(new Date(o.createdAt), interval))
        .reduce((sum, o) => sum + o.total, 0);
        
      const expense = filteredData.filteredExpenses
        .filter(e => isWithinInterval(new Date(e.createdAt), interval))
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        date: format(day, 'dd/MM'),
        Ingresos: parseFloat(income.toFixed(2)),
        Gastos: parseFloat(expense.toFixed(2)),
      };
    });
  }, [filteredData, dateFilterRange]);
  
  const expenseBreakdownData = useMemo(() => {
    const breakdown: { [key: string]: number } = {};
    filteredData.filteredExpenses.forEach(expense => {
      breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.amount;
    });

    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData.filteredExpenses]);

  if (!isMounted || !currentUser || !orders || !expenses) {
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
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart2 className="h-8 w-8" />
            Reportes Financieros
          </h1>
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              Volver al Salón
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-2 items-center">
                 <Select value={filterPreset} onValueChange={(v) => { setFilterPreset(v as FilterPreset); setCustomDateRange(undefined); }}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filtrar por fecha" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="this_week">Esta semana</SelectItem>
                        <SelectItem value="last_week">Semana pasada</SelectItem>
                        <SelectItem value="this_month">Este mes</SelectItem>
                        <SelectItem value="last_month">Mes pasado</SelectItem>
                    </SelectContent>
                </Select>
                
                <Popover>
                    <PopoverTrigger asChild>
                    <Button id="date" variant={"outline"} className={cn("w-full sm:w-auto justify-start text-left font-normal", !customDateRange && "text-muted-foreground")}>
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summaryKpis.totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Suma de todas las ventas completadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${summaryKpis.totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Suma de todos los egresos registrados</p>
            </CardContent>
          </Card>
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilidad Neta</CardTitle>
              <PiggyBank className="h-4 w-4 text-primary-foreground/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${summaryKpis.netProfit.toFixed(2)}</div>
              <p className="text-xs text-primary-foreground/80">Ingresos menos gastos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Ingresos vs. Gastos</CardTitle>
                    <CardDescription>Comparación diaria de ingresos y gastos para el período seleccionado.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ChartContainer config={{ Ingresos: { label: "Ingresos", color: "hsl(var(--chart-1))" }, Gastos: { label: "Gastos", color: "hsl(var(--destructive))" } }} className="h-[300px] w-full">
                        <BarChart accessibilityLayer data={dailyChartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="Ingresos" fill="var(--color-Ingresos)" radius={4} />
                            <Bar dataKey="Gastos" fill="var(--color-Gastos)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Desglose de Gastos</CardTitle>
                    <CardDescription>Distribución de gastos por categoría.</CardDescription>
                </CardHeader>
                <CardContent>
                     {expenseBreakdownData.length > 0 ? (
                        <ChartContainer config={{}} className="h-[300px] w-full">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                <Pie data={expenseBreakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {expenseBreakdownData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                      ) : (
                        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                            No hay datos de gastos para mostrar.
                        </div>
                      )}
                </CardContent>
            </Card>
        </div>

      </main>
    </div>
  );
}
