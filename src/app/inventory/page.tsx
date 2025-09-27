
"use client";

import { useState, useEffect, useMemo } from 'react';
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
import AppSidebar from '@/components/app-sidebar';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ClipboardList, PlusCircle, Plus, Minus } from 'lucide-react';
import type { InventoryItem } from '@/types';
import { cn } from '@/lib/utils';


const inventoryItemSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  stock: z.coerce.number().min(0, { message: 'El stock no puede ser negativo.' }),
  unit: z.string().min(1, { message: 'La unidad es requerida (ej. unidades, libras).' }),
  lowStockThreshold: z.coerce.number().min(0, { message: 'El umbral no puede ser negativo.' }),
});


export default function InventoryPage() {
  const { isMounted, currentUser, inventoryItems, addInventoryItem, updateInventoryItem } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();
  
  const sortedInventory = useMemo(() => {
    if (!inventoryItems) return [];
    return [...inventoryItems].sort((a, b) => a.name.localeCompare(b.name));
  }, [inventoryItems]);

  const form = useForm<z.infer<typeof inventoryItemSchema>>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: '',
      stock: 0,
      unit: '',
      lowStockThreshold: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof inventoryItemSchema>) => {
    try {
      await addInventoryItem(values);
      toast({
        title: 'Artículo Añadido',
        description: `Se ha añadido "${values.name}" al inventario.`,
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al añadir artículo',
        description: error.message || 'No se pudo guardar el artículo. Intente nuevamente.',
      });
    }
  };

  const handleStockChange = async (item: InventoryItem, change: number) => {
    const newStock = item.stock + change;
    if (newStock < 0) {
        toast({ variant: 'destructive', title: 'Stock no puede ser negativo.' });
        return;
    }
    try {
        await updateInventoryItem(item.id, { stock: newStock });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error al actualizar stock',
            description: error.message || 'No se pudo guardar el cambio.',
        });
    }
  }

  useEffect(() => {
    if (isMounted && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [currentUser, isMounted, router]);

  if (!isMounted || !currentUser || !inventoryItems) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-4">Cargando Inventario...</h1>
      </div>
    );
  }
  
  if (currentUser.role !== 'admin') {
     return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-4">Acceso solo para administradores.</h1>
        <Link href="/dashboard">
          <Button>Volver al Salón</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
            <div className='flex items-center gap-4'>
                <AppSidebar />
                <h1 className="text-2xl font-semibold flex items-center gap-2">
                    <ClipboardList className="h-6 w-6" />
                    Gestión de Inventario
                </h1>
            </div>
            <Link href="/dashboard">
                <Button variant="outline" className="flex items-center gap-2">
                    <ArrowLeft className="h-5 w-5" />
                    Volver al Salón
                </Button>
            </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardHeader>
                    <CardTitle>Añadir Producto al Inventario</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Producto</FormLabel>
                          <FormControl><Input placeholder="ej. Chifles Bolsa, Cola Personal Unidad" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Inicial</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad de Medida</FormLabel>
                          <FormControl><Input placeholder="ej. unidades, libras, litros" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lowStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Umbral de Stock Bajo</FormLabel>
                          <FormControl><Input type="number" placeholder="ej. 5" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir Producto
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </div>

          <div className="md:col-span-3">
             <Card>
                <CardHeader>
                    <CardTitle>Inventario Actual</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto (ID)</TableHead>
                                    <TableHead className="text-center">Stock</TableHead>
                                    <TableHead>Unidad</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {sortedInventory.length > 0 ? (
                                    sortedInventory.map(item => (
                                        <TableRow key={item.id} className={cn(item.stock <= item.lowStockThreshold && item.lowStockThreshold > 0 ? 'bg-red-50 hover:bg-red-100' : '')}>
                                            <TableCell className="font-medium">
                                              {item.name}
                                              <p className="text-xs text-muted-foreground">{item.id}</p>
                                              {item.stock <= item.lowStockThreshold && item.lowStockThreshold > 0 && (
                                                <p className="text-xs text-red-600">Stock bajo</p>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-lg">{item.stock}</TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleStockChange(item, -1)}><Minus className="h-4 w-4" /></Button>
                                                <Button variant="outline" size="icon" className="h-8 w-8 ml-2" onClick={() => handleStockChange(item, 1)}><Plus className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No hay productos en el inventario.
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
