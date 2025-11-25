"use client";

import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Expense } from '@/types';

interface DateRange {
    from: Date;
    to?: Date;
}

export function useExpenseHistory(dateRange: DateRange | null) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchHistory() {
            if (!dateRange || !dateRange.from) {
                setExpenses([]);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const start = dateRange.from.getTime();

                let q;
                if (dateRange.to) {
                    const end = dateRange.to.getTime();
                    q = query(
                        collection(db, 'expenses'),
                        where('createdAt', '>=', start),
                        where('createdAt', '<=', end),
                        orderBy('createdAt', 'desc')
                    );
                } else {
                    q = query(
                        collection(db, 'expenses'),
                        where('createdAt', '>=', start),
                        orderBy('createdAt', 'desc')
                    );
                }

                const querySnapshot = await getDocs(q);
                const fetchedExpenses: Expense[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedExpenses.push({ id: doc.id, ...doc.data() } as Expense);
                });
                setExpenses(fetchedExpenses);
            } catch (err: any) {
                console.error("Error fetching expense history:", err);
                setError(err.message || "Error al cargar el historial de gastos");
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [dateRange]);

    return { expenses, loading, error };
}
