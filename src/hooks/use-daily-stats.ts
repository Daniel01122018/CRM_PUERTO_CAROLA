import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, eachDayOfInterval } from 'date-fns';

import { DailyStats } from '@/types';

// Global cache to persist data across re-renders and navigation
// Key: YYYY-MM-DD, Value: DailyStats
const globalCache = new Map<string, DailyStats>();
const CACHE_TTL_MS = 60 * 1000;

function isStale(data: DailyStats | undefined) {
    if (!data?.updatedAt) return true;
    return Date.now() - data.updatedAt > CACHE_TTL_MS;
}

export function useDailyStats(dateRange: { from: Date; to: Date } | undefined) {
    const [stats, setStats] = useState<DailyStats[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!dateRange?.from || !dateRange?.to) {
            setStats([]);
            return;
        }

        const fetchStats = async () => {
            setLoading(true);
            try {
                // 1. Determine all days needed
                const daysNeeded = eachDayOfInterval({
                    start: dateRange.from,
                    end: dateRange.to
                });

                const neededKeys = daysNeeded.map(d => format(d, 'yyyy-MM-dd'));
                const missingKeys = neededKeys.filter((key) => {
                    const cached = globalCache.get(key);
                    return !cached || isStale(cached);
                });

                // 2. If we have everything, return from cache immediately
                if (missingKeys.length === 0) {
                    const cachedData = neededKeys
                        .map(key => globalCache.get(key)!)
                        .filter(Boolean); // Safety check
                    setStats(cachedData);
                    setLoading(false);
                    return;
                }

                // 3. If we are missing data, fetch ONLY the necessary range
                missingKeys.sort(); // String sort yyyy-MM-dd works for dates
                const fetchStart = missingKeys[0];
                const fetchEnd = missingKeys[missingKeys.length - 1];

                const q = query(
                    collection(db, 'daily_stats'),
                    where('date', '>=', fetchStart),
                    where('date', '<=', fetchEnd),
                    orderBy('date', 'asc')
                );

                const snapshot = await getDocs(q);

                // Update Cache with new data
                snapshot.docs.forEach(doc => {
                    const data = doc.data() as DailyStats;
                    globalCache.set(data.date, data);
                });

                // 4. Re-construct the full result set from cache (now updated)
                const finalData = neededKeys
                    .map(key => globalCache.get(key))
                    .filter((item): item is DailyStats => !!item);

                setStats(finalData);

            } catch (error) {
                console.error("Error fetching daily stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [dateRange?.from?.getTime(), dateRange?.to?.getTime()]); // Use getTime() for stable comparison



    useEffect(() => {
        if (!dateRange?.from || !dateRange?.to) return;

        const intervalId = window.setInterval(async () => {
            try {
                const q = query(
                    collection(db, 'daily_stats'),
                    where('date', '>=', format(dateRange.from, 'yyyy-MM-dd')),
                    where('date', '<=', format(dateRange.to, 'yyyy-MM-dd')),
                    orderBy('date', 'asc')
                );

                const snapshot = await getDocs(q);
                snapshot.docs.forEach(doc => {
                    const data = doc.data() as DailyStats;
                    globalCache.set(data.date, data);
                });

                const daysNeeded = eachDayOfInterval({
                    start: dateRange.from,
                    end: dateRange.to
                });

                const neededKeys = daysNeeded.map(d => format(d, 'yyyy-MM-dd'));
                const latestData = neededKeys
                    .map(key => globalCache.get(key))
                    .filter((item): item is DailyStats => !!item);

                setStats(latestData);
            } catch (error) {
                console.error('Error polling daily stats:', error);
            }
        }, CACHE_TTL_MS);

        return () => window.clearInterval(intervalId);
    }, [dateRange?.from?.getTime(), dateRange?.to?.getTime()]);

    return { stats, loading };
}

