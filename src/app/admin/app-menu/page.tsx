"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, RefreshCw, Smartphone } from 'lucide-react';
import { useAppMenu } from '@/hooks/use-app-menu';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MenuTabs } from '@/components/menu/menu-tabs';
import { MenuItemCard } from '@/components/menu/menu-item-card';
import type { AppMenuItem, AppMenuVariant } from '@/types/app-menu';

export default function AppMenuPage() {
    const router = useRouter();
    const { toast } = useToast();
    const {
        categories,
        items,
        loading,
        lastUpdated,
        addCategory,
        addItem,
        updateItem,
        deleteItem,
        reorderItem,
        syncFromPOSMenu
    } = useAppMenu();

    const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const [isItemDialogOpen, setItemDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AppMenuItem | null>(null);

    // Item form states
    const [itemName, setItemName] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [itemCategory, setItemCategory] = useState('');
    const [itemType, setItemType] = useState<'plato' | 'item'>('item');
    const [itemDescription, setItemDescription] = useState('');

    // Variants
    const [variants, setVariants] = useState<AppMenuVariant[]>([]);
    const [newVariantName, setNewVariantName] = useState('');
    const [newVariantPrice, setNewVariantPrice] = useState('');
    const [newVariantContext, setNewVariantContext] = useState<'salon' | 'llevar'>('llevar');
    const [variantToDeleteIndex, setVariantToDeleteIndex] = useState<number | null>(null);

    const [itemToDelete, setItemToDelete] = useState<AppMenuItem | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showSyncConfirm, setShowSyncConfirm] = useState(false);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        await addCategory(newCategoryName);
        setCategoryDialogOpen(false);
        setNewCategoryName('');
        toast({ title: "Categoría creada" });
    };

    const handleOpenItemDialog = (item?: AppMenuItem) => {
        if (item) {
            setEditingItem(item);
            setItemName(item.name);
            setItemPrice(item.price.toString());
            setItemCategory(item.categoryId);
            setItemType(item.type || 'item');
            setItemDescription(item.description || '');
            setVariants(item.variants || []);
        } else {
            setEditingItem(null);
            setItemName('');
            setItemPrice('');
            setItemCategory(categories[0]?.id || '');
            setItemType('item');
            setItemDescription('');
            setVariants([]);
        }
        setNewVariantName('');
        setNewVariantPrice('');
        setNewVariantContext('llevar');
        setItemDialogOpen(true);
    };

    const addVariant = () => {
        if (!newVariantName || !newVariantPrice) return;
        const price = parseFloat(newVariantPrice);
        if (isNaN(price) || price < 0) return;

        const newVariant: AppMenuVariant = {
            id: Date.now(),
            nombre: newVariantName,
            precio: price,
            contexto: newVariantContext
        };

        setVariants([...variants, newVariant]);
        setNewVariantName('');
        setNewVariantPrice('');
    };

    const initiateRemoveVariant = (index: number) => {
        setVariantToDeleteIndex(index);
    };

    const confirmRemoveVariant = () => {
        if (variantToDeleteIndex !== null) {
            setVariants(variants.filter((_, i) => i !== variantToDeleteIndex));
            setVariantToDeleteIndex(null);
        }
    };

    const handleSaveItem = async () => {
        if (!itemName || !itemCategory) {
            toast({ variant: "destructive", title: "Faltan datos", description: "Nombre y categoría son obligatorios." });
            return;
        }

        const price = parseFloat(itemPrice) || 0;
        if (price < 0) {
            toast({ variant: "destructive", title: "Precio inválido", description: "El precio no puede ser negativo." });
            return;
        }

        const category = categories.find(c => c.id === itemCategory);

        const itemData = {
            name: itemName,
            categoryId: itemCategory,
            categoryName: category?.name || '',
            price: itemType === 'item' ? price : 0,
            type: itemType as 'plato' | 'item',
            isAvailable: true,
            description: itemDescription,
            variants: itemType === 'plato' ? variants : []
        };

        if (editingItem) {
            await updateItem(editingItem.id, itemData);
            toast({ title: "Ítem actualizado" });
        } else {
            await addItem(itemData);
            toast({ title: "Ítem creado" });
        }
        setItemDialogOpen(false);
    };

    const handleDeleteClick = (item: AppMenuItem) => {
        setItemToDelete(item);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            await deleteItem(itemToDelete.id);
            toast({ title: "Ítem eliminado" });
            setItemToDelete(null);
        }
    };

    const handleSyncFromPOS = async () => {
        setIsSyncing(true);
        try {
            const result = await syncFromPOSMenu();
            toast({
                title: "Sincronización completada",
                description: `Se importaron ${result?.categoriesCount} categorías y ${result?.itemsCount} items del menú POS.`
            });
        } catch {
            toast({
                variant: "destructive",
                title: "Error de sincronización",
                description: "No se pudo sincronizar el menú desde el POS."
            });
        } finally {
            setIsSyncing(false);
            setShowSyncConfirm(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center">Cargando menú de la App...</div>;

    // Convert AppMenuCategory to Category format for MenuTabs
    const categoriesForTabs = categories.map(c => ({
        id: c.id,
        name: c.name,
        order: c.order
    }));

    // Convert AppMenuItem to FirestoreItem format for MenuItemCard
    const convertToFirestoreItem = (item: AppMenuItem) => ({
        id: item.id,
        name: item.name,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        price: item.price,
        variants: item.variants,
        isAvailable: item.isAvailable,
        type: item.type,
        order: item.order
    });

    return (
        <div className="flex flex-col min-h-screen p-6 gap-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push('/admin/dashboard')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Smartphone className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl sm:text-3xl font-bold">Menú de la App</h1>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => setShowSyncConfirm(true)} disabled={isSyncing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sincronizar desde POS
                    </Button>
                    <Dialog open={isCategoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Nueva Categoría</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nueva Categoría</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Label>Nombre</Label>
                                <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Ej. Postres" />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddCategory}>Crear</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button onClick={() => handleOpenItemDialog()}><Plus className="mr-2 h-4 w-4" /> Nuevo Ítem</Button>
                </div>
            </div>

            {lastUpdated && (
                <p className="text-sm text-muted-foreground">
                    Última actualización: {new Date(lastUpdated).toLocaleString('es-CO')}
                </p>
            )}

            {categories.length === 0 ? (
                <Card className="flex-1">
                    <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
                        <Smartphone className="h-16 w-16 text-muted-foreground" />
                        <p className="text-lg text-muted-foreground text-center">
                            El menú de la App está vacío.
                        </p>
                        <p className="text-sm text-muted-foreground text-center">
                            Puedes sincronizar desde el menú del POS o crear categorías e items manualmente.
                        </p>
                        <Button onClick={() => setShowSyncConfirm(true)} disabled={isSyncing}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar desde POS
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="flex-1">
                    <CardContent className="pt-6">
                        <MenuTabs categories={categoriesForTabs}>
                            {(categoryId) => (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {items
                                        .filter(item => item.categoryId === categoryId)
                                        .sort((a, b) => a.order - b.order)
                                        .map(item => (
                                            <MenuItemCard
                                                key={item.id}
                                                item={convertToFirestoreItem(item)}
                                                mode="edit"
                                                onEdit={() => handleOpenItemDialog(item)}
                                                onDelete={() => handleDeleteClick(item)}
                                                onMoveUp={(id) => reorderItem(id, 'up')}
                                                onMoveDown={(id) => reorderItem(id, 'down')}
                                            />
                                        ))}
                                </div>
                            )}
                        </MenuTabs>
                    </CardContent>
                </Card>
            )}

            {/* Edit/Create Item Dialog */}
            <Dialog open={isItemDialogOpen} onOpenChange={setItemDialogOpen}>
                <DialogContent className="sm:max-w-[500px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>{editingItem ? 'Editar Ítem' : 'Nuevo Ítem'}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 px-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-left">Nombre</Label>
                                <Input className="col-span-3" value={itemName} onChange={e => setItemName(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-left">Categoría</Label>
                                <Select value={itemCategory} onValueChange={setItemCategory}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecciona..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-left">Tipo</Label>
                                <Select value={itemType} onValueChange={(v) => setItemType(v as 'plato' | 'item')}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="item">Ítem Simple (Precio fijo)</SelectItem>
                                        <SelectItem value="plato">Plato (Variantes)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {itemType === 'item' && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-left">Precio</Label>
                                    <Input className="col-span-3" type="number" min="0" value={itemPrice} onChange={e => setItemPrice(e.target.value)} />
                                </div>
                            )}
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-left mt-2">Descripción</Label>
                                <Input className="col-span-3" value={itemDescription} onChange={e => setItemDescription(e.target.value)} placeholder="Descripción para la app (opcional)" />
                            </div>

                            {/* Variants Section */}
                            {itemType === 'plato' && (
                                <div className="grid grid-cols-4 items-start gap-4 border-t pt-4 mt-2">
                                    <Label className="text-left mt-2">Variantes</Label>
                                    <div className="col-span-3 space-y-3">
                                        <div className="space-y-2">
                                            {variants.map((v, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <Input disabled value={v.nombre} className="flex-1 h-8 text-sm" />
                                                    <div className="w-20 text-sm font-bold text-right">${v.precio.toFixed(2)}</div>
                                                    <div className="w-20 flex justify-center">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${v.contexto === 'llevar' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {v.contexto || 'llevar'}
                                                        </span>
                                                    </div>
                                                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => initiateRemoveVariant(idx)}>
                                                        <div className="h-4 w-4">x</div>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-2 items-end border-t pt-2">
                                            <div className="flex-[2]">
                                                <Label className="text-xs mb-1 block">Nombre</Label>
                                                <Input
                                                    value={newVariantName}
                                                    onChange={e => setNewVariantName(e.target.value)}
                                                    placeholder="Ej. Grande"
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <Label className="text-xs mb-1 block">Contexto</Label>
                                                <Select value={newVariantContext} onValueChange={(v: 'salon' | 'llevar') => setNewVariantContext(v)}>
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="llevar">Llevar</SelectItem>
                                                        <SelectItem value="salon">Mesa</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="w-20">
                                                <Label className="text-xs mb-1 block">Precio</Label>
                                                <Input
                                                    type="number"
                                                    value={newVariantPrice}
                                                    onChange={e => setNewVariantPrice(e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <Button size="sm" onClick={addVariant} type="button">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-2">
                        <Button onClick={handleSaveItem}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Variant Deletion Confirmation Dialog */}
            <AlertDialog open={variantToDeleteIndex !== null} onOpenChange={(open) => !open && setVariantToDeleteIndex(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Variante</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar esta variante?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemoveVariant} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Item Deletion Confirmation Dialog */}
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente el ítem &quot;{itemToDelete?.name}&quot;.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Sync Confirmation Dialog */}
            <AlertDialog open={showSyncConfirm} onOpenChange={setShowSyncConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sincronizar desde POS</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esto reemplazará todo el menú de la App con el contenido actual del menú del POS.
                            {categories.length > 0 && (
                                <span className="block mt-2 text-destructive font-medium">
                                    ⚠️ El menú actual de la App será sobrescrito.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSyncFromPOS} disabled={isSyncing}>
                            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
