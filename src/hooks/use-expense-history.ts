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
import { useAuth } from './use-auth';

interface DateRange {
    from: Date;
    to?: Date;
}

const BATCH_SIZE = 20;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function useExpenseHistory(dateRange: DateRange | null) {
    const { currentUser } = useAuth();
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
    }, [dateRange, currentUser?.role, currentUser?.username]);

    const getCacheKey = useCallback(() => {
        if (!dateRange || !dateRange.from || !currentUser) return null;
        const userScope = currentUser.role === 'admin'
            ? 'admin'
            : `${currentUser.role}:${currentUser.username}`;
        return `expenses_cache_${userScope}_${dateRange.from.getTime()}_${dateRange.to?.getTime() || 'none'}`;
    }, [dateRange, currentUser]);

    const fetchExpenses = useCallback(async (isInitialLoad: boolean = false) => {
        if (!dateRange || !dateRange.from || !currentUser) {
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

            // Limit employee queries to own expenses to avoid over-fetching
            if (currentUser.role !== 'admin') {
                constraints.splice(1, 0, where('createdBy', '==', currentUser.username));
            }

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

            let finalExpenses: Expense[] = [];
            if (isInitialLoad) {
                finalExpenses = fetchedExpenses;
                setExpenses(fetchedExpenses);
            } else {
                setExpenses(prev => {
                    finalExpenses = [...prev, ...fetchedExpenses];
                    return finalExpenses;
                });
            }

            // Update cursor and hasMore
            const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastDoc(lastVisible || null);
            const more = querySnapshot.docs.length === BATCH_SIZE;
            setHasMore(more);

            // Save to cache after successful fetch
            const cacheKey = getCacheKey();
            if (cacheKey) {
                localStorage.setItem(cacheKey, JSON.stringify({
                    data: finalExpenses,
                    hasMore: more,
                    timestamp: new Date().getTime()
                }));
            }

        } catch (err: any) {
            console.error("Error fetching expense history:", err);
            setError(err.message || "Error al cargar el historial de gastos");
        } finally {
            setLoading(false);
        }
    }, [dateRange, lastDoc, loading, hasMore, currentUser, getCacheKey]);

    // Initial load effect
    useEffect(() => {
        // Caching logic
        const cacheKey = getCacheKey();
        if (cacheKey) {
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    const now = new Date().getTime();
                    if (now - parsed.timestamp < CACHE_TTL_MS) {
                        setExpenses(parsed.data);
                        setHasMore(parsed.hasMore);
                    }
                } catch (e) {
                    console.error("Error parsing expenses cache", e);
                }
            }
        }

        // Always revalidate to avoid stale or incomplete data views.
        fetchExpenses(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, currentUser?.role, currentUser?.username]);

    const saveToCache = (data: Expense[], more: boolean) => {
        const cacheKey = getCacheKey();
        if (!cacheKey) return;
        localStorage.setItem(cacheKey, JSON.stringify({
            data,
            hasMore: more,
            timestamp: new Date().getTime()
        }));
    };

    const refresh = () => {
        // Clear cache on explicit refresh
        const cacheKey = getCacheKey();
        if (cacheKey) {
            localStorage.removeItem(cacheKey);
        }
        fetchExpenses(true);
    };

    const loadMore = () => {
        fetchExpenses(false);
    };

    const addOptimisticExpense = useCallback((expense: Expense) => {
        setExpenses(prev => {
            const updated = [expense, ...prev];
            saveToCache(updated, hasMore);
            return updated;
        });
    }, [dateRange, hasMore]);

    return { expenses, loading, error, loadMore, hasMore, refresh, addOptimisticExpense };
}
