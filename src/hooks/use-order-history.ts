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
import type { Order } from '@/types';

interface DateRange {
    from: Date;
    to?: Date;
}

export function useOrderHistory(dateRange: DateRange | null) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function fetchHistory() {
        if (!dateRange || !dateRange.from) {
            setOrders([]);
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
                    collection(db, 'orders'),
                    where('createdAt', '>=', start),
                    where('createdAt', '<=', end),
                    orderBy('createdAt', 'desc')
                );
            } else {
                q = query(
                    collection(db, 'orders'),
                    where('createdAt', '>=', start),
                    orderBy('createdAt', 'desc')
                );
            }

            const querySnapshot = await getDocs(q);
            const fetchedOrders: Order[] = [];
            querySnapshot.forEach((doc) => {
                fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
            });
            setOrders(fetchedOrders);
        } catch (err: any) {
            console.error("Error fetching order history:", err);
            setError(err.message || "Error al cargar el historial");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchHistory();
    }, [dateRange]);

    return { orders, loading, error, refresh: fetchHistory };
}
