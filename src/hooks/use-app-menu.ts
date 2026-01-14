import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAppStore } from './use-app-store';
import type { AppMenuDocument, AppMenuItem, AppMenuCategory, AppMenuVariant } from '@/types/app-menu';
import type { FirestoreItem } from '@/types';

const APP_MENU_DOC_PATH = 'AppMenu/fullMenu';

/**
 * Hook for managing the App Menu (denormalized single-document menu for mobile app)
 */
export function useAppMenu() {
    const { currentUser } = useAppStore();
    const [menuData, setMenuData] = useState<AppMenuDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load menu data with real-time updates (for CRM admin panel)
    useEffect(() => {
        const docRef = doc(db, 'AppMenu', 'fullMenu');

        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                setMenuData(snapshot.data() as AppMenuDocument);
            } else {
                // Initialize with empty menu if document doesn't exist
                setMenuData({
                    categories: [],
                    items: [],
                    updatedAt: Date.now(),
                    updatedBy: 'system'
                });
            }
            setLoading(false);
        }, (err) => {
            console.error('Error loading app menu:', err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Save menu data to Firestore
    const saveMenu = useCallback(async (data: Partial<AppMenuDocument>) => {
        const docRef = doc(db, 'AppMenu', 'fullMenu');
        const updatedData = {
            ...menuData,
            ...data,
            updatedAt: Date.now(),
            updatedBy: currentUser?.username || 'unknown'
        };
        await setDoc(docRef, updatedData);
    }, [menuData, currentUser]);

    // Category operations
    const addCategory = useCallback(async (name: string) => {
        if (!menuData) return;

        const newCategory: AppMenuCategory = {
            id: `cat_${Date.now()}`,
            name,
            order: menuData.categories.length
        };

        await saveMenu({
            categories: [...menuData.categories, newCategory]
        });
    }, [menuData, saveMenu]);

    const updateCategory = useCallback(async (categoryId: string, name: string) => {
        if (!menuData) return;

        const updatedCategories = menuData.categories.map(cat =>
            cat.id === categoryId ? { ...cat, name } : cat
        );

        // Also update categoryName in items
        const updatedItems = menuData.items.map(item =>
            item.categoryId === categoryId ? { ...item, categoryName: name } : item
        );

        await saveMenu({
            categories: updatedCategories,
            items: updatedItems
        });
    }, [menuData, saveMenu]);

    const deleteCategory = useCallback(async (categoryId: string) => {
        if (!menuData) return;

        // Remove category and all items in that category
        await saveMenu({
            categories: menuData.categories.filter(c => c.id !== categoryId),
            items: menuData.items.filter(i => i.categoryId !== categoryId)
        });
    }, [menuData, saveMenu]);

    // Item operations
    const addItem = useCallback(async (item: Omit<AppMenuItem, 'id' | 'order'>) => {
        if (!menuData) return;

        const categoryItems = menuData.items.filter(i => i.categoryId === item.categoryId);
        const maxOrder = categoryItems.length > 0
            ? Math.max(...categoryItems.map(i => i.order))
            : -1;

        const newItem: AppMenuItem = {
            ...item,
            id: `item_${Date.now()}`,
            order: maxOrder + 1
        };

        await saveMenu({
            items: [...menuData.items, newItem]
        });
    }, [menuData, saveMenu]);

    const updateItem = useCallback(async (itemId: string, data: Partial<AppMenuItem>) => {
        if (!menuData) return;

        const updatedItems = menuData.items.map(item =>
            item.id === itemId ? { ...item, ...data } : item
        );

        await saveMenu({ items: updatedItems });
    }, [menuData, saveMenu]);

    const deleteItem = useCallback(async (itemId: string) => {
        if (!menuData) return;

        await saveMenu({
            items: menuData.items.filter(i => i.id !== itemId)
        });
    }, [menuData, saveMenu]);

    const reorderItem = useCallback(async (itemId: string, direction: 'up' | 'down') => {
        if (!menuData) return;

        const item = menuData.items.find(i => i.id === itemId);
        if (!item) return;

        const categoryItems = menuData.items
            .filter(i => i.categoryId === item.categoryId)
            .sort((a, b) => a.order - b.order);

        const currentIndex = categoryItems.findIndex(i => i.id === itemId);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= categoryItems.length) return;

        // Swap orders
        const reorderedItems = [...categoryItems];
        const temp = reorderedItems[currentIndex];
        reorderedItems[currentIndex] = reorderedItems[targetIndex];
        reorderedItems[targetIndex] = temp;

        // Update order values
        reorderedItems.forEach((it, idx) => {
            it.order = idx;
        });

        // Merge back with items from other categories
        const otherItems = menuData.items.filter(i => i.categoryId !== item.categoryId);
        await saveMenu({
            items: [...otherItems, ...reorderedItems]
        });
    }, [menuData, saveMenu]);

    const toggleItemAvailability = useCallback(async (itemId: string) => {
        if (!menuData) return;

        const item = menuData.items.find(i => i.id === itemId);
        if (!item) return;

        await updateItem(itemId, { isAvailable: !item.isAvailable });
    }, [menuData, updateItem]);

    // Sync from POS menu (one-time copy)
    const syncFromPOSMenu = useCallback(async () => {
        if (!currentUser) return;

        try {
            // Fetch categories from POS
            const categoriesSnapshot = await getDocs(
                query(collection(db, 'categories'), orderBy('order'))
            );
            const posCategories = categoriesSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name as string,
                order: doc.data().order as number
            }));

            // Fetch items from POS
            const itemsSnapshot = await getDocs(collection(db, 'items'));
            const posItems: AppMenuItem[] = itemsSnapshot.docs.map(docSnap => {
                const data = docSnap.data() as FirestoreItem;

                // Build item without undefined values (Firestore doesn't accept undefined)
                const item: AppMenuItem = {
                    id: docSnap.id,
                    name: data.name || '',
                    price: data.price ?? 0,
                    categoryId: data.categoryId || '',
                    categoryName: data.categoryName || '',
                    isAvailable: data.isAvailable ?? true,
                    type: data.type || 'item',
                    order: data.order ?? 0,
                    variants: [] // Default empty array
                };

                // Only add variants if they exist
                if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
                    item.variants = data.variants.map(v => ({
                        id: v.id ?? Date.now(),
                        nombre: v.nombre || '',
                        precio: v.precio ?? 0,
                        contexto: v.contexto || 'llevar'
                    }));
                }

                return item;
            });

            // Sort items by order
            posItems.sort((a, b) => a.order - b.order);

            // Save to AppMenu
            const docRef = doc(db, 'AppMenu', 'fullMenu');
            await setDoc(docRef, {
                categories: posCategories,
                items: posItems,
                updatedAt: Date.now(),
                updatedBy: currentUser.username
            });

            return { categoriesCount: posCategories.length, itemsCount: posItems.length };
        } catch (err) {
            console.error('Error syncing from POS menu:', err);
            throw err;
        }
    }, [currentUser]);

    return {
        // Data
        categories: menuData?.categories || [],
        items: menuData?.items || [],
        loading,
        error,
        lastUpdated: menuData?.updatedAt,
        lastUpdatedBy: menuData?.updatedBy,

        // Category operations
        addCategory,
        updateCategory,
        deleteCategory,

        // Item operations
        addItem,
        updateItem,
        deleteItem,
        reorderItem,
        toggleItemAvailability,

        // Sync
        syncFromPOSMenu
    };
}
