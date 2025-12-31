import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';

import { DailyStats } from '@/types';

// Global cache to persist data across re-renders and navigation
// Key: YYYY-MM-DD, Value: DailyStats
const globalCache = new Map<string, DailyStats>();

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
                const missingKeys = neededKeys.filter(key => !globalCache.has(key));

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
                // Optimization: Find the min and max of missing keys to query a contiguous range
                // This covers the common case of extending a date range (e.g. "Last 7 days" -> "Last 30 days")
                missingKeys.sort(); // String sort yyyy-MM-dd works for dates
                const fetchStart = missingKeys[0];
                const fetchEnd = missingKeys[missingKeys.length - 1];

                // console.log(`Cache miss. Fetching from ${fetchStart} to ${fetchEnd}`);

                const q = query(
                    collection(db, 'daily_stats'),
                    where('date', '>=', fetchStart),
                    where('date', '<=', fetchEnd),
                    orderBy('date', 'asc')
                );

                const snapshot = await getDocs(q);

                // Update Cache with new data
                // Note: If a day has NO stats in DB, map won't have it.
                // We should handle "cached but empty" to avoid infinite re-fetching for empty days?
                // For simplicity now: We update what we found.
                // Improvement: We should mark "attempted" keys even if empty to avoid re-fetching non-existent data? 
                // Let's rely on what we get back.

                snapshot.docs.forEach(doc => {
                    const data = doc.data() as DailyStats;
                    globalCache.set(data.date, data);
                });

                // 4. Re-construct the full result set from cache (now updated)
                // Note: missing keys that were NOT found in DB will simply be filtered out or missing.
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
    }, [dateRange]);

    return { stats, loading };
}
