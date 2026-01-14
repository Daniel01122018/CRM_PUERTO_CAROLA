"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, RefreshCw, Smartphone } from 'lucide-react';
import { useAppMenu } from '@/hooks/use-app-menu';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MenuTabs } from '@/components/menu/menu-tabs';
import { MenuItemCard } from '@/components/menu/menu-item-card';
import type { AppMenuItem, AppMenuVariant } from '@/types/app-menu';

export default function AppMenuContent() {
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

    const [itemName, setItemName] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [itemCategory, setItemCategory] = useState('');
    const [itemType, setItemType] = useState<'plato' | 'item'>('item');
    const [itemDescription, setItemDescription] = useState('');

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
                description: `Se importaron ${result?.categoriesCount} categorías y ${result?.itemsCount} items.`
            });
        } catch {
            toast({ variant: "destructive", title: "Error", description: "No se pudo sincronizar." });
        } finally {
            setIsSyncing(false);
            setShowSyncConfirm(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64">Cargando menú...</div>;

    const categoriesForTabs = categories.map(c => ({ id: c.id, name: c.name, order: c.order }));
    const convertToFirestoreItem = (item: AppMenuItem) => ({
        id: item.id, name: item.name, categoryId: item.categoryId, categoryName: item.categoryName,
        price: item.price, variants: item.variants, isAvailable: item.isAvailable, type: item.type, order: item.order
    });

    return (
        <div className="flex flex-col gap-4">
            {/* Actions */}
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
                        <DialogHeader><DialogTitle>Nueva Categoría</DialogTitle></DialogHeader>
                        <div className="py-4">
                            <Label>Nombre</Label>
                            <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Ej. Postres" />
                        </div>
                        <DialogFooter><Button onClick={handleAddCategory}>Crear</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button onClick={() => handleOpenItemDialog()}><Plus className="mr-2 h-4 w-4" /> Nuevo Ítem</Button>
            </div>

            {lastUpdated && (
                <p className="text-sm text-muted-foreground">
                    Última actualización: {new Date(lastUpdated).toLocaleString('es-CO')}
                </p>
            )}

            {categories.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
                        <Smartphone className="h-16 w-16 text-muted-foreground" />
                        <p className="text-lg text-muted-foreground text-center">El menú de la App está vacío.</p>
                        <Button onClick={() => setShowSyncConfirm(true)} disabled={isSyncing}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar desde POS
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <MenuTabs categories={categoriesForTabs}>
                            {(categoryId) => (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {items.filter(item => item.categoryId === categoryId).sort((a, b) => a.order - b.order).map(item => (
                                        <MenuItemCard
                                            key={item.id}
                                            item={convertToFirestoreItem(item)}
                                            mode="edit"
                                            onEdit={() => handleOpenItemDialog(item)}
                                            onDelete={() => setItemToDelete(item)}
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

            {/* Item Dialog */}
            <Dialog open={isItemDialogOpen} onOpenChange={setItemDialogOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingItem ? 'Editar Ítem' : 'Nuevo Ítem'}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label>Nombre</Label>
                            <Input className="col-span-3" value={itemName} onChange={e => setItemName(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label>Categoría</Label>
                            <Select value={itemCategory} onValueChange={setItemCategory}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label>Tipo</Label>
                            <Select value={itemType} onValueChange={(v) => setItemType(v as 'plato' | 'item')}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="item">Ítem Simple</SelectItem>
                                    <SelectItem value="plato">Plato (Variantes)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {itemType === 'item' && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label>Precio</Label>
                                <Input className="col-span-3" type="number" min="0" value={itemPrice} onChange={e => setItemPrice(e.target.value)} />
                            </div>
                        )}
                        {itemType === 'plato' && (
                            <div className="border-t pt-4">
                                <Label className="mb-2 block">Variantes</Label>
                                <div className="space-y-2">
                                    {variants.map((v, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                            <span className="flex-1">{v.nombre}</span>
                                            <span className="font-bold">${v.precio.toFixed(2)}</span>
                                            <Button size="sm" variant="destructive" onClick={() => setVariantToDeleteIndex(idx)}>x</Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <Input placeholder="Nombre" value={newVariantName} onChange={e => setNewVariantName(e.target.value)} className="flex-1" />
                                    <Input type="number" placeholder="Precio" value={newVariantPrice} onChange={e => setNewVariantPrice(e.target.value)} className="w-24" />
                                    <Button size="sm" onClick={addVariant}><Plus className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter><Button onClick={handleSaveItem}>Guardar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialogs */}
            <AlertDialog open={variantToDeleteIndex !== null} onOpenChange={() => setVariantToDeleteIndex(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Eliminar Variante</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemoveVariant} className="bg-destructive">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>¿Eliminar ítem?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminará &quot;{itemToDelete?.name}&quot;</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showSyncConfirm} onOpenChange={setShowSyncConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Sincronizar desde POS</AlertDialogTitle>
                        <AlertDialogDescription>Esto reemplazará el menú actual de la App con el del POS.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSyncFromPOS}>Sincronizar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
