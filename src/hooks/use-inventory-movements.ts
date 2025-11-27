"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    limit,
    startAfter,
    QueryDocumentSnapshot,
    DocumentData,
    addDoc,
    doc,
    updateDoc,
    runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { InventoryMovement, InventoryItem } from '@/types';

interface DateRange {
    from: Date;
    to?: Date;
}

const BATCH_SIZE = 20;

export function useInventoryMovements(itemId?: string, dateRange?: DateRange | null) {
    const [movements, setMovements] = useState<InventoryMovement[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Reset pagination when filters change
    useEffect(() => {
        setMovements([]);
        setLastDoc(null);
        setHasMore(true);
    }, [itemId, dateRange]);

    const fetchMovements = useCallback(async (isInitialLoad: boolean = false) => {
        // Prevent loading if already loading or no more data (unless it's initial load)
        if (loading || (!isInitialLoad && !hasMore)) return;

        setLoading(true);
        setError(null);

        try {
            const constraints: any[] = [
                orderBy('createdAt', 'desc'),
                limit(BATCH_SIZE)
            ];

            // Filter by item if specified
            if (itemId) {
                constraints.unshift(where('itemId', '==', itemId));
            }

            // Filter by date range if specified
            if (dateRange && dateRange.from) {
                const start = dateRange.from.getTime();
                constraints.splice(itemId ? 1 : 0, 0, where('createdAt', '>=', start));

                if (dateRange.to) {
                    const end = dateRange.to.getTime();
                    constraints.splice(itemId ? 2 : 1, 0, where('createdAt', '<=', end));
                }
            }

            // If loading more, start after the last document
            if (!isInitialLoad && lastDoc) {
                constraints.push(startAfter(lastDoc));
            }

            const q = query(collection(db, 'inventory_movements'), ...constraints);
            const querySnapshot = await getDocs(q);
            const fetchedMovements: InventoryMovement[] = [];

            querySnapshot.forEach((doc) => {
                fetchedMovements.push({ id: doc.id, ...doc.data() } as InventoryMovement);
            });

            if (isInitialLoad) {
                setMovements(fetchedMovements);
            } else {
                setMovements(prev => [...prev, ...fetchedMovements]);
            }

            // Update cursor and hasMore
            const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastDoc(lastVisible || null);
            setHasMore(querySnapshot.docs.length === BATCH_SIZE);

        } catch (err: any) {
            console.error("Error fetching inventory movements:", err);
            setError(err.message || "Error al cargar el historial de movimientos");
        } finally {
            setLoading(false);
        }
    }, [itemId, dateRange, lastDoc, loading, hasMore]);

    // Initial load effect
    useEffect(() => {
        fetchMovements(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemId, dateRange]);

    // Añadir movimiento y actualizar stock automáticamente
    const addMovement = async (
        movementData: Omit<InventoryMovement, 'id' | 'createdAt'>,
        item: InventoryItem,
        createLinkedExpense?: boolean
    ) => {
        try {
            await runTransaction(db, async (transaction) => {
                const itemRef = doc(db, 'inventory_items', item.id);

                // Calcular nuevo stock
                let newStock = item.currentStock;
                switch (movementData.type) {
                    case 'entrada':
                        newStock += movementData.quantity;
                        break;
                    case 'salida':
                        newStock -= movementData.quantity;
                        if (newStock < 0) {
                            throw new Error('No hay suficiente stock para registrar esta salida.');
                        }
                        break;
                    case 'ajuste':
                        newStock = movementData.quantity; // Ajuste absoluto
                        break;
                }

                // Actualizar costo promedio ponderado solo en entradas con costo
                let updateData: any = {
                    currentStock: newStock,
                    updatedAt: Date.now(),
                };

                if (movementData.type === 'entrada' && movementData.costPerUnit && movementData.costPerUnit > 0) {
                    const oldValue = item.currentStock * item.costPerUnit;
                    const newValue = movementData.quantity * movementData.costPerUnit;
                    const weightedAvgCost = (oldValue + newValue) / newStock;
                    updateData.costPerUnit = weightedAvgCost;
                    updateData.lastPurchaseDate = Date.now();
                }

                // Actualizar el item
                transaction.update(itemRef, updateData);

                // Crear el movimiento
                const movementRef = collection(db, 'inventory_movements');
                const movement = {
                    ...movementData,
                    createdAt: Date.now(),
                };
                transaction.set(doc(movementRef), movement);

                // Si se debe crear un gasto vinculado
                if (createLinkedExpense && movementData.type === 'entrada' && movementData.totalCost) {
                    const expenseRef = collection(db, 'expenses');
                    const expense = {
                        amount: movementData.totalCost,
                        category: item.categoryName,
                        source: 'caja', // Por defecto, puede ser modificado
                        createdAt: Date.now(),
                        createdBy: movementData.createdBy,
                        notes: `Compra de ${item.name} - ${movementData.quantity} ${item.unit}`,
                    };
                    transaction.set(doc(expenseRef), expense);
                }
            });

            // Refrescar movimientos después de agregar
            await fetchMovements(true);
        } catch (error) {
            console.error('Error adding movement:', error);
            throw error;
        }
    };

    const loadMore = () => {
        fetchMovements(false);
    };

    return {
        movements,
        loading,
        error,
        loadMore,
        hasMore,
        addMovement,
    };
}
