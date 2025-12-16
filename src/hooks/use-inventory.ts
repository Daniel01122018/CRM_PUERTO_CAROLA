"use client";

import { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { InventoryItem } from '@/types';
import { useAuth } from './use-auth';

export function useInventory() {
    const { currentUser } = useAuth();
    const [items, setItems] = useState<InventoryItem[] | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 🔒 OPTIMIZATION: Only admins need inventory data
        if (!currentUser || currentUser.role !== 'admin') {
            setItems([]);
            setLoading(false);
            return;
        }

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
    }, [currentUser]);

    const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const now = Date.now();
            await addDoc(collection(db, 'inventory_items'), {
                ...itemData,
                createdAt: now,
                updatedAt: now,
            });
        } catch (error) {
            console.error('Error adding inventory item:', error);
            throw error;
        }
    };

    const updateInventoryItem = async (itemId: string, updates: Partial<InventoryItem>) => {
        try {
            const itemRef = doc(db, 'inventory_items', itemId);

            // Remove fields that shouldn't be updated and filter out undefined values
            const { id, createdAt, createdBy, ...updateData } = updates as any;

            // Remove undefined values (Firestore doesn't accept them)
            const cleanedData = Object.entries(updateData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await updateDoc(itemRef, {
                ...cleanedData,
                updatedAt: Date.now(),
            });
        } catch (error) {
            console.error('Error updating inventory item:', error);
            throw error;
        }
    };

    const deleteInventoryItem = async (itemId: string) => {
        try {
            const itemRef = doc(db, 'inventory_items', itemId);
            await deleteDoc(itemRef);
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
