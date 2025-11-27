"use client";

import { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { InventoryCategory } from '@/types';

export function useInventoryCategories() {
    const [categories, setCategories] = useState<InventoryCategory[] | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'inventory_categories'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const categoriesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as InventoryCategory[];

            setCategories(categoriesData);
            setLoading(false);
        }, (error) => {
            console.error('Error loading inventory categories:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addCategory = async (categoryData: Omit<InventoryCategory, 'id' | 'createdAt'>) => {
        try {
            await addDoc(collection(db, 'inventory_categories'), {
                ...categoryData,
                createdAt: Date.now(),
            });
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    };

    const updateCategory = async (categoryId: string, updates: Partial<InventoryCategory>) => {
        try {
            const categoryRef = doc(db, 'inventory_categories', categoryId);

            // Remove fields that shouldn't be updated
            const { id, createdAt, createdBy, ...updateData } = updates as any;

            // Remove undefined values (Firestore doesn't accept them)
            const cleanedData = Object.entries(updateData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await updateDoc(categoryRef, cleanedData);
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    };

    const deleteCategory = async (categoryId: string) => {
        try {
            // Verificar que no hay items en esta categoría
            const itemsQuery = query(
                collection(db, 'inventory_items'),
                where('categoryId', '==', categoryId)
            );
            const itemsSnapshot = await getDocs(itemsQuery);

            if (!itemsSnapshot.empty) {
                throw new Error('No se puede eliminar una categoría que tiene items asociados.');
            }

            const categoryRef = doc(db, 'inventory_categories', categoryId);
            await deleteDoc(categoryRef);
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    };

    return {
        categories,
        loading,
        addCategory,
        updateCategory,
        deleteCategory,
    };
}
