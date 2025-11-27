import { doc, setDoc, updateDoc, increment, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import type { Order, Expense } from '@/types';

export const updateDailyStats = async (date: Date, data: {
    revenue?: number;
    expenses?: number;
    orderCount?: number;
    paymentMethods?: { [key: string]: number };
    categoryBreakdown?: { [key: string]: number };
    itemSales?: { [itemId: string]: { name: string; quantity: number; revenue: number } };
}) => {
    const dateId = format(date, 'yyyy-MM-dd');
    const statsRef = doc(db, 'daily_stats', dateId);

    try {
        await runTransaction(db, async (transaction) => {
            const statsDoc = await transaction.get(statsRef);

            if (!statsDoc.exists()) {
                transaction.set(statsRef, {
                    date: dateId,
                    totalRevenue: data.revenue || 0,
                    totalExpenses: data.expenses || 0,
                    orderCount: data.orderCount || 0,
                    paymentMethods: data.paymentMethods || {},
                    categoryBreakdown: data.categoryBreakdown || {},
                    itemSales: data.itemSales || {},
                    updatedAt: Date.now()
                });
            } else {
                const currentData = statsDoc.data();

                // Prepare updates
                const updates: any = {
                    updatedAt: Date.now()
                };

                if (data.revenue !== undefined) updates.totalRevenue = increment(data.revenue);
                if (data.expenses !== undefined) updates.totalExpenses = increment(data.expenses);
                if (data.orderCount !== undefined) updates.orderCount = increment(data.orderCount);

                // Merge maps manually
                if (data.paymentMethods) {
                    const currentMethods = currentData.paymentMethods || {};
                    for (const [method, amount] of Object.entries(data.paymentMethods)) {
                        updates[`paymentMethods.${method}`] = (currentMethods[method] || 0) + amount;
                    }
                }

                if (data.categoryBreakdown) {
                    const currentCategories = currentData.categoryBreakdown || {};
                    for (const [cat, amount] of Object.entries(data.categoryBreakdown)) {
                        updates[`categoryBreakdown.${cat}`] = (currentCategories[cat] || 0) + amount;
                    }
                }

                if (data.itemSales) {
                    const currentItems = currentData.itemSales || {};
                    for (const [itemId, info] of Object.entries(data.itemSales)) {
                        const currentItem = currentItems[itemId] || { name: info.name, quantity: 0, revenue: 0 };
                        updates[`itemSales.${itemId}`] = {
                            name: info.name,
                            quantity: currentItem.quantity + info.quantity,
                            revenue: currentItem.revenue + info.revenue
                        };
                    }
                }

                transaction.update(statsRef, updates);
            }
        });
    } catch (error) {
        console.error("Error updating daily stats:", error);
    }
};
