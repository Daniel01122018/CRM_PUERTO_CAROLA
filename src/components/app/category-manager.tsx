
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit2, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { AppMenuCategory } from '@/types/app-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface CategoryManagerProps {
    categories: AppMenuCategory[];
    onAdd: (name: string) => Promise<void>;
    onUpdate: (id: string, name: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export function CategoryManager({ categories, onAdd, onUpdate, onDelete }: CategoryManagerProps) {
    const [isAddMode, setIsAddMode] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<{ id: string, name: string } | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

    const handleAdd = async () => {
        if (!newCategoryName.trim()) return;
        await onAdd(newCategoryName);
        setNewCategoryName('');
        setIsAddMode(false);
    };

    const handleUpdate = async () => {
        if (!editingCategory || !editingCategory.name.trim()) return;
        await onUpdate(editingCategory.id, editingCategory.name);
        setEditingCategory(null);
    };

    const handleDelete = async () => {
        if (deletingCategory) {
            await onDelete(deletingCategory);
            setDeletingCategory(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Categorías del Menú</h3>
                <Button size="sm" onClick={() => setIsAddMode(true)} disabled={isAddMode}><Plus className="h-4 w-4 mr-2" /> Nueva</Button>
            </div>

            {/* Add New Category Inline Form */}
            {isAddMode && (
                <div className="flex gap-2 items-center p-2 bg-muted/50 rounded-md animate-in slide-in-from-top-2">
                    <Input
                        placeholder="Nombre de la nueva categoría"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="h-9"
                    />
                    <Button size="sm" onClick={handleAdd}>Guardar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsAddMode(false)}>Cancelar</Button>
                </div>
            )}

            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead className="w-[100px] text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((cat) => (
                            <TableRow key={cat.id}>
                                <TableCell>
                                    {editingCategory?.id === cat.id ? (
                                        <div className="flex gap-2">
                                            <Input
                                                value={editingCategory.name}
                                                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                                className="h-8"
                                            />
                                            <Button size="sm" onClick={handleUpdate}>OK</Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)}>X</Button>
                                        </div>
                                    ) : (
                                        <span className="font-medium">{cat.name}</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingCategory({ id: cat.id, name: cat.name })}>
                                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeletingCategory(cat.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la categoría y <b>todos los productos asociados a ella</b>. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar definitivamente</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
