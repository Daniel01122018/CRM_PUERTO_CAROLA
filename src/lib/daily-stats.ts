import { doc, setDoc, updateDoc, increment, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import type { Order, Expense } from '@/types';

export const updateDailyStats = async (date: Date, data: {
    revenue?: number;
    expenses?: number;
    orderCount?: number;
    paymentMethods?: { [key: string]: number };
    expensesBySource?: {
        caja?: number;
        caja_chica?: number;
    };
    categoryBreakdown?: { [key: string]: number };
    itemSales?: { [itemId: string]: { name: string; quantity: number; revenue: number } };
    serviceTypeBreakdown?: {
        mesa: { count: number; revenue: number };
        llevar: { count: number; revenue: number };
    };
    hourlyOrders?: { [hour: string]: number };
}) => {
    const dateId = format(date, 'yyyy-MM-dd');
    const statsRef = doc(db, 'daily_stats', dateId);

    console.log('[updateDailyStats] Called with:', { dateId, data });

    try {
        await runTransaction(db, async (transaction) => {
            const statsDoc = await transaction.get(statsRef);

            if (!statsDoc.exists()) {
                console.log('[updateDailyStats] Creating new stats document for', dateId);
                transaction.set(statsRef, {
                    date: dateId,
                    totalRevenue: data.revenue || 0,
                    totalExpenses: data.expenses || 0,
                    orderCount: data.orderCount || 0,
                    paymentMethods: data.paymentMethods || {},
                    expensesBySource: data.expensesBySource || { caja: 0, caja_chica: 0 },
                    categoryBreakdown: data.categoryBreakdown || {},
                    itemSales: data.itemSales || {},
                    serviceTypeBreakdown: data.serviceTypeBreakdown || { mesa: { count: 0, revenue: 0 }, llevar: { count: 0, revenue: 0 } },
                    hourlyOrders: data.hourlyOrders || {},
                    updatedAt: Date.now()
                });
            } else {
                console.log('[updateDailyStats] Updating existing stats document for', dateId);
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

                if (data.expensesBySource) {
                    const currentSources = currentData.expensesBySource || { caja: 0, caja_chica: 0 };
                    if (data.expensesBySource.caja !== undefined) {
                        updates['expensesBySource.caja'] = (currentSources.caja || 0) + data.expensesBySource.caja;
                    }
                    if (data.expensesBySource.caja_chica !== undefined) {
                        updates['expensesBySource.caja_chica'] = (currentSources.caja_chica || 0) + data.expensesBySource.caja_chica;
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

                if (data.serviceTypeBreakdown) {
                    const currentService = currentData.serviceTypeBreakdown || { mesa: { count: 0, revenue: 0 }, llevar: { count: 0, revenue: 0 } };

                    if (data.serviceTypeBreakdown.mesa.count !== 0 || data.serviceTypeBreakdown.mesa.revenue !== 0) {
                        updates['serviceTypeBreakdown.mesa.count'] = (currentService.mesa?.count || 0) + data.serviceTypeBreakdown.mesa.count;
                        updates['serviceTypeBreakdown.mesa.revenue'] = (currentService.mesa?.revenue || 0) + data.serviceTypeBreakdown.mesa.revenue;
                    }

                    if (data.serviceTypeBreakdown.llevar.count !== 0 || data.serviceTypeBreakdown.llevar.revenue !== 0) {
                        updates['serviceTypeBreakdown.llevar.count'] = (currentService.llevar?.count || 0) + data.serviceTypeBreakdown.llevar.count;
                        updates['serviceTypeBreakdown.llevar.revenue'] = (currentService.llevar?.revenue || 0) + data.serviceTypeBreakdown.llevar.revenue;
                    }
                }

                if (data.hourlyOrders) {
                    const currentHourly = currentData.hourlyOrders || {};
                    for (const [hour, count] of Object.entries(data.hourlyOrders)) {
                        updates[`hourlyOrders.${hour}`] = (currentHourly[hour] || 0) + count;
                    }
                }

                console.log('[updateDailyStats] Prepared updates:', updates);
                transaction.update(statsRef, updates);
            }
        });
        console.log('[updateDailyStats] Transaction completed successfully');
    } catch (error) {
        console.error("[updateDailyStats] ERROR:", error);
        // Re-throw the error so callers know it failed
        throw error;
    }
};
