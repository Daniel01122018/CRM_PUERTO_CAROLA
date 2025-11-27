"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/hooks/use-app-store';
import { useInventoryCategories } from '@/hooks/use-inventory-categories';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import AppSidebar from '@/components/app-sidebar';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FolderPlus, Edit, Trash2, Package } from 'lucide-react';
import type { InventoryCategory } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const categorySchema = z.object({
    name: z.string().min(1, { message: 'El nombre es requerido.' }).max(50),
    description: z.string().optional(),
    color: z.string().optional(),
});

const PRESET_COLORS = [
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Amarillo', value: '#f59e0b' },
    { name: 'Rojo', value: '#ef4444' },
    { name: 'Morado', value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Naranja', value: '#f97316' },
    { name: 'Gris', value: '#6b7280' },
];

export default function CategoriesPage() {
    const { isMounted, currentUser } = useAppStore();
    const { categories, loading, addCategory, updateCategory, deleteCategory } = useInventoryCategories();
    const router = useRouter();
    const { toast } = useToast();

    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | null>(null);

    const form = useForm<z.infer<typeof categorySchema>>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: '',
            description: '',
            color: '#3b82f6',
        },
    });

    const editForm = useForm<z.infer<typeof categorySchema>>({
        resolver: zodResolver(categorySchema),
    });

    const onSubmit = async (values: z.infer<typeof categorySchema>) => {
        if (!currentUser) return;

        try {
            await addCategory({
                name: values.name,
                description: values.description,
                color: values.color || '#3b82f6',
                createdBy: currentUser.username,
            });

            toast({
                title: 'Categoría Creada',
                description: `La categoría "${values.name}" ha sido añadida exitosamente.`,
            });

            form.reset();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error al crear',
                description: error.message || 'No se pudo crear la categoría.',
            });
        }
    };

    const onEditSubmit = async (values: z.infer<typeof categorySchema>) => {
        if (!selectedCategory) return;

        try {
            await updateCategory(selectedCategory.id, values);

            toast({
                title: 'Categoría Actualizada',
                description: 'Los cambios se han guardado exitosamente.',
            });

            setEditModalOpen(false);
            setSelectedCategory(null);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error al actualizar',
                description: error.message || 'No se pudo actualizar la categoría.',
            });
        }
    };

    const handleDelete = async () => {
        if (!selectedCategory) return;

        try {
            await deleteCategory(selectedCategory.id);

            toast({
                title: 'Categoría Eliminada',
                description: 'La categoría ha sido eliminada exitosamente.',
            });

            setDeleteAlertOpen(false);
            setSelectedCategory(null);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error al eliminar',
                description: error.message || 'No se pudo eliminar la categoría. Asegúrate de que no tenga items asociados.',
            });
        }
    };

    if (!isMounted || !currentUser) {
        return (
            <div className="flex h-screen flex-col items-center justify-center text-center">
                <FolderPlus className="h-16 w-16 text-muted-foreground mb-4" />
                <h1 className="text-2xl font-semibold mb-4">Cargando...</h1>
            </div>
        );
    }

    if (currentUser.role !== 'admin') {
        return (
            <div className="flex h-screen flex-col items-center justify-center text-center">
                <FolderPlus className="h-16 w-16 text-muted-foreground mb-4" />
                <h1 className="text-2xl font-semibold mb-4">Acceso Denegado</h1>
                <Link href="/dashboard">
                    <Button>Volver al Salón</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">

                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <AppSidebar />
                        <h1 className="text-2xl font-semibold flex items-center gap-2">
                            <FolderPlus className="h-6 w-6" />
                            Gestión de Categorías
                        </h1>
                    </div>

                    <div className="flex gap-2">
                        <Link href="/inventory">
                            <Button variant="outline" className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Inventario
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">

                    {/* Formulario de Nueva Categoría */}
                    <div className="lg:col-span-2">
                        <Card>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)}>
                                    <CardHeader>
                                        <CardTitle>Nueva Categoría</CardTitle>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nombre *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ej. Pescado" {...field} autoFocus />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Descripción (opcional)</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Breve descripción de la categoría..."
                                                            className="resize-none"
                                                            rows={3}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="color"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Color (opcional)</FormLabel>
                                                    <FormDescription>
                                                        Selecciona un color para identificar visualmente la categoría
                                                    </FormDescription>
                                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                                        {PRESET_COLORS.map((color) => (
                                                            <button
                                                                key={color.value}
                                                                type="button"
                                                                onClick={() => field.onChange(color.value)}
                                                                className={`h-10 rounded-md border-2 transition-all ${field.value === color.value
                                                                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                                                                        : 'border-gray-300 hover:border-gray-400'
                                                                    }`}
                                                                style={{ backgroundColor: color.value }}
                                                                title={color.name}
                                                            />
                                                        ))}
                                                    </div>
                                                    <FormControl>
                                                        <Input type="color" {...field} className="h-10 mt-2" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>

                                    <CardFooter>
                                        <Button type="submit" className="w-full">
                                            <FolderPlus className="mr-2 h-4 w-4" />
                                            Crear Categoría
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Form>
                        </Card>
                    </div>

                    {/* Lista de Categorías */}
                    <div className="lg:col-span-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Categorías Existentes ({categories?.length || 0})</CardTitle>
                            </CardHeader>

                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Cargando categorías...
                                    </div>
                                ) : categories && categories.length > 0 ? (
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead>Nombre</TableHead>
                                                    <TableHead>Descripción</TableHead>
                                                    <TableHead className="text-center">Color</TableHead>
                                                    <TableHead className="text-right">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>

                                            <TableBody>
                                                {categories.map((category) => (
                                                    <TableRow key={category.id}>
                                                        <TableCell className="font-medium">
                                                            {category.name}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {category.description || '-'}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex justify-center">
                                                                <div
                                                                    className="w-8 h-8 rounded-md border"
                                                                    style={{ backgroundColor: category.color || '#3b82f6' }}
                                                                    title={category.color}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setSelectedCategory(category);
                                                                        editForm.reset({
                                                                            name: category.name,
                                                                            description: category.description || '',
                                                                            color: category.color || '#3b82f6',
                                                                        });
                                                                        setEditModalOpen(true);
                                                                    }}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive"
                                                                    onClick={() => {
                                                                        setSelectedCategory(category);
                                                                        setDeleteAlertOpen(true);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FolderPlus className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-muted-foreground mb-2">
                                            No hay categorías creadas aún
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Crea tu primera categoría usando el formulario de la izquierda
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Edit Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
                                <DialogHeader>
                                    <DialogTitle>Editar Categoría</DialogTitle>
                                    <DialogDescription>
                                        Modifica los detalles de la categoría.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    <FormField
                                        control={editForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={editForm.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Descripción</FormLabel>
                                                <FormControl>
                                                    <Textarea rows={3} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={editForm.control}
                                        name="color"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Color</FormLabel>
                                                <div className="grid grid-cols-4 gap-2 mb-2">
                                                    {PRESET_COLORS.map((color) => (
                                                        <button
                                                            key={color.value}
                                                            type="button"
                                                            onClick={() => field.onChange(color.value)}
                                                            className={`h-10 rounded-md border-2 transition-all ${field.value === color.value
                                                                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                                                                    : 'border-gray-300'
                                                                }`}
                                                            style={{ backgroundColor: color.value }}
                                                        />
                                                    ))}
                                                </div>
                                                <FormControl>
                                                    <Input type="color" {...field} className="h-10" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button type="submit">Guardar Cambios</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>

                {/* Delete Alert */}
                <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar esta categoría?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. La categoría "{selectedCategory?.name}" será eliminada permanentemente.
                                <br /><br />
                                <strong>Nota:</strong> No puedes eliminar una categoría que tenga items asociados.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                                Eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </main>
        </div>
    );
}
