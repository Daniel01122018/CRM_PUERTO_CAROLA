"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from '@/components/ui/calendar';
import AppHeader from '@/components/app-header';
import { useToast } from '@/hooks/use-toast';
import { format, startOfDay, startOfMonth, endOfMonth, subDays, startOfWeek, endOfWeek, isWithinInterval, subMonths, startOfYesterday, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Wallet, PlusCircle, BarChart2, Calendar as CalendarIcon, FilterX, ChevronsUpDown, Check } from 'lucide-react';
import type { ExpenseCategory } from '@/types';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';


const expenseSchema = z.object({
  amount: z.coerce.number().positive({ message: 'El monto debe ser positivo.' }),
  category: z.string().min(1, { message: 'Debe seleccionar o ingresar una categoría.' }),
});

const PREDEFINED_CATEGORIES: ExpenseCategory[] = [
    "Pescado", "Chifles", "Supermercado", "Mercado Montebello", "Sueldos", 
    "Yuca", "Camarón", "Pedido de Colas", "Pan", "Gas", "Gasto Personal"
];

type FilterPreset = 'all' | 'today' | 'yesterday' | 'this_week' | 'last_7_days' | 'this_month' | 'last_month' | 'custom';

export default function ExpensesPage() {
  const { isMounted, currentUser, expenses, addExpense } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();

  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [filterPreset, setFilterPreset] = useState<FilterPreset>('this_month');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  
  const allCategories = useMemo(() => {
    const dynamicCategories = expenses.map(e => e.category);
    return [...new Set([...PREDEFINED_CATEGORIES, ...dynamicCategories])];
  }, [expenses]);


  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      category: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
    try {
      await addExpense(values);
      toast({
        title: 'Gasto Registrado',
        description: `Se ha añadido un gasto en "${values.category}" por un monto de $${values.amount.toFixed(2)}.`,
      });
      form.reset({ amount: 0, category: '' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al registrar',
        description: 'No se pudo guardar el gasto. Intente nuevamente.',
      });
    }
  };
  
  const dateFilterRange = useMemo(() => {
    const now = new Date();
    switch (filterPreset) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'yesterday':
        const yesterday = startOfYesterday();
        return { from: yesterday, to: endOfDay(yesterday) };
      case 'this_week':
        return { from: startOfWeek(now, { locale: es }), to: endOfWeek(now, { locale: es }) };
      case 'last_7_days':
        return { from: subDays(startOfDay(now), 6), to: endOfDay(now) };
      case 'this_month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case 'custom':
        return customDateRange?.from ? { from: startOfDay(customDateRange.from), to: customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(customDateRange.from) } : null;
      default:
        return null; // 'all'
    }
  }, [filterPreset, customDateRange]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(expense => {
        const categoryMatch = filterCategory === 'all' || expense.category === filterCategory;
        if (!dateFilterRange || !dateFilterRange.from) return categoryMatch;
        const dateMatch = isWithinInterval(new Date(expense.createdAt), { start: dateFilterRange.from, end: dateFilterRange.to! });
        return categoryMatch && dateMatch;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [expenses, filterCategory, dateFilterRange]);
  
  const filteredSummary = useMemo(() => {
      const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
      return { total, count: filteredExpenses.length };
  }, [filteredExpenses]);


  const summaryData = useMemo(() => {
    if (!isMounted) return { totalToday: 0, totalMonth: 0 };
    
    const now = new Date();
    const today = startOfDay(now);
    const monthStart = startOfMonth(now);

    const todaysExpenses = expenses.filter(e => new Date(e.createdAt) >= today);
    const monthsExpenses = expenses.filter(e => new Date(e.createdAt) >= monthStart);

    return {
      totalToday: todaysExpenses.reduce((sum, e) => sum + e.amount, 0),
      totalMonth: monthsExpenses.reduce((sum, e) => sum + e.amount, 0),
    };
  }, [expenses, isMounted]);

  useEffect(() => {
    if (isMounted && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [currentUser, isMounted, router]);
  
  const resetFilters = () => {
    setFilterCategory('all');
    setFilterPreset('this_month');
    setCustomDateRange(undefined);
  };

  if (!isMounted || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
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
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                Gestión de Gastos
            </h1>
            <Link href="/dashboard">
                <Button variant="outline" className="flex items-center gap-2">
                    <ArrowLeft className="h-5 w-5" />
                    Volver al Salón
                </Button>
            </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gastos de Hoy</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${summaryData.totalToday.toFixed(2)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${summaryData.totalMonth.toFixed(2)}</div>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardHeader>
                    <CardTitle>Registrar Nuevo Gasto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Categoría</FormLabel>
                             <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value
                                        ? allCategories.find(
                                            (cat) => cat === field.value
                                        )
                                        : "Seleccionar o escribir categoría"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                     <CommandInput placeholder="Buscar o crear categoría..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontró la categoría.</CommandEmpty>
                                        <CommandGroup>
                                        {allCategories.map((cat) => (
                                            <CommandItem
                                                value={cat}
                                                key={cat}
                                                onSelect={() => {
                                                    form.setValue("category", cat)
                                                }}
                                                >
                                                <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    cat === field.value
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                                />
                                                {cat}
                                            </CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monto ($)</FormLabel>
                          <FormControl><Input type="number" step="0.01" placeholder="ej. 25.50" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir Gasto
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </div>

          <div className="md:col-span-3">
             <Card>
                <CardHeader>
                    <CardTitle>Historial de Gastos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as ExpenseCategory | 'all')}>
                                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filtrar categoría" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las categorías</SelectItem>
                                    {allCategories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filterPreset} onValueChange={(v) => setFilterPreset(v as FilterPreset)}>
                                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filtrar por fecha" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todo el tiempo</SelectItem>
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
                                <Button variant={"outline"} className="w-full sm:w-auto justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {customDateRange?.from ? 
                                        customDateRange.to ? 
                                        `${format(customDateRange.from, 'LLL dd, y', { locale: es })} - ${format(customDateRange.to, 'LLL dd, y', { locale: es })}` : 
                                        format(customDateRange.from, 'LLL dd, y', { locale: es }) : 
                                        <span>Fecha personalizada</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={customDateRange?.from}
                                    selected={customDateRange}
                                    onSelect={(range) => { setCustomDateRange(range); setFilterPreset('custom'); }}
                                    numberOfMonths={2}
                                />
                                </PopoverContent>
                            </Popover>
                            
                            <Button variant="ghost" size="icon" onClick={resetFilters}>
                                <FilterX className="h-4 w-4" />
                            </Button>
                        </div>

                        <Card className="bg-muted/50">
                            <CardContent className="p-3 text-sm">
                                <p>
                                    Mostrando <strong>{filteredSummary.count} {filteredSummary.count === 1 ? 'gasto' : 'gastos'}</strong> con un total de <strong className="text-primary">${filteredSummary.total.toFixed(2)}</strong> para los filtros seleccionados.
                                </p>
                            </CardContent>
                        </Card>

                        <ScrollArea className="h-[45vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                 <TableBody>
                                    {filteredExpenses.length > 0 ? (
                                        filteredExpenses.map(expense => (
                                                <TableRow key={expense.id}>
                                                    <TableCell className="hidden sm:table-cell">
                                                        {format(new Date(expense.createdAt), "dd MMM yyyy", { locale: es })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{expense.category}</div>
                                                        <div className="text-xs text-muted-foreground sm:hidden">
                                                            {format(new Date(expense.createdAt), "dd/MM/yy", { locale: es })}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">${expense.amount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                No hay gastos que coincidan con los filtros.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
