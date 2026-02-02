import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import type { DailyStats } from '@/types';

/**
 * Hook to fetch today's daily stats for KPI calculations
 * Returns aggregated data instead of requiring all orders to be loaded
 */
export function useTodayStats() {
    const [stats, setStats] = useState<DailyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTodayStats = async () => {
            setLoading(true);
            setError(null);

            try {
                const todayKey = format(new Date(), 'yyyy-MM-dd');
                const statsRef = doc(db, 'daily_stats', todayKey);
                const statsDoc = await getDoc(statsRef);

                if (statsDoc.exists()) {
                    setStats(statsDoc.data() as DailyStats);
                } else {
                    // No stats for today yet (no orders completed)
                    setStats({
                        date: todayKey,
                        totalRevenue: 0,
                        totalExpenses: 0,
                        orderCount: 0,
                        paymentMethods: {},
                        categoryBreakdown: {},
                    });
                }
            } catch (err: any) {
                console.error('Error fetching today stats:', err);
                setError(err.message || 'Error al cargar estadísticas');
            } finally {
                setLoading(false);
            }
        };

        fetchTodayStats();

        // Refetch every minute to keep KPIs updated
        const interval = setInterval(fetchTodayStats, 60000);

        return () => clearInterval(interval);
    }, []);

    return { stats, loading, error };
}
