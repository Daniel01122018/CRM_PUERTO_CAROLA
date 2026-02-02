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
import type { Order } from '@/types';

interface DateRange {
    from: Date;
    to?: Date;
}

interface CachedPage {
    orders: Order[];
    timestamp: number;
}

interface OrderHistoryCache {
    [dateRangeKey: string]: {
        pages: CachedPage[];
        lastUpdated: number;
    };
}

const CACHE_KEY = 'order-history-cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const PAGE_SIZE = 30;

// Helper to generate cache key from date range
function getCacheKey(dateRange: DateRange | null): string {
    if (!dateRange || !dateRange.from) return 'no-range';
    const from = dateRange.from.getTime();
    const to = dateRange.to?.getTime() || from;
    return `${from}-${to}`;
}

// Load cache from localStorage
function loadCache(): OrderHistoryCache {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.error('Error loading order history cache:', error);
    }
    return {};
}

// Save cache to localStorage
function saveCache(cache: OrderHistoryCache) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.error('Error saving order history cache:', error);
    }
}

export function useOrderHistory(dateRange: DateRange | null) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [currentPage, setCurrentPage] = useState(0);

    // Reset state when date range changes
    useEffect(() => {
        setOrders([]);
        setLastVisible(null);
        setCurrentPage(0);
        setHasMore(true);
        setError(null);
    }, [dateRange?.from?.getTime(), dateRange?.to?.getTime()]);

    const fetchPage = useCallback(async (pageNumber: number, cursor: QueryDocumentSnapshot<DocumentData> | null = null) => {
        if (!dateRange || !dateRange.from) {
            setOrders([]);
            setHasMore(false);
            return;
        }

        setLoading(true);
        setError(null);

        const cacheKey = getCacheKey(dateRange);
        const cache = loadCache();

        // Check cache first
        if (cache[cacheKey]) {
            const cachedData = cache[cacheKey];
            const isCacheValid = (Date.now() - cachedData.lastUpdated) < CACHE_TTL;

            if (isCacheValid && cachedData.pages[pageNumber]) {
                // Load from cache
                const page = cachedData.pages[pageNumber];
                const allOrders = cachedData.pages.slice(0, pageNumber + 1).flatMap(p => p.orders);
                setOrders(allOrders);
                setHasMore(page.orders.length === PAGE_SIZE);
                setLoading(false);
                return;
            }
        }

        // Fetch from Firestore
        try {
            const start = dateRange.from.getTime();
            const end = dateRange.to ? dateRange.to.getTime() : Date.now();

            let q = query(
                collection(db, 'orders'),
                where('createdAt', '>=', start),
                where('createdAt', '<=', end),
                orderBy('createdAt', 'desc'),
                limit(PAGE_SIZE)
            );

            if (cursor) {
                q = query(
                    collection(db, 'orders'),
                    where('createdAt', '>=', start),
                    where('createdAt', '<=', end),
                    orderBy('createdAt', 'desc'),
                    startAfter(cursor),
                    limit(PAGE_SIZE)
                );
            }

            const querySnapshot = await getDocs(q);
            const fetchedOrders: Order[] = [];

            querySnapshot.forEach((doc) => {
                fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
            });

            // Update cache
            if (!cache[cacheKey]) {
                cache[cacheKey] = { pages: [], lastUpdated: Date.now() };
            }
            cache[cacheKey].pages[pageNumber] = {
                orders: fetchedOrders,
                timestamp: Date.now()
            };
            cache[cacheKey].lastUpdated = Date.now();
            saveCache(cache);

            // Update state
            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastVisible(lastDoc || null);
            setHasMore(fetchedOrders.length === PAGE_SIZE);

            // Append to existing orders if loading more, otherwise replace
            if (pageNumber === 0) {
                setOrders(fetchedOrders);
            } else {
                setOrders(prev => [...prev, ...fetchedOrders]);
            }

        } catch (err: any) {
            console.error('Error fetching order history:', err);
            setError(err.message || 'Error al cargar el historial');
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    // Initial load
    useEffect(() => {
        fetchPage(0, null);
    }, [fetchPage]);

    // Load more function
    const loadMore = useCallback(() => {
        if (!loading && hasMore && lastVisible) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchPage(nextPage, lastVisible);
        }
    }, [loading, hasMore, lastVisible, currentPage, fetchPage]);

    // Refresh function (clears cache and reloads)
    const refresh = useCallback(() => {
        const cacheKey = getCacheKey(dateRange);
        const cache = loadCache();
        delete cache[cacheKey];
        saveCache(cache);

        setOrders([]);
        setLastVisible(null);
        setCurrentPage(0);
        setHasMore(true);
        fetchPage(0, null);
    }, [dateRange, fetchPage]);

    return { orders, loading, error, hasMore, loadMore, refresh };
}
