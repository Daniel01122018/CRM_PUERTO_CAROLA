"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/hooks/use-app-store';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import AppSidebar from '@/components/app-sidebar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Users, PlusCircle } from 'lucide-react';
import type { Employee } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const ROLES = [
  "Administrador",
  "Mesero/a",
  "Ayudante",
  "Cocinero/a",
  "Trabajador Operativo",
  "Recursos Humanos"
] as const;

const employeeSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  role: z.enum(ROLES, { message: 'Debe seleccionar un cargo válido.' }),
});

export default function EmployeesPage() {
  const { isMounted, currentUser, employees, addEmployee } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();

  const sortedEmployees = useMemo(() => {
    if (!employees) return [];
    return [...employees].sort((a, b) => b.createdAt - a.createdAt);
  }, [employees]);

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      role: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof employeeSchema>) => {
    try {
      await addEmployee(values);
      toast({
        title: 'Empleado añadido',
        description: `${values.name} ha sido registrado como ${values.role}.`,
      });
      form.reset({ name: '', role: undefined });
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

  if (!isMounted || !currentUser || !employees) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-4">Cargando...</h1>
      </div>
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-4">
          Acceso solo para administradores.
        </h1>
        <Link href="/dashboard">
          <Button>Volver al Salón</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 overflow-hidden">
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 border-b pb-4">
          <div className="flex items-center gap-3">
            <AppSidebar />
            <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Gestión de Empleados
            </h1>
          </div>
          <Link href="/admin/dashboard" className="w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver al Dashboard</span>
              <span className="sm:hidden">Volver</span>
            </Button>
          </Link>
        </div>

        {/* Grid Principal */}
        <div className="grid gap-6 lg:grid-cols-5 w-full">
          
          {/* Formulario */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border border-border w-full h-fit">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                  <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/10 to-primary/5">
                    <CardTitle className="text-lg sm:text-xl font-semibold text-primary">
                      Añadir Nuevo Empleado
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ej. Juan Pérez" 
                              {...field} 
                              autoFocus 
                              className="w-full"
                            />
                          </FormControl>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccione un cargo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>

                  <CardFooter className="pt-4 border-t">
                    <Button type="submit" className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir Empleado
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </div>

          {/* Lista de Empleados */}
          <div className="lg:col-span-3 w-full">
            <Card className="w-full shadow-lg border border-border">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-secondary/10 to-secondary/5">
                <CardTitle className="text-lg sm:text-xl font-semibold text-secondary-foreground">
                  Lista de Empleados
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0 w-full">
                <ScrollArea className="h-[50vh] sm:h-[60vh] w-full">
                  <div className="p-3 sm:p-4 md:p-6 w-full overflow-x-hidden">
                    <Table className="w-full table-auto">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-2 sm:px-4">Nombre</TableHead>
                          <TableHead className="px-2 sm:px-4">Cargo</TableHead>
                          <TableHead className="px-2 sm:px-4">Fecha de Ingreso</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {sortedEmployees.length > 0 ? (
                          sortedEmployees.map(employee => (
                            <TableRow
                              key={employee.id}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="font-medium px-2 sm:px-4 break-words">
                                {employee.name}
                              </TableCell>
                              <TableCell className="px-2 sm:px-4 break-words">
                                {employee.role}
                              </TableCell>
                              <TableCell className="px-2 sm:px-4 whitespace-nowrap">
                                {format(new Date(employee.createdAt), "dd MMM yyyy", { locale: es })}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                              No hay empleados registrados.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
