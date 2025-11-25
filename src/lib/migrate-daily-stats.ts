import { collection, getDocs, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import type { Order, Expense } from '@/types';
import { ALL_MENU_ITEMS } from '@/lib/data';

export const migrateDailyStats = async () => {
    console.log("Starting daily stats migration...");

    try {
        // 1. Fetch all completed orders
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const orders = ordersSnapshot.docs
            .map(d => d.data() as Order)
            .filter(o => o.status === 'completed');

        // 2. Fetch all expenses
        const expensesSnapshot = await getDocs(collection(db, 'expenses'));
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
                    updatedAt: Date.now()
                };
            }

            statsByDate[date].totalRevenue += order.total;
            statsByDate[date].orderCount += 1;

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
