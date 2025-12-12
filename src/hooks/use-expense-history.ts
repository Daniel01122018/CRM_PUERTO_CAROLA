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
    DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Expense } from '@/types';

interface DateRange {
    from: Date;
    to?: Date;
}

const BATCH_SIZE = 20;

export function useExpenseHistory(dateRange: DateRange | null) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Reset pagination when date range changes
    useEffect(() => {
        setExpenses([]);
        setLastDoc(null);
        setHasMore(true);
    }, [dateRange]);

    const fetchExpenses = useCallback(async (isInitialLoad: boolean = false) => {
        if (!dateRange || !dateRange.from) {
            setExpenses([]);
            return;
        }

        // Prevent loading if already loading or no more data (unless it's initial load)
        if (loading || (!isInitialLoad && !hasMore)) return;

        setLoading(true);
        setError(null);

        try {
            const start = dateRange.from.getTime();
            let q;

            const constraints: any[] = [
                where('createdAt', '>=', start),
                orderBy('createdAt', 'desc'),
                limit(BATCH_SIZE)
            ];

            if (dateRange.to) {
                const end = dateRange.to.getTime();
                constraints.splice(1, 0, where('createdAt', '<=', end));
            }

            // If loading more, start after the last document
            if (!isInitialLoad && lastDoc) {
                constraints.push(startAfter(lastDoc));
            }

            q = query(collection(db, 'expenses'), ...constraints);

            const querySnapshot = await getDocs(q);
            const fetchedExpenses: Expense[] = [];

            querySnapshot.forEach((doc) => {
                fetchedExpenses.push({ id: doc.id, ...doc.data() } as Expense);
            });

            if (isInitialLoad) {
                setExpenses(fetchedExpenses);
            } else {
                setExpenses(prev => [...prev, ...fetchedExpenses]);
            }

            // Update cursor and hasMore
            const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastDoc(lastVisible || null);
            setHasMore(querySnapshot.docs.length === BATCH_SIZE);

        } catch (err: any) {
            console.error("Error fetching expense history:", err);
            setError(err.message || "Error al cargar el historial de gastos");
        } finally {
            setLoading(false);
        }
    }, [dateRange, lastDoc, loading, hasMore]);

    // Initial load effect
    useEffect(() => {
        fetchExpenses(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    const refresh = () => {
        fetchExpenses(true);
    };

    const loadMore = () => {
        fetchExpenses(false);
    };

    return { expenses, loading, error, loadMore, hasMore, refresh };
}
