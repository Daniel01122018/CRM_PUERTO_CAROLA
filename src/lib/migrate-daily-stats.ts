import { collection, getDocs, doc, writeBatch, Timestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import type { Order, Expense } from '@/types';
import { ALL_MENU_ITEMS } from '@/lib/data';

export const migrateDailyStats = async (startDate?: Date) => {
    console.log("Starting daily stats migration...", startDate ? `from ${startDate.toISOString()}` : "all time");

    try {
        // 1. Fetch all completed orders (filtered if startDate is provided)
        let ordersQuery;
        if (startDate) {
            ordersQuery = query(
                collection(db, 'orders'),
                where('createdAt', '>=', startDate.getTime())
            );
        } else {
            ordersQuery = collection(db, 'orders');
        }

        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs
            .map(d => d.data() as Order)
            .filter(o => o.status === 'completed');

        // 2. Fetch all expenses (filtered if startDate is provided)
        let expensesQuery;
        if (startDate) {
            expensesQuery = query(
                collection(db, 'expenses'),
                where('createdAt', '>=', startDate.getTime())
            );
        } else {
            expensesQuery = collection(db, 'expenses');
        }

        const expensesSnapshot = await getDocs(expensesQuery);
        const expenses = expensesSnapshot.docs.map(d => d.data() as Expense);

        // 3. Fetch all menu items
        const menuItemsSnapshot = await getDocs(collection(db, 'menu_items'));
        const firestoreMenuItems = menuItemsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

        const getItemName = (id: string | number) => {
            const fsItem = firestoreMenuItems.find(i => i.id === id.toString() || i.oldId === id);
            if (fsItem) return fsItem.name;

            const staticItem = ALL_MENU_ITEMS.find(i => i.id === id);
            if (staticItem) return staticItem.nombre;

            // Try to find in variants
            for (const i of ALL_MENU_ITEMS as any[]) {
                if (i.variants) {
                    const v = i.variants.find((v: any) => v.id === id);
                    if (v) return `${i.nombre} ${v.nombre}`;
                }
            }
            return "Item Desconocido";
        };

        const getItemPrice = (id: string | number) => {
            const fsItem = firestoreMenuItems.find(i => i.id === id.toString() || i.oldId === id);
            if (fsItem) return fsItem.price;

            const staticItem = ALL_MENU_ITEMS.find(i => i.id === id);
            if (staticItem) return staticItem.precio;
            // Try to find in variants
            for (const i of ALL_MENU_ITEMS as any[]) {
                if (i.variants) {
                    const v = i.variants.find((v: any) => v.id === id);
                    if (v) return v.precio;
                }
            }
            return 0;
        };


        // 4. Aggregate data by date
        const statsByDate: { [date: string]: any } = {};

        // Process Orders
        orders.forEach(order => {
            const date = format(new Date(order.createdAt), 'yyyy-MM-dd');

            if (!statsByDate[date]) {
                statsByDate[date] = {
                    date,
                    totalRevenue: 0,
                    totalExpenses: 0,
                    orderCount: 0,
                    paymentMethods: {},
                    categoryBreakdown: {},
                    itemSales: {},
                    serviceTypeBreakdown: {
                        mesa: { count: 0, revenue: 0 },
                        llevar: { count: 0, revenue: 0 }
                    },
                    hourlyOrders: {},
                    updatedAt: Date.now()
                };
            }

            statsByDate[date].totalRevenue += order.total;
            statsByDate[date].orderCount += 1;

            // Service Type Breakdown
            const isTakeaway = order.tableId === 'takeaway';
            if (isTakeaway) {
                statsByDate[date].serviceTypeBreakdown.llevar.count += 1;
                statsByDate[date].serviceTypeBreakdown.llevar.revenue += order.total;
            } else {
                statsByDate[date].serviceTypeBreakdown.mesa.count += 1;
                statsByDate[date].serviceTypeBreakdown.mesa.revenue += order.total;
            }

            // Hourly Orders
            const hour = new Date(order.createdAt).getHours().toString();
            statsByDate[date].hourlyOrders[hour] = (statsByDate[date].hourlyOrders[hour] || 0) + 1;

            const paymentMethod = order.paymentMethod || 'efectivo';
            statsByDate[date].paymentMethods[paymentMethod] = (statsByDate[date].paymentMethods[paymentMethod] || 0) + order.total;

            // Process Items
            if (order.items) {
                order.items.forEach(item => {
                    const itemId = item.menuItemId.toString();
                    const quantity = item.quantity;
                    const price = item.customPrice || getItemPrice(item.menuItemId);
                    const revenue = price * quantity;
                    const name = getItemName(item.menuItemId);

                    if (!statsByDate[date].itemSales[itemId]) {
                        statsByDate[date].itemSales[itemId] = {
                            name,
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    statsByDate[date].itemSales[itemId].quantity += quantity;
                    statsByDate[date].itemSales[itemId].revenue += revenue;
                });
            }
        });

        // Process Expenses
        expenses.forEach(expense => {
            const date = format(new Date(expense.createdAt), 'yyyy-MM-dd');

            if (!statsByDate[date]) {
                statsByDate[date] = {
                    date,
                    totalRevenue: 0,
                    totalExpenses: 0,
                    orderCount: 0,
                    paymentMethods: {},
                    categoryBreakdown: {},
                    itemSales: {},
                    serviceTypeBreakdown: {
                        mesa: { count: 0, revenue: 0 },
                        llevar: { count: 0, revenue: 0 }
                    },
                    hourlyOrders: {},
                    updatedAt: Date.now()
                };
            }

            statsByDate[date].totalExpenses += expense.amount;
            statsByDate[date].categoryBreakdown[expense.category] = (statsByDate[date].categoryBreakdown[expense.category] || 0) + expense.amount;
        });

        // 5. Write to Firestore in batches
        const batchSize = 500;
        const dates = Object.keys(statsByDate);
        let batch = writeBatch(db);
        let count = 0;

        for (const date of dates) {
            const statsRef = doc(db, 'daily_stats', date);
            batch.set(statsRef, statsByDate[date]);
            count++;

            if (count >= batchSize) {
                await batch.commit();
                batch = writeBatch(db);
                count = 0;
            }
        }

        if (count > 0) {
            await batch.commit();
        }

        console.log(`Migration completed. Processed ${dates.length} days.`);
        return { success: true, daysProcessed: dates.length };

    } catch (error) {
        console.error("Migration failed:", error);
        return { success: false, error };
    }
};
