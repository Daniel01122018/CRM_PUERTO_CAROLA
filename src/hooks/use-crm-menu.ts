import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Category, FirestoreItem, CrmMenuDocument } from '@/types';

const CRM_MENU_DOC_PATH = 'CrmMenu/fullMenu';

export function useCrmMenu() {
    const [menuData, setMenuData] = useState<CrmMenuDocument | null>(() => {
        // Initialize from localStorage
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('crm_menu');
            if (cached) {
                try { return JSON.parse(cached); } catch (e) { return null; }
            }
        }
        return null;
    });

    const [loading, setLoading] = useState(!menuData);

    // Real-time listener
    useEffect(() => {
        const docRef = doc(db, 'CrmMenu', 'fullMenu');

        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data() as CrmMenuDocument;
                setMenuData(data);
                localStorage.setItem('crm_menu', JSON.stringify(data));
            }
            setLoading(false);
        }, (error) => {
            console.error('Error fetching CRM menu:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Add category
    const addCategory = useCallback(async (name: string) => {
        const docRef = doc(db, 'CrmMenu', 'fullMenu');

        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            const data = docSnap.exists() ? docSnap.data() as CrmMenuDocument : { categories: [], items: [], updatedAt: 0, updatedBy: '' };

            const newCategory: Category = {
                id: Date.now().toString(),
                name,
                order: data.categories.length
            };

            transaction.set(docRef, {
                categories: [...data.categories, newCategory],
                items: data.items,
                updatedAt: Date.now(),
                updatedBy: 'admin' // TODO: Get from auth context
            });
        });
    }, []);

    // Add item
    const addItem = useCallback(async (item: Omit<FirestoreItem, 'id'>) => {
        const docRef = doc(db, 'CrmMenu', 'fullMenu');

        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            const data = docSnap.data() as CrmMenuDocument;

            const categoryItems = data.items.filter(i => i.categoryId === item.categoryId);
            const maxOrder = categoryItems.length > 0
                ? Math.max(...categoryItems.map(i => i.order || 0))
                : -1;

            const newItem: FirestoreItem = {
                ...item,
                id: Date.now().toString(),
                order: maxOrder + 1
            };

            transaction.set(docRef, {
                categories: data.categories,
                items: [...data.items, newItem],
                updatedAt: Date.now(),
                updatedBy: 'admin'
            });
        });
    }, []);

    // Update item
    const updateItem = useCallback(async (itemId: string, updates: Partial<FirestoreItem>) => {
        const docRef = doc(db, 'CrmMenu', 'fullMenu');

        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            const data = docSnap.data() as CrmMenuDocument;

            const updatedItems = data.items.map(item =>
                item.id === itemId ? { ...item, ...updates } : item
            );

            transaction.set(docRef, {
                categories: data.categories,
                items: updatedItems,
                updatedAt: Date.now(),
                updatedBy: 'admin'
            });
        });
    }, []);

    // Delete item
    const deleteItem = useCallback(async (itemId: string) => {
        const docRef = doc(db, 'CrmMenu', 'fullMenu');

        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            const data = docSnap.data() as CrmMenuDocument;

            transaction.set(docRef, {
                categories: data.categories,
                items: data.items.filter(item => item.id !== itemId),
                updatedAt: Date.now(),
                updatedBy: 'admin'
            });
        });
    }, []);

    // Delete category
    const deleteCategory = useCallback(async (categoryId: string) => {
        const docRef = doc(db, 'CrmMenu', 'fullMenu');

        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            const data = docSnap.data() as CrmMenuDocument;

            transaction.set(docRef, {
                categories: data.categories.filter(cat => cat.id !== categoryId),
                items: data.items.filter(item => item.categoryId !== categoryId),
                updatedAt: Date.now(),
                updatedBy: 'admin'
            });
        });
    }, []);

    // Reorder item
    const reorderItem = useCallback(async (itemId: string, direction: 'up' | 'down') => {
        const docRef = doc(db, 'CrmMenu', 'fullMenu');

        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                const data = docSnap.data() as CrmMenuDocument;



                const item = data.items.find(i => i.id === itemId);
                if (!item) return;



                // Get all items in the same category, sorted by order
                const categoryItems = data.items
                    .filter(i => i.categoryId === item.categoryId)
                    .sort((a, b) => {
                        const orderA = a.order ?? 0;
                        const orderB = b.order ?? 0;
                        if (orderA !== orderB) return orderA - orderB;
                        return (a.name || '').localeCompare(b.name || '');
                    });



                const currentIndex = categoryItems.findIndex(i => i.id === itemId);
                if (currentIndex === -1) return;

                const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;


                if (targetIndex < 0 || targetIndex >= categoryItems.length) return;

                const currentItem = categoryItems[currentIndex];
                const targetItem = categoryItems[targetIndex];

                // Swap order values between the two items
                const currentOrder = currentItem.order ?? currentIndex;
                const targetOrder = targetItem.order ?? targetIndex;

                console.log('[reorderItem] Swapping orders:', {
                    current: { id: currentItem.id, name: currentItem.name, oldOrder: currentOrder, newOrder: targetOrder },
                    target: { id: targetItem.id, name: targetItem.name, oldOrder: targetOrder, newOrder: currentOrder }
                });

                const updatedItems = data.items.map(item => {
                    if (item.id === currentItem.id) {
                        return { ...item, order: targetOrder };
                    }
                    if (item.id === targetItem.id) {
                        return { ...item, order: currentOrder };
                    }
                    return item;
                });

                transaction.set(docRef, {
                    categories: data.categories,
                    items: updatedItems,
                    updatedAt: Date.now(),
                    updatedBy: 'admin'
                });

                console.log('[reorderItem] Transaction committed successfully');
            });
            console.log('[reorderItem] Completed');
        } catch (error) {
            console.error('[reorderItem] Error:', error);
            throw error;
        }
    }, []);

    return {
        categories: menuData?.categories || [],
        items: menuData?.items || [],
        loading,
        addCategory,
        addItem,
        updateItem,
        deleteItem,
        deleteCategory,
        reorderItem
    };
}
