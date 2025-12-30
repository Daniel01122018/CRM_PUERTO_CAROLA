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
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<FirestoreItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const qCategories = query(collection(db, 'categories'), orderBy('order'));
        const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(cats);
        });

        const qItems = query(collection(db, 'items'));
        const unsubscribeItems = onSnapshot(qItems, (snapshot) => {
            const its = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreItem));
            setItems(its);
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
        await addDoc(collection(db, 'items'), item);
    };

    const updateItem = async (id: string, data: Partial<FirestoreItem>) => {
        await updateDoc(doc(db, 'items', id), data);
    };

    const deleteItem = async (id: string) => {
        await deleteDoc(doc(db, 'items', id));
    };

    return {
        categories,
        items,
        loading,
        addCategory,
        addItem,
        updateItem,
        deleteItem
    };
}
