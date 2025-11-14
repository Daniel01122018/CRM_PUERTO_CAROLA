"use client";

import React, { useState, useEffect } from 'react';
import { Category, MasterOption, MenuItemVariant } from '../../types/menu';
import {
  addCategory,
  updateCategory,
  deleteCategory,
  addMasterOption,
  updateMasterOption,
  deleteMasterOption,
  addMenuItemVariant,
  updateMenuItemVariant,
  deleteMenuItemVariant,
} from '../../lib/menu-firebase';
import { useCategories, useMasterOptions, useMenuItemVariants } from '../../hooks/use-menu-data';
import { useRouter } from 'next/navigation';

import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { PlusCircle, Trash2, Edit, Loader2, ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';

const MenuManagementPage: React.FC = () => {
  const router = useRouter();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  const { masterOptions, loading: masterOptionsLoading, error: masterOptionsError } = useMasterOptions(activeTab);
  const [newMasterOptionName, setNewMasterOptionName] = useState<string>('');
  const [newMasterOptionDescription, setNewMasterOptionDescription] = useState<string>('');
  const [editingMasterOption, setEditingMasterOption] = useState<MasterOption | null>(null);

  const [newMenuItemVariantName, setNewMenuItemVariantName] = useState<string>('');
  const [newMenuItemVariantPrice, setNewMenuItemVariantPrice] = useState<number | undefined>(undefined);
  const [newMenuItemVariantCustomPrice, setNewMenuItemVariantCustomPrice] = useState<boolean>(false);
  const [newMenuItemVariantContext, setNewMenuItemVariantContext] = useState<'salon' | 'llevar' | 'general'>('general');
  const [editingMenuItemVariant, setEditingMenuItemVariant] = useState<MenuItemVariant | null>(null);


  useEffect(() => {
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].id);
    }
  }, [categories, activeTab]);

  const handleAddCategory = async () => {
    if (newCategoryName.trim() === '') return;
    if (categories.length >= 20) {
      alert('Maximum 20 categories allowed.');
      return;
    }
    try {
      await addCategory(newCategoryName);
      setNewCategoryName('');
    } catch (error) {
      console.error("Error adding category: ", error);
      alert("Failed to add category.");
    }
  };

  const handleUpdateCategory = async () => {
    if (editingCategory && editingCategory.name.trim() !== '') {
      try {
        await updateCategory(editingCategory);
        setEditingCategory(null);
      } catch (error) {
        console.error("Error updating category: ", error);
        alert("Failed to update category.");
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
    } catch (error) {
      console.error("Error deleting category: ", error);
      alert("Failed to delete category.");
    }
  };

  const handleAddMasterOption = async () => {
    if (activeTab && newMasterOptionName.trim() !== '') {
      try {
        await addMasterOption(newMasterOptionName, activeTab, newMasterOptionDescription);
        setNewMasterOptionName('');
        setNewMasterOptionDescription('');
      } catch (error) {
        console.error("Error adding master option: ", error);
        alert("Failed to add master option.");
      }
    }
  };

  const handleUpdateMasterOption = async () => {
    if (editingMasterOption && editingMasterOption.name.trim() !== '') {
      try {
        await updateMasterOption(editingMasterOption);
        setEditingMasterOption(null);
      } catch (error) {
        console.error("Error updating master option: ", error);
        alert("Failed to update master option.");
      }
    }
  };

  const handleDeleteMasterOption = async (masterOptionId: string) => {
    try {
      await deleteMasterOption(masterOptionId);
    } catch (error) {
      console.error("Error deleting master option: ", error);
      alert("Failed to delete master option.");
    }
  };

  const handleAddMenuItemVariant = async (masterOptionId: string) => {
    if (newMenuItemVariantName.trim() === '') return;
    try {
      await addMenuItemVariant(masterOptionId, newMenuItemVariantName, newMenuItemVariantPrice, newMenuItemVariantCustomPrice, newMenuItemVariantContext);
      setNewMenuItemVariantName('');
      setNewMenuItemVariantPrice(undefined);
      setNewMenuItemVariantCustomPrice(false);
      setNewMenuItemVariantContext('general');
    } catch (error) {
      console.error("Error adding menu item variant: ", error);
      alert("Failed to add menu item variant.");
    }
  };

  const handleUpdateMenuItemVariant = async () => {
    if (editingMenuItemVariant && editingMenuItemVariant.name.trim() !== '') {
      try {
        await updateMenuItemVariant(editingMenuItemVariant);
        setEditingMenuItemVariant(null);
      } catch (error) {
        console.error("Error updating menu item variant: ", error);
        alert("Failed to update menu item variant.");
      }
    }
  };

  const handleDeleteMenuItemVariant = async (menuItemVariantId: string) => {
    try {
      await deleteMenuItemVariant(menuItemVariantId);
    } catch (error) {
      console.error("Error deleting menu item variant: ", error);
      alert("Failed to delete menu item variant.");
    }
  };

  const handleExportJson = () => {
    // Implement export functionality here
    alert("Exportar JSON (funcionalidad pendiente)");
  };

  const handleClearLocalCache = () => {
    // Implement clear local cache functionality here
    alert("Borrar caché local (funcionalidad pendiente)");
  };
}