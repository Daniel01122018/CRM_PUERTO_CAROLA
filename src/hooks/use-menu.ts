import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import type { MenuPlato, MenuItem, MenuItemVariant } from '@/types';

export interface Category {
    id: string;
    name: string;
    order: number;
}

export interface FirestoreItem {
    id: string;
    name: string;
    categoryId: string;
    categoryName: string;
    price: number;
    variants?: MenuItemVariant[];
    flavors?: string[];
    isAvailable: boolean;
    type: 'plato' | 'item';
    paraLlevar?: boolean;
}

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
