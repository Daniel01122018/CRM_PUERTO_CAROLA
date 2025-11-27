"use client";

import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export interface WeeklyStat {
    date: string; // YYYY-MM-DD
    totalRevenue: number;
}

export function useWeeklyStats() {
    const [stats, setStats] = useState<WeeklyStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchWeeklyStats() {
            setLoading(true);
            try {
                const today = new Date();
                const sevenDaysAgo = subDays(today, 6); // Include today, so go back 6 days

                const startStr = format(sevenDaysAgo, 'yyyy-MM-dd');
                const endStr = format(today, 'yyyy-MM-dd');

                const q = query(
                    collection(db, 'daily_stats'),
                    where('date', '>=', startStr),
                    where('date', '<=', endStr)
                );

                const querySnapshot = await getDocs(q);
                const fetchedStats: WeeklyStat[] = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedStats.push({
                        date: data.date,
                        totalRevenue: data.totalRevenue || 0
                    });
                });

                setStats(fetchedStats);
            } catch (error) {
                console.error("Error fetching weekly stats:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchWeeklyStats();
    }, []);

    return { stats, loading };
}
