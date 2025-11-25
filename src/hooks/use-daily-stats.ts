import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

export interface DailyStats {
    date: string;
    totalRevenue: number;
    totalExpenses: number;
    orderCount: number;
    paymentMethods: { [key: string]: number };
    categoryBreakdown: { [key: string]: number };
    updatedAt: number;
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
                const startId = format(dateRange.from, 'yyyy-MM-dd');
                const endId = format(dateRange.to, 'yyyy-MM-dd');

                const q = query(
                    collection(db, 'daily_stats'),
                    where('date', '>=', startId),
                    where('date', '<=', endId),
                    orderBy('date', 'asc')
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => doc.data() as DailyStats);
                setStats(data);
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
