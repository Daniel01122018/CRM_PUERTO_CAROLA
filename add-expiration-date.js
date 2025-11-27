const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'inventory', 'page.tsx');

console.log('🔧 Agregando campo expirationDate al módulo de inventario...\n');

// Leer el archivo
let content = fs.readFileSync(filePath, 'utf8');
const originalContent = content;

// 1. Agregar expirationDate al schema
console.log('✅ Paso 1: Agregando al schema de validación...');
content = content.replace(
    /supplier: z\.string\(\)\.optional\(\),\s*notes: z\.string\(\)\.optional\(\),/,
    `supplier: z.string().optional(),
  expirationDate: z.string().optional(),
  notes: z.string().optional(),`
);

// 2. Agregar al defaultValues
console.log('✅ Paso 2: Agregando a default values...');
content = content.replace(
    /supplier: '',\s*notes: '',/,
    `supplier: '',
      expirationDate: '',
      notes: '',`
);

// 3. Modificar onSubmit - buscar la función completa y reemplazarla
console.log('✅ Paso 3: Modificando función onSubmit...');
const onSubmitPattern = /const onSubmit = async \(values: z\.infer<typeof itemSchema>\) => \{[^}]*\{[^}]*categoryName: category\.name,\s*createdBy: currentUser\.username,\s*\}\);[\s\S]*?\}\s*catch[\s\S]*?\}\s*\};/;

const newOnSubmit = `const onSubmit = async (values: z.infer<typeof itemSchema>) => {
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
        maxStock: values.maxStock,
        costPerUnit: values.costPerUnit,
        supplier: values.supplier,
        notes: values.notes,
        createdBy: currentUser.username,
      };

      // Convertir fecha a timestamp si existe
      if (values.expirationDate) {
        itemData.expirationDate = new Date(values.expirationDate).getTime();
      }

      await addInventoryItem(itemData);

      toast({
        title: 'Item Creado',
        description: \`Se ha añadido "\${values.name}" al inventario.\`,
      });

      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al crear',
        description: error.message || 'No se pudo crear el item.',
      });
    }
  };`;

content = content.replace(onSubmitPattern, newOnSubmit);

// 4. Modificar onEditSubmit
console.log('✅ Paso 4: Modificando función onEditSubmit...');
const onEditSubmitPattern = /const onEditSubmit = async \(values: z\.infer<typeof itemSchema>\) => \{[^}]*\{[^}]*categoryName: category\?\.name \|\| selectedItem\.categoryName,\s*\}\);[\s\S]*?\}\s*catch[\s\S]*?\}\s*\};/;

const newOnEditSubmit = `const onEditSubmit = async (values: z.infer<typeof itemSchema>) => {
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
  };`;

content = content.replace(onEditSubmitPattern, newOnEditSubmit);

// 5. Agregar campo al formulario (después del campo supplier)
console.log('✅ Paso 5: Agregando campo al formulario...');
const supplierFieldPattern = /(<FormField[\s\S]*?name="supplier"[\s\S]*?<\/FormItem>\s*<\/FormItem>\s*\)\s*}\s*\/>)/;

content = content.replace(
    supplierFieldPattern,
    `$1

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
                    />`
);

// 6. Agregar campo al modal de edición (después del supplier en editForm)
console.log('✅ Paso 6: Agregando campo al modal de edición...');
const editSupplierPattern = /(control={editForm\.control}[\s\S]*?name="supplier"[\s\S]*?<\/FormItem>\s*\)\s*}\s*\/>)/;

content = content.replace(
    editSupplierPattern,
    `$1

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
                />`
);

// 7. Actualizar el reset del editForm para incluir expirationDate
console.log('✅ Paso 7: Actualizando reset de editForm...');
content = content.replace(
    /supplier: item\.supplier \|\| '',\s*notes: item\.notes \|\| '',/,
    `supplier: item.supplier || '',
                                        expirationDate: item.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : '',
                                        notes: item.notes || '',`
);

// Verificar cambios
if (content === originalContent) {
    console.log('\n❌ ERROR: No se pudieron aplicar los cambios.');
    console.log('El archivo puede haber sido modificado previamente o tiene un formato diferente.');
    process.exit(1);
}

// Guardar el archivo
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ ¡Completado! El campo expirationDate ha sido agregado exitosamente.');
console.log('📁 Archivo modificado:', filePath);
console.log('\n🔄 El servidor de desarrollo debería recargar automáticamente.');
