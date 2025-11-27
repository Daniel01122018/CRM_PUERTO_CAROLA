"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/hooks/use-app-store';
import { useInventory } from '@/hooks/use-inventory';
import { useInventoryCategories } from '@/hooks/use-inventory-categories';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppSidebar from '@/components/app-sidebar';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Package, AlertTriangle, TrendingDown, DollarSign, Plus, Search, Edit, Trash2, Eye, FolderPlus } from 'lucide-react';
import type { InventoryItem, InventoryCategory, InventoryUnit } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const UNITS: InventoryUnit[] = ['kg', 'lb', 'unidades', 'litros', 'bolsas', 'cajas'];

const itemSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido.' }),
  categoryId: z.string().min(1, { message: 'Debe seleccionar una categoría.' }),
  currentStock: z.coerce.number().min(0, { message: 'El stock debe ser positivo.' }),
  unit: z.enum(['kg', 'lb', 'unidades', 'litros', 'bolsas', 'cajas']),
  minStock: z.coerce.number().min(0, { message: 'El stock mínimo debe ser positivo.' }),
  maxStock: z.coerce.number().optional(),
  costPerUnit: z.coerce.number().min(0, { message: 'El costo debe ser positivo.' }),
  supplier: z.string().optional(),
  expirationDate: z.string().optional(),
  notes: z.string().optional(),
});

type StockStatus = 'ok' | 'warning' | 'critical';

