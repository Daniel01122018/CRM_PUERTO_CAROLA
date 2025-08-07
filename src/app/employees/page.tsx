"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import AppHeader from '@/components/app-header';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Users, PlusCircle } from 'lucide-react';
import type { Employee } from '@/types';

const employeeSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  role: z.string().min(2, { message: 'El cargo es requerido.' }),
});

export default function EmployeesPage() {
  const { isMounted, currentUser, employees, addEmployee } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();

  const sortedEmployees = employees.sort((a, b) => b.createdAt - a.createdAt);

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      role: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof employeeSchema>) => {
    try {
      await addEmployee(values);
      toast({
        title: 'Empleado Añadido',
        description: `${values.name} ha sido registrado como ${values.role}.`,
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al añadir empleado',
        description: error.message || 'No se pudo guardar el empleado. Intente nuevamente.',
      });
    }
  };
  
  useEffect(() => {
    if (isMounted && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [currentUser, isMounted, router]);

  if (!isMounted || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
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
                <Users className="h-6 w-6" />
                Gestión de Empleados
            </h1>
            <Link href="/expenses">
                <Button variant="outline" className="flex items-center gap-2">
                    <ArrowLeft className="h-5 w-5" />
                    Volver a Gastos
                </Button>
            </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardHeader>
                    <CardTitle>Añadir Nuevo Empleado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl><Input placeholder="ej. Juan Pérez" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo</FormLabel>
                          <FormControl><Input placeholder="ej. Mesero, Cocinero" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir Empleado
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </div>

          <div className="md:col-span-3">
             <Card>
                <CardHeader>
                    <CardTitle>Lista de Empleados</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Cargo</TableHead>
                                    <TableHead>Fecha de Ingreso</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {sortedEmployees.length > 0 ? (
                                    sortedEmployees.map(employee => (
                                        <TableRow key={employee.id}>
                                            <TableCell className="font-medium">{employee.name}</TableCell>
                                            <TableCell>{employee.role}</TableCell>
                                            <TableCell>{format(new Date(employee.createdAt), "dd MMM yyyy", { locale: es })}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            No hay empleados registrados.
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
