"use client";

import { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { InventoryItem } from '@/types';

export function useInventory() {
    const [items, setItems] = useState<InventoryItem[] | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'inventory_items'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const itemsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as InventoryItem[];

            setItems(itemsData);
            setLoading(false);
        }, (error) => {
            console.error('Error loading inventory items:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const now = Date.now();
            await addDoc(collection(db, 'inventory_items'), {
                ...itemData,
                createdAt: now,
                updatedAt: now,
            });
        } catch (error) {
        } catch (error) {
            console.error('Error deleting inventory item:', error);
            throw error;
        }
    };

    // Helper para obtener items con stock bajo
    const getLowStockItems = useCallback(() => {
        if (!items) return [];
        return items.filter(item => item.currentStock <= item.minStock);
    }, [items]);

    // Helper para obtener el valor total del inventario
    const getTotalInventoryValue = useCallback(() => {
        if (!items) return 0;
        return items.reduce((total, item) => total + (item.currentStock * item.costPerUnit), 0);
    }, [items]);

    return {
        items,
        loading,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        getLowStockItems,
        getTotalInventoryValue,
    };
}
