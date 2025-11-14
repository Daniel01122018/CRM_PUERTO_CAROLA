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


  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestor de Menú</h1>
          <p className="text-sm text-gray-600">Crea hasta 20 categorías y gestiona opciones maestras + subopciones. Persistencia offline con Firestore.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            {categoriesLoading && (
              <div className="text-sm text-gray-700 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-1" /> Cargando…
              </div>
            )}
            {categoriesError && (
              <div className="mt-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded flex items-center">
                <RefreshCw className="h-3 w-3 mr-1" /> Error de carga
              </div>
            )}
            {(!categoriesLoading && !categoriesError) && (
              <div className="text-sm text-gray-700">Datos sincronizados</div>
            )}
            {/* Offline Badge - Will be shown based on actual offline status, which needs a more sophisticated check */}
            <div className="hidden mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded" id="offlineBadge">Offline / Sin red</div>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
          </Button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: categorías */}
        <section className="lg:col-span-1">
          <Card className="card">
            <CardHeader>
              <CardTitle className="font-semibold mb-2">Categorías (max 20)</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleAddCategory(); }} className="flex gap-2 mb-3">
                <Input id="categoryName" className="flex-1 border rounded px-3 py-2" placeholder="Nombre de categoría (p. ej. Platos)" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} required />
                <Button type="submit"><PlusCircle className="h-4 w-4" /> Añadir</Button>
              </form>
              <div className="space-y-2 max-h-64 overflow-auto" id="categoriesList">
                {categories.length > 0 ? (
                  <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex flex-col">
                    <TabsList className="flex flex-col h-auto p-0">
                      {categories.map((category) => (
                        <TabsTrigger key={category.id} value={category.id} className="flex justify-between items-center w-full px-3 py-2 rounded-md hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          {editingCategory?.id === category.id ? (
                            <Input
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                              onBlur={handleUpdateCategory}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateCategory();
                                }
                              }}
                              className="flex-grow mr-2"
                            />
                          ) : (
                            <span className="flex-grow text-left">{category.name}</span>
                          )}
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingCategory(category); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará la categoría y todas sus opciones maestras y variantes de menú.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                ) : (
                  <p className="text-muted-foreground text-center">No hay categorías. Añade una para empezar.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="card mt-4">
            <CardHeader>
              <CardTitle className="font-semibold mb-2">Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExportJson} className="w-full mb-2" variant="outline">
                <Download className="mr-2 h-4 w-4" /> Exportar JSON (local)
              </Button>
              <Button onClick={handleClearLocalCache} className="w-full text-red-600" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" /> Borrar caché local (IndexedDB)
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Center: pestañas / opciones maestras */}
        <section className="lg:col-span-2">
          <Card className="card">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Opciones Maestras</CardTitle>
                <div className="text-sm text-gray-600">Seleccionada: <span className="font-semibold">{categories.find(cat => cat.id === activeTab)?.name || '—'}</span></div>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab ? (
                <div className="space-y-4">
                  <form onSubmit={(e) => { e.preventDefault(); handleAddMasterOption(); }} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input id="masterName" className="border rounded px-3 py-2 md:col-span-2" placeholder="Nombre de opción maestra (p. ej. Encebollado)" value={newMasterOptionName} onChange={(e) => setNewMasterOptionName(e.target.value)} required />
                    <Button type="submit"><PlusCircle className="h-4 w-4" /> Crear opción maestra</Button>
                  </form>

                  {masterOptionsLoading ? (
                    <div className="flex justify-center items-center h-20">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <p className="ml-2">Cargando opciones maestras...</p>
                    </div>
                  ) : masterOptionsError ? (
                    <div className="text-red-500">Error: {masterOptionsError.message}</div>
                  ) : (
                    <div id="mastersList" className="space-y-3">
                      {masterOptions.length > 0 ? (
                        masterOptions.map((masterOption) => (
                          <MasterOptionCard
                            key={masterOption.id}
                            masterOption={masterOption}
                            editingMasterOption={editingMasterOption}
                            setEditingMasterOption={setEditingMasterOption}
                            handleUpdateMasterOption={handleUpdateMasterOption}
                            handleDeleteMasterOption={handleDeleteMasterOption}
                            handleAddMenuItemVariant={handleAddMenuItemVariant}
                            handleUpdateMenuItemVariant={handleUpdateMenuItemVariant}
                            handleDeleteMenuItemVariant={handleDeleteMenuItemVariant}
                            newMenuItemVariantName={newMenuItemVariantName}
                            setNewMenuItemVariantName={setNewMenuItemVariantName}
                            newMenuItemVariantPrice={newMenuItemVariantPrice}
                            setNewMenuItemVariantPrice={setNewMenuItemVariantPrice}
                            newMenuItemVariantCustomPrice={newMenuItemVariantCustomPrice}
                            setNewMenuItemVariantCustomPrice={setNewMenuItemVariantCustomPrice}
                            newMenuItemVariantContext={newMenuItemVariantContext}
                            setNewMenuItemVariantContext={setNewMenuItemVariantContext}
                            editingMenuItemVariant={editingMenuItemVariant}
                            setEditingMenuItemVariant={setEditingMenuItemVariant}
                          />
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center">No hay opciones maestras. Añade una para esta categoría.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center">Selecciona una categoría o añade una nueva para gestionar las opciones maestras.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

interface MasterOptionCardProps {
  masterOption: MasterOption;
  editingMasterOption: MasterOption | null;
  setEditingMasterOption: React.Dispatch<React.SetStateAction<MasterOption | null>>;
  handleUpdateMasterOption: () => Promise<void>;
  handleDeleteMasterOption: (masterOptionId: string) => Promise<void>;
  handleAddMenuItemVariant: (masterOptionId: string) => Promise<void>;
  handleUpdateMenuItemVariant: () => Promise<void>;
  handleDeleteMenuItemVariant: (menuItemVariantId: string) => Promise<void>;
  newMenuItemVariantName: string;
  setNewMenuItemVariantName: React.Dispatch<React.SetStateAction<string>>;
  newMenuItemVariantPrice: number | undefined;
  setNewMenuItemVariantPrice: React.Dispatch<React.SetStateAction<number | undefined>>;
  newMenuItemVariantCustomPrice: boolean;
  setNewMenuItemVariantCustomPrice: React.Dispatch<React.SetStateAction<boolean>>;
  newMenuItemVariantContext: 'salon' | 'llevar' | 'general';
  setNewMenuItemVariantContext: React.Dispatch<React.SetStateAction<'salon' | 'llevar' | 'general'>>;
  editingMenuItemVariant: MenuItemVariant | null;
  setEditingMenuItemVariant: React.Dispatch<React.SetStateAction<MenuItemVariant | null>>;
}

const MasterOptionCard: React.FC<MasterOptionCardProps> = ({
  masterOption,
  editingMasterOption,
  setEditingMasterOption,
  handleUpdateMasterOption,
  handleDeleteMasterOption,
  handleAddMenuItemVariant,
  handleUpdateMenuItemVariant,
  handleDeleteMenuItemVariant,
  newMenuItemVariantName,
  setNewMenuItemVariantName,
  newMenuItemVariantPrice,
  setNewMenuItemVariantPrice,
  newMenuItemVariantCustomPrice,
  setNewMenuItemVariantCustomPrice,
  newMenuItemVariantContext,
  setNewMenuItemVariantContext,
  editingMenuItemVariant,
  setEditingMenuItemVariant,
}) => {
  const { menuItemVariants, loading: menuItemVariantsLoading, error: menuItemVariantsError } = useMenuItemVariants(masterOption.id);

  return (
    <Card key={masterOption.id}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {editingMasterOption?.id === masterOption.id ? (
          <Input
            value={editingMasterOption.name}
            onChange={(e) => setEditingMasterOption({ ...editingMasterOption, name: e.target.value })}
            onBlur={handleUpdateMasterOption}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleUpdateMasterOption();
              }
            }}
          />
        ) : (
          <CardTitle className="text-lg font-medium">{masterOption.name}</CardTitle>
        )}
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingMasterOption(masterOption); }}>
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará la opción maestra y todas sus variantes de menú.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteMasterOption(masterOption.id)}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{masterOption.description}</p>
        <h4 className="text-md font-semibold mb-2">Variantes de Menú</h4>
        {menuItemVariantsLoading ? (
          <div className="flex justify-center items-center h-16">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="ml-2">Cargando variantes...</p>
          </div>
        ) : menuItemVariantsError ? (
          <div className="text-red-500">Error: {menuItemVariantsError.message}</div>
        ) : (
          <div className="flex flex-col space-y-2 mb-4">
            {menuItemVariants.length > 0 ? (
              menuItemVariants.map((variant) => (
                <div key={variant.id} className="flex items-center justify-between">
                  {editingMenuItemVariant?.id === variant.id ? (
                    <div className="flex-grow flex space-x-2">
                      <Input
                        value={editingMenuItemVariant.name}
                        onChange={(e) => setEditingMenuItemVariant({ ...editingMenuItemVariant, name: e.target.value })}
                        onBlur={handleUpdateMenuItemVariant}
                      />
                      <Input
                        type="number"
                        placeholder="Precio"
                        value={editingMenuItemVariant.price || ''}
                        onChange={(e) => setEditingMenuItemVariant({ ...editingMenuItemVariant, price: parseFloat(e.target.value) })}
                        onBlur={handleUpdateMenuItemVariant}
                      />
                      <select
                        value={editingMenuItemVariant.context}
                        onChange={(e) => setEditingMenuItemVariant({ ...editingMenuItemVariant, context: e.target.value as 'salon' | 'llevar' | 'general' })}
                        onBlur={handleUpdateMenuItemVariant}
                        className="p-2 border rounded"
                      >
                        <option value="general">General</option>
                        <option value="salon">Salón</option>
                        <option value="llevar">Llevar</option>
                      </select>
                    </div>
                  ) : (
                    <span>{variant.name} {variant.price ? `($${variant.price.toFixed(2)})` : '(Precio Personalizado)'} ({variant.context})</span>
                  )}
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingMenuItemVariant(variant); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará la variante del elemento del menú.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteMenuItemVariant(variant.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center">No hay variantes para esta opción maestra. Añade una para empezar.</p>
            )}
          </div>
        )}
        <div className="flex space-x-2">
          <Input
            placeholder="Nueva Variante"
            value={newMenuItemVariantName}
            onChange={(e) => setNewMenuItemVariantName(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Precio (opcional)"
            value={newMenuItemVariantPrice || ''}
            onChange={(e) => setNewMenuItemVariantPrice(parseFloat(e.target.value))}
          />
          <select
            value={newMenuItemVariantContext}
            onChange={(e) => setNewMenuItemVariantContext(e.target.value as 'salon' | 'llevar' | 'general')}
            className="p-2 border rounded"
          >
            <option value="general">General</option>
            <option value="salon">Salón</option>
            <option value="llevar">Llevar</option>
          </select>
          <Button onClick={() => handleAddMenuItemVariant(masterOption.id)}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Variante</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuManagementPage;
