import { db } from './firebase';
import { collection, doc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { MENU_PLATOS, MENU_ITEMS } from './data';

export const migrateMenuToFirebase = async () => {
  try {
    const batch = writeBatch(db);
    
    // 1. Categories
    const categories = new Set<string>();
    MENU_PLATOS.forEach(p => categories.add(p.category));
    MENU_ITEMS.forEach(i => categories.add(i.category));
    
    const categoriesArray = Array.from(categories);
    
    // Check if categories already exist to avoid duplicates (optional, but good for safety)
    // For this migration, we'll just overwrite or merge based on ID if we had them, 
    // but since categories are strings in the old data, we'll create IDs for them.
    
    const categoryMap = new Map<string, string>(); // Name -> ID

    for (let i = 0; i < categoriesArray.length; i++) {
        const catName = categoriesArray[i];
        const catRef = doc(collection(db, 'categories'));
        categoryMap.set(catName, catRef.id);
        batch.set(catRef, {
            name: catName,
            order: i,
            createdAt: Date.now()
        });
    }

    // 2. Items from MENU_PLATOS
    for (const plato of MENU_PLATOS) {
        const itemRef = doc(collection(db, 'items'));
        const catId = categoryMap.get(plato.category);
        
        batch.set(itemRef, {
            oldId: plato.id,
            name: plato.nombre,
            categoryId: catId,
            categoryName: plato.category, // Keep name for easier querying if needed, or rely on ID
            price: 0, // Platos have variants with prices
            variants: plato.variantes,
            isAvailable: true,
            type: 'plato'
        });
    }

    // 3. Items from MENU_ITEMS
    for (const item of MENU_ITEMS) {
        const itemRef = doc(collection(db, 'items'));
        const catId = categoryMap.get(item.category);

        batch.set(itemRef, {
            oldId: item.id,
            name: item.nombre,
            categoryId: catId,
            categoryName: item.category,
            price: item.precio,
            flavors: item.sabores || [],
            isAvailable: true,
            type: 'item',
            paraLlevar: item.paraLlevar || false
        });
    }

    await batch.commit();
    console.log('Migration completed successfully!');
    return { success: true, message: 'Menú migrado a Firebase correctamente.' };
  } catch (error) {
    console.error('Error migrating menu:', error);
    return { success: false, message: 'Error al migrar el menú.' };
  }
};
