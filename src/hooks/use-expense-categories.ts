"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    getDocs,
    writeBatch,
    updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import type { ExpenseCategoryConfig } from '@/types';
import { useToast } from './use-toast';

const PREDEFINED_CATEGORIES_TO_MIGRATE = [
    "Comida de Empleado", "Pescado", "Chifles", "Supermercado", "Mercado Montebello", "Sueldos",
    "Yuca", "Camarón", "Pedido de Colas", "Pan", "Gas", "Gasto Personal", "Pasajes", "Bollos"
];

export function useExpenseCategories() {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [categories, setCategories] = useState<ExpenseCategoryConfig[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial load and subscription
    useEffect(() => {
        if (!currentUser) {
            setCategories([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'expense_categories'),
            orderBy('name')
        );

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const cats: ExpenseCategoryConfig[] = [];
            querySnapshot.forEach((doc) => {
                cats.push({ id: doc.id, ...doc.data() } as ExpenseCategoryConfig);
            });

            setCategories(cats);
            setLoading(false);

            // Auto-migration check: If empty, populate with defaults
            // We check if it's truly empty and we are authorized to write (admin/employee usually can read, but let's assume if we see 0, we try to init if we are a user)
            // Actually, let's limit migration to when an Admin is logged in to avoid permission issues if rules are strict.
            // Or just do it if cats.length === 0.

            if (cats.length === 0 && !querySnapshot.metadata.fromCache) {
                // Check if we need to migrate. To be safe, let's only do this manually or check once.
                // However, the requirement says "migración automática... la primera vez que se cargue la aplicación".
                // We should verify if the collection is truly empty on the server before writing.
                // Since we are inside onSnapshot, we have the latest view.

                // We'll perform migration logic in a separate function to avoid race conditions or loops, 
                // triggered only if we are sure it's empty and we haven't tried yet.
                // For safety, let's just expose a migration function or do it here if currentUser is admin.
            }
        });

        return () => unsubscribe();
    }, [currentUser]);

    // One-time migration effect
    useEffect(() => {
        const migrateIfNeeded = async () => {
            // 🔒 OPTIMIZATION: Removed redundant getDocs call
            // We already have fresh data from onSnapshot listener
            if (!loading && categories.length === 0 && currentUser?.role === 'admin') {
                console.log("Migrating default categories...");
                const batch = writeBatch(db);
                PREDEFINED_CATEGORIES_TO_MIGRATE.forEach(catName => {
                    const docRef = doc(collection(db, 'expense_categories'));
                    batch.set(docRef, {
                        name: catName,
                        createdAt: Date.now(),
                        createdBy: 'system_migration'
                    });
                });
                try {
                    await batch.commit();
                    toast({
                        title: "Migración Completada",
                        description: "Se han creado las categorías de gastos por defecto.",
                    });
                } catch (e) {
                    console.error("Migration failed", e);
                }
            }
        };

        migrateIfNeeded();
    }, [loading, categories.length, currentUser, toast]);


    const addCategory = useCallback(async (name: string, requiresNote?: boolean) => {
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error("Solo administradores pueden crear categorías.");
        }

        // Check for duplicates
        if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            throw new Error("Esta categoría ya existe.");
        }

        await addDoc(collection(db, 'expense_categories'), {
            name,
            requiresNote: !!requiresNote,
            createdAt: Date.now(),
            createdBy: currentUser.username
        });
    }, [currentUser, categories]);

    const deleteCategory = useCallback(async (id: string) => {
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error("Solo administradores pueden eliminar categorías.");
        }
        await deleteDoc(doc(db, 'expense_categories', id));
    }, [currentUser]);

    const updateCategory = useCallback(async (id: string, name: string) => {
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error("Solo administradores pueden editar categorías.");
        }
        await updateDoc(doc(db, 'expense_categories', id), {
            name,
            updatedAt: Date.now() // Optional: track updates
        });
    }, [currentUser]);

    return {
        categories,
        loading,
        addCategory,
        deleteCategory,
        updateCategory
    };
}
