"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import AppHeader from '@/components/app-header';
import { useToast } from '@/hooks/use-toast';
import { format, startOfDay, startOfMonth, isSameDay, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Wallet, PlusCircle, BarChart2 } from 'lucide-react';
import type { ExpenseCategory } from '@/types';

const expenseSchema = z.object({
  description: z.string().min(3, { message: 'La descripción es requerida.' }),
  amount: z.coerce.number().positive({ message: 'El monto debe ser positivo.' }),
  category: z.enum(['Proveedores', 'Servicios', 'Sueldos', 'Marketing', 'Mantenimiento', 'Impuestos', 'Otros'], { required_error: 'Debe seleccionar una categoría.' }),
});

export default function ExpensesPage() {
  const { isMounted, currentUser, expenses, addExpense } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
    try {
      await addExpense(values);
      toast({
        title: 'Gasto Registrado',
        description: `Se ha añadido "${values.description}" por un monto de $${values.amount.toFixed(2)}.`,
      });
      form.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al registrar',
        description: 'No se pudo guardar el gasto. Intente nuevamente.',
      });
    }
  };

  const summaryData = useMemo(() => {
    if (!isMounted) return { totalToday: 0, totalMonth: 0 };
    
    const today = new Date();
    const todaysExpenses = expenses.filter(e => isSameDay(new Date(e.createdAt), today));
    const monthsExpenses = expenses.filter(e => isSameMonth(new Date(e.createdAt), today));

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
          <div className="md:col-span-2">
            <Card>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardHeader>
                    <CardTitle>Registrar Nuevo Gasto</CardTitle>
                    <CardDescription>Añade un nuevo gasto al sistema.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl><Input placeholder="ej. Compra de vegetales" {...field} /></FormControl>
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
                          <FormControl><Input type="number" placeholder="ej. 25.50" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione una categoría" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Proveedores">Proveedores</SelectItem>
                                    <SelectItem value="Servicios">Servicios (Agua, Luz)</SelectItem>
                                    <SelectItem value="Sueldos">Sueldos</SelectItem>
                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                                    <SelectItem value="Impuestos">Impuestos</SelectItem>
                                    <SelectItem value="Otros">Otros</SelectItem>
                                </SelectContent>
                            </Select>
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
                    <ScrollArea className="h-[50vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {expenses.length > 0 ? (
                                    expenses
                                        .sort((a,b) => b.createdAt - a.createdAt)
                                        .map(expense => (
                                            <TableRow key={expense.id}>
                                                <TableCell className="hidden sm:table-cell">
                                                    {format(new Date(expense.createdAt), "dd MMM yyyy", { locale: es })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{expense.description}</div>
                                                    <div className="text-xs text-muted-foreground sm:hidden">
                                                        {format(new Date(expense.createdAt), "dd/MM/yy", { locale: es })}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{expense.category}</TableCell>
                                                <TableCell className="text-right font-medium">${expense.amount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No hay gastos registrados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
