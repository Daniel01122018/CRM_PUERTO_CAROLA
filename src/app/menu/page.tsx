"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Settings } from 'lucide-react';
import { useMenu, FirestoreItem, Category } from '@/hooks/use-menu';
import { MenuTabs } from '@/components/menu/menu-tabs';
import { MenuItemCard } from '@/components/menu/menu-item-card';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function MenuManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { categories, items, loading, addCategory, addItem, updateItem, deleteItem } = useMenu();

  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [isItemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FirestoreItem | null>(null);

  // Form states for Item
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemType, setItemType] = useState<'plato' | 'item'>('item');
  const [itemParaLlevar, setItemParaLlevar] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<FirestoreItem | null>(null);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    await addCategory(newCategoryName);
    setCategoryDialogOpen(false);
    setNewCategoryName('');
    toast({ title: "Categoría creada" });
  };

  const handleOpenItemDialog = (item?: FirestoreItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemPrice(item.price.toString());
      setItemCategory(item.categoryId);
      setItemType(item.type);
      setItemParaLlevar(item.paraLlevar || false);
    } else {
      setEditingItem(null);
      setItemName('');
      setItemPrice('');
      setItemCategory(categories[0]?.id || '');
      setItemType('item');
      setItemParaLlevar(false);
    }
    setItemDialogOpen(true);
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

    const itemData: any = {
      name: itemName,
      categoryId: itemCategory,
      categoryName: category?.name || '',
      price,
      type: itemType,
      paraLlevar: itemParaLlevar,
      isAvailable: true
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

  const handleDeleteClick = (item: FirestoreItem) => {
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete.id);
      toast({ title: "Ítem eliminado" });
      setItemToDelete(null);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando menú...</div>;

  return (
    <div className="flex flex-col min-h-screen p-6 gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Gestión de Menú</h1>
        </div>
        <div className="flex gap-2">
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

      <Card className="flex-1">
        <CardContent className="pt-6">
          <MenuTabs categories={categories}>
            {(categoryId) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items
                  .filter(item => item.categoryId === categoryId)
                  .map(item => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      mode="edit"
                      onEdit={handleOpenItemDialog}
                      onDelete={handleDeleteClick}
                    />
                  ))}
              </div>
            )}
          </MenuTabs>
        </CardContent>
      </Card>

      <Dialog open={isItemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Ítem' : 'Nuevo Ítem'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Nombre</Label>
              <Input className="col-span-3" value={itemName} onChange={e => setItemName(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Categoría</Label>
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
              <Label className="text-right">Tipo</Label>
              <Select value={itemType} onValueChange={(v: 'plato' | 'item') => setItemType(v)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="item">Ítem Simple (Precio fijo)</SelectItem>
                  <SelectItem value="plato">Plato (Variantes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {itemType === 'item' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Precio</Label>
                <Input className="col-span-3" type="number" min="0" value={itemPrice} onChange={e => setItemPrice(e.target.value)} />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Para Llevar</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox id="llevar" checked={itemParaLlevar} onCheckedChange={(c) => setItemParaLlevar(!!c)} />
                <label htmlFor="llevar" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Es exclusivo para llevar
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveItem}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el ítem "{itemToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