export default function InventoryPage() {
  const { isMounted, currentUser } = useAppStore();
  const { items, loading, addInventoryItem, updateInventoryItem, deleteInventoryItem, getLowStockItems, getTotalInventoryValue } = useInventory();
  const { categories } = useInventoryCategories();
  const router = useRouter();
  const { toast } = useToast();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<StockStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      currentStock: 0,
      unit: 'kg',
      minStock: 0,
      costPerUnit: 0,
      supplier: '',
      expirationDate: '',
      notes: '',
    },
  });

  const editForm = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
  });

  const getStockStatus = (item: InventoryItem): StockStatus => {
    if (item.currentStock <= item.minStock) return 'critical';
    if (item.currentStock <= item.minStock * 1.2) return 'warning';
    return 'ok';
  };

  const getStatusBadge = (status: StockStatus) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Bajo</Badge>;
      case 'ok':
        return <Badge variant="default" className="bg-green-600">OK</Badge>;
    }
  };

  const filteredItems = useMemo(() => {
    if (!items) return [];

    return items.filter(item => {
      const categoryMatch = filterCategory === 'all' || item.categoryId === filterCategory;
      const statusMatch = filterStatus === 'all' || getStockStatus(item) === filterStatus;
      const searchMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      return categoryMatch && statusMatch && searchMatch;
    });
  }, [items, filterCategory, filterStatus, searchQuery]);

  const lowStockItems = useMemo(() => {
    return getLowStockItems();
  }, [getLowStockItems]);

  const totalValue = useMemo(() => {
    return getTotalInventoryValue();
  }, [getTotalInventoryValue]);

  // Analytics: Items próximos a caducar (7 días)
  const expiringItems = useMemo(() => {
    if (!items) return [];
    const sevenDaysFromNow = Date.now() + (7 * 24 * 60 * 60 * 1000);
    return items.filter(item =>
      item.expirationDate &&
      item.expirationDate <= sevenDaysFromNow &&
      item.expirationDate > Date.now()
    );
  }, [items]);

  // Analytics: Valor por categoría
  const valueByCategory = useMemo(() => {
    if (!items || !categories) return [];
    const categoryValues = categories.map(cat => {
      const categoryItems = items.filter(item => item.categoryId === cat.id);
      const value = categoryItems.reduce((sum, item) =>
        sum + (item.currentStock * item.costPerUnit), 0
      );
      return { category: cat, value, itemCount: categoryItems.length };
    }).filter(cv => cv.value > 0);

    return categoryValues.sort((a, b) => b.value - a.value);
  }, [items, categories]);

  // Analytics: Porcentaje de items críticos
  const criticalPercentage = useMemo(() => {
    if (!items || items.length === 0) return 0;
    const criticalCount = items.filter(item => getStockStatus(item) === 'critical').length;
    return Math.round((criticalCount / items.length) * 100);
  }, [items]);

  const onSubmit = async (values: z.infer<typeof itemSchema>) => {
    if (!currentUser || !categories) return;

    try {
      const category = categories.find(c => c.id === values.categoryId);
      if (!category) throw new Error('Categoría no encontrada');

      // Preparar datos con conversión de fecha
      const itemData: any = {
        name: values.name,
        categoryId: values.categoryId,
        categoryName: category.name,
        currentStock: values.currentStock,
        unit: values.unit,
        minStock: values.minStock,
        costPerUnit: values.costPerUnit,
        createdBy: currentUser.username,
      };

      // Agregar campos opcionales solo si tienen valor
      if (values.maxStock !== undefined && values.maxStock !== null && values.maxStock !== 0) {
        itemData.maxStock = values.maxStock;
      }
      if (values.supplier) {
        itemData.supplier = values.supplier;
      }
      if (values.notes) {
        itemData.notes = values.notes;
      }

      // Convertir fecha a timestamp si existe
      if (values.expirationDate) {
        itemData.expirationDate = new Date(values.expirationDate).getTime();
      }

      await addInventoryItem(itemData);

      toast({
        title: 'Item Creado',
        description: `Se ha añadido "${values.name}" al inventario.`,
      });

      form.reset();
      setCreateModalOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al crear',
        description: error.message || 'No se pudo crear el item.',
      });
    }
  };

  const onEditSubmit = async (values: z.infer<typeof itemSchema>) => {
    if (!selectedItem || !categories) return;

    try {
      const category = categories.find(c => c.id === values.categoryId);

      const updateData: any = {
        name: values.name,
        categoryId: values.categoryId,
        categoryName: category?.name || selectedItem.categoryName,
        currentStock: values.currentStock,
        unit: values.unit,
        minStock: values.minStock,
        maxStock: values.maxStock,
        costPerUnit: values.costPerUnit,
        supplier: values.supplier,
        notes: values.notes,
      };

      // Convertir fecha a timestamp si existe
      if (values.expirationDate) {
        updateData.expirationDate = new Date(values.expirationDate).getTime();
      }

      await updateInventoryItem(selectedItem.id, updateData);

      toast({
        title: 'Item Actualizado',
        description: 'Los cambios se han guardado exitosamente.',
      });

      setEditModalOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: error.message || 'No se pudo actualizar el item.',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      await deleteInventoryItem(selectedItem.id);

      toast({
        title: 'Item Eliminado',
        description: 'El item ha sido eliminado del inventario.',
      });

      setDeleteAlertOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: error.message || 'No se pudo eliminar el item.',
      });
    }
  };

  if (!isMounted || !currentUser) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-4">Cargando...</h1>
      </div>
    );
  }

  if (currentUser.role !== 'admin' && currentUser.role !== 'employee') {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
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
              <Package className="h-6 w-6" />
              Gestión de Inventario
            </h1>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Item
            </Button>
            <Link href="/inventory/categories">
              <Button variant="outline" className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                Categorías
              </Button>
            </Link>
            <Link href="/admin/dashboard">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-5 w-5" />
                Volver
              </Button>
            </Link>
          </div>
        </div>

        {/* Sistema de Pestañas */}
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Pestaña de Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{items?.length || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    En inventario
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Items Bajo Stock</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requieren atención
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Inventario actual
                  </p>
                </CardContent>
              </Card>

              <Card className={expiringItems.length > 0 ? "border-orange-500" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Próximos a Caducar</CardTitle>
                  <TrendingDown className={`h-4 w-4 ${expiringItems.length > 0 ? 'text-orange-600' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${expiringItems.length > 0 ? 'text-orange-600' : ''}`}>
                    {expiringItems.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Próximos 7 días
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Items Críticos</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${criticalPercentage > 20 ? 'text-red-600' : ''}`}>
                    {criticalPercentage}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Del inventario total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categoría Principal</CardTitle>
                  <FolderPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {valueByCategory[0] ? `$${valueByCategory[0].value.toFixed(0)}` : '$0'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {valueByCategory[0]?.category.name || 'Sin datos'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Alertas de Stock Bajo (para Analytics) */}
            {lowStockItems.length > 0 && (
              <Card className="border-yellow-500 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-5 w-5" />
                    Alertas de Stock Bajo ({lowStockItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {lowStockItems.slice(0, 5).map(item => (
                      <Badge key={item.id} variant="outline" className="border-yellow-600">
                        {item.name}: {item.currentStock} {item.unit}
                      </Badge>
                    ))}
                    {lowStockItems.length > 5 && (
                      <Badge variant="outline">+{lowStockItems.length - 5} más</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Insights y Analytics */}
            {(expiringItems.length > 0 || valueByCategory.length > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Items Próximos a Caducar */}
                {expiringItems.length > 0 && (
                  <Card className="border-orange-500 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-800">
                        <TrendingDown className="h-5 w-5" />
                        Items Próximos a Caducar ({expiringItems.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {expiringItems.slice(0, 5).map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-orange-700">
                              {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString('es-ES') : ''}
                            </span>
                          </div>
                        ))}
                        {expiringItems.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center pt-2">
                            +{expiringItems.length - 5} items más
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Distribución de Valor por Categoría */}
                {valueByCategory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Valor por Categoría
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {valueByCategory.slice(0, 5).map(cv => (
                          <div key={cv.category.id} className="space-y-1">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium">{cv.category.name}</span>
                              <span className="font-bold">${cv.value.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${(cv.value / valueByCategory[0].value) * 100}%`,
                                    backgroundColor: cv.category.color
                                  }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-16 text-right">
                                {cv.itemCount} items
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Pestaña de Inventario */}
          <TabsContent value="inventory" className="space-y-4">
            {/* Alertas de Stock Bajo (Solo críticas) */}
            {lowStockItems.length > 0 && (
              <Card className="border-yellow-500 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-5 w-5" />
                    Alertas de Stock Bajo ({lowStockItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {lowStockItems.slice(0, 5).map(item => (
                      <Badge key={item.id} variant="outline" className="border-yellow-600">
                        {item.name}: {item.currentStock} {item.unit}
                      </Badge>
                    ))}
                    {lowStockItems.length > 5 && (
                      <Badge variant="outline">+{lowStockItems.length - 5} más</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}


            <div className="w-full">

              {/* Lista de Inventario */}
              <div className="w-full">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventario Actual</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Filtros y Búsqueda */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nombre..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8"
                        />
                      </div>

                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las categorías</SelectItem>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StockStatus | 'all')}>
                        <SelectTrigger className="w-full sm:w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="ok">OK</SelectItem>
                          <SelectItem value="warning">Bajo</SelectItem>
                          <SelectItem value="critical">Crítico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tabla */}
                    <div className="border rounded-lg overflow-x-auto">
                      <ScrollArea className="h-[50vh]">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Categoría</TableHead>
                              <TableHead className="text-right">Stock</TableHead>
                              <TableHead className="text-center">Estado</TableHead>
                              <TableHead className="text-right">Costo/U</TableHead>
                              <TableHead className="text-center">Caducidad</TableHead>
                              {currentUser.role === 'admin' && (
                                <TableHead className="text-right">Acciones</TableHead>
                              )}
                            </TableRow>
                          </TableHeader>

                          <TableBody>
                            {loading ? (
                              <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                  Cargando...
                                </TableCell>
                              </TableRow>
                            ) : filteredItems.length > 0 ? (
                              filteredItems.map(item => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.name}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {item.categoryName}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {item.currentStock} {item.unit}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {getStatusBadge(getStockStatus(item))}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    ${item.costPerUnit.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-center text-sm">
                                    {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString('es-ES') : '-'}
                                  </TableCell>
                                  {currentUser.role === 'admin' && (
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setSelectedItem(item);
                                            editForm.reset({
                                              name: item.name,
                                              categoryId: item.categoryId,
                                              currentStock: item.currentStock,
                                              unit: item.unit,
                                              minStock: item.minStock,
                                              maxStock: item.maxStock,
                                              costPerUnit: item.costPerUnit,
                                              supplier: item.supplier || '',
                                              expirationDate: item.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : '',
                                              notes: item.notes || '',
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
                                            setSelectedItem(item);
                                            setDeleteAlertOpen(true);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                  No se encontraron items.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>

                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Mostrando {filteredItems.length} items</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>Añadir Nuevo Item</DialogTitle>
                  <DialogDescription>
                    Complete los datos del nuevo item de inventario.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="ej. Pescado Albacora" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currentStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Inicial</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {UNITS.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Mínimo</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="costPerUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo por Unidad ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proveedor (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="ej. Mercado Montebello" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expirationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Caducidad (opcional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Item
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>



        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
                <DialogHeader>
                  <DialogTitle>Editar Item</DialogTitle>
                  <DialogDescription>
                    Modifique los detalles del item. Los cambios se guardarán inmediatamente.
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
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="currentStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Actual</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {UNITS.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="minStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Mínimo</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="costPerUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo/U ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={editForm.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proveedor</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="expirationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Caducidad</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
              <AlertDialogTitle>¿Eliminar este item?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El item "{selectedItem?.name}" será eliminado permanentemente del inventario.
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
