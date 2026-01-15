import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import type { MenuPlato, MenuItem, MenuItemVariant, FirestoreItem } from '@/types';
export type { FirestoreItem };

export interface Category {
    id: string;
    name: string;
    order: number;
}

// FirestoreItem removed (moved to types)

export function useMenu() {
    // Initialize state from localStorage if available
    const [categories, setCategories] = useState<Category[]>(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('menu_categories');
            if (cached) {
                try { return JSON.parse(cached); } catch (e) { return []; }
            }
        }
        return [];
    });

    const [items, setItems] = useState<FirestoreItem[]>(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('menu_items');
            if (cached) {
                try { return JSON.parse(cached); } catch (e) { return []; }
            }
        }
        return [];
    });

    // If we have cached data, we're not technically loading visually
    const [loading, setLoading] = useState(!categories.length || !items.length);
    useEffect(() => {
        const qCategories = query(collection(db, 'categories'), orderBy('order'));
        const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(cats);
            localStorage.setItem('menu_categories', JSON.stringify(cats));
        });

        // Simple query to avoid composite index requirements
        const qItems = query(collection(db, 'items'));
        const unsubscribeItems = onSnapshot(qItems, (snapshot) => {
            const its = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreItem));

            // Stable sort: by order first, then by name for items with same/no order
            const sorted = [...its].sort((a, b) => {
                const orderA = a.order ?? 0;
                const orderB = b.order ?? 0;
                if (orderA !== orderB) return orderA - orderB;
                return (a.name || '').localeCompare(b.name || '');
            });

            setItems(sorted);
            localStorage.setItem('menu_items', JSON.stringify(sorted));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching items:", error);
            setLoading(false);
        });

        return () => {
            unsubscribeCategories();
            unsubscribeItems();
        };
    }, []);

    const addCategory = async (name: string) => {
        await addDoc(collection(db, 'categories'), {
            name,
            order: categories.length,
            createdAt: Date.now()
        });
    };

    const addItem = async (item: Omit<FirestoreItem, 'id'>) => {
        const categoryItems = items.filter(i => i.categoryId === item.categoryId);
        const maxOrder = categoryItems.length > 0
            ? Math.max(...categoryItems.map(i => i.order || 0))
            : -1;

        await addDoc(collection(db, 'items'), {
            ...item,
            order: maxOrder + 1
        });
    };

    const updateItem = async (id: string, data: Partial<FirestoreItem>) => {
        await updateDoc(doc(db, 'items', id), data);
    };

    const deleteItem = async (id: string) => {
        await deleteDoc(doc(db, 'items', id));
    };

    const reorderItem = async (itemId: string, direction: 'up' | 'down') => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const categoryItems = items
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

        // Swap items in array
        const newOrderList = [...categoryItems];
        const temp = newOrderList[currentIndex];
        newOrderList[currentIndex] = newOrderList[targetIndex];
        newOrderList[targetIndex] = temp;

        // Update all items in category with sequential order
        const updates = newOrderList.map((it, idx) =>
            updateDoc(doc(db, 'items', it.id), { order: idx })
        );

        try {
            await Promise.all(updates);
        } catch (error) {
            console.error('Error updating item orders:', error);
        }
    };


    const deleteCategory = async (id: string) => {
        await deleteDoc(doc(db, 'categories', id));
    };

    return {
        categories,
        items,
        loading,
        addCategory,
        addItem,
        updateItem,
        deleteItem,
        deleteCategory,
        reorderItem
    };
}
