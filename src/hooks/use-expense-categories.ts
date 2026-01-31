"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    doc,
    onSnapshot,
    updateDoc,
    getDoc,
    deleteField
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import type { ExpenseCategoryConfig, ExpenseCategoriesDocument } from '@/types';
import { useToast } from './use-toast';

export function useExpenseCategories() {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [categories, setCategories] = useState<ExpenseCategoryConfig[]>([]);
    const [loading, setLoading] = useState(true);

    // Subscribe to the single config document
    useEffect(() => {
        if (!currentUser) {
            setCategories([]);
            setLoading(false);
            return;
        }

        const docRef = doc(db, 'expense_categories', 'config');

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as ExpenseCategoriesDocument;
                const cats: ExpenseCategoryConfig[] = Object.entries(data.categories || {}).map(([name, config]) => ({
                    id: name, // Use name as ID for compatibility
                    name,
                    ...config
                }));
                // Sort alphabetically by name
                cats.sort((a, b) => a.name.localeCompare(b.name));
                setCategories(cats);
            } else {
                setCategories([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching expense categories:", error);
            setCategories([]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const addCategory = useCallback(async (name: string, requiresNote?: boolean) => {
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error("Solo administradores pueden crear categorías.");
        }

        // Check for duplicates
        if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            throw new Error("Esta categoría ya existe.");
        }

        const docRef = doc(db, 'expense_categories', 'config');

        // Add new category to the map
        await updateDoc(docRef, {
            [`categories.${name}`]: {
                requiresNote: !!requiresNote,
                createdAt: Date.now(),
                createdBy: currentUser.username
            },
            updatedAt: Date.now()
        });
    }, [currentUser, categories]);

    const deleteCategory = useCallback(async (id: string) => {
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error("Solo administradores pueden eliminar categorías.");
        }

        const docRef = doc(db, 'expense_categories', 'config');

        // Remove category from the map using deleteField()
        await updateDoc(docRef, {
            [`categories.${id}`]: deleteField(),
            updatedAt: Date.now()
        });
    }, [currentUser]);

    const updateCategory = useCallback(async (id: string, name: string) => {
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error("Solo administradores pueden editar categorías.");
        }

        const docRef = doc(db, 'expense_categories', 'config');

        // If the name is changing, we need to delete the old key and add new one
        if (id !== name) {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as ExpenseCategoriesDocument;
                const oldConfig = data.categories[id];

                if (oldConfig) {
                    await updateDoc(docRef, {
                        [`categories.${id}`]: deleteField(),
                        [`categories.${name}`]: {
                            ...oldConfig,
                            updatedAt: Date.now()
                        },
                        updatedAt: Date.now()
                    });
                }
            }
        } else {
            // Just update the timestamp if name didn't change
            await updateDoc(docRef, {
                [`categories.${id}.updatedAt`]: Date.now(),
                updatedAt: Date.now()
            });
        }
    }, [currentUser]);

    return {
        categories,
        loading,
        addCategory,
        deleteCategory,
        updateCategory
    };
}
