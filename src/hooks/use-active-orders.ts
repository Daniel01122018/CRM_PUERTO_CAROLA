"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    onSnapshot,
    doc,
    setDoc,
    addDoc,
    updateDoc,
    query,
    orderBy,
    where,
    Timestamp,
    getDoc,
    runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/types';
import { startOfDay } from 'date-fns';
import { updateDailyStats } from '@/lib/daily-stats';
import { useMenu } from '@/hooks/use-menu';

export function useActiveOrders() {
    const [orders, setOrders] = useState<Order[] | undefined>(undefined);

    useEffect(() => {
        // Get start of today in milliseconds
        const todayStart = startOfDay(new Date()).getTime();

        // 🔒 OPTIMIZATION: Fetch active, preparing AND undelivered completed orders
        const q = query(
            collection(db, 'orders'),
            where('createdAt', '>=', todayStart),
            where('status', 'in', ['active', 'preparing', 'completed']),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const ordersData: Order[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as Order;
                // Filter: 
                // 1. All active/preparing
                // 2. Completed Takeaway ONLY if NOT delivered
                if (data.status === 'completed') {
                    if (data.tableId === 'takeaway' && !data.delivered) {
                        ordersData.push({ ...data, id: doc.id });
                    }
                } else {
                    ordersData.push({ ...data, id: doc.id });
                }
            });
            setOrders(ordersData);
        }, (error) => {
            console.error("Error fetching active orders from Firestore:", error);
            // If index error, log helpful message
            if (error.message?.includes('index')) {
                console.error("⚠️ Firestore composite index required. Check console for link to create index.");
            }
            setOrders([]);
        });

        return () => unsubscribe();
    }, []);

    const { items: menuItems } = useMenu();

    const addOrUpdateOrder = useCallback(async (order: Omit<Order, 'id'> & { id?: string }): Promise<string | null> => {
        try {
            let shouldUpdateStats = false;
            let completedOrderId: string | null = null;
            let orderCreatedAt: number | null = null;

            const orderId = await runTransaction(db, async (transaction) => {
                const isTableOrder = typeof order.tableId === 'number';
                let returningId: string;

                if (order.id) {
                    // UPDATE EXISTING ORDER
                    const orderRef = doc(db, 'orders', order.id);
                    const orderSnap = await transaction.get(orderRef);
                    if (!orderSnap.exists()) throw new Error("Order does not exist");

                    const currentOrder = orderSnap.data() as Order;
                    returningId = order.id;

                    // If status is becoming completed, add completedAt timestamp
                    if (order.status === 'completed' && currentOrder.status !== 'completed') {
                        order.completedAt = Date.now();
                        shouldUpdateStats = true;
                        completedOrderId = returningId;
                        // Get createdAt from the EXISTING document, not from the parameter
                        orderCreatedAt = currentOrder.createdAt;
                    }

                    // Auto-deliver if completed and NOT takeaway
                    if (order.status === 'completed' && order.tableId !== 'takeaway') {
                        order.delivered = true;
                    }

                    transaction.set(orderRef, order, { merge: true });

                    // Release Table Lock if completed
                    if (isTableOrder && order.status === 'completed' && currentOrder.status !== 'completed') {
                        const tableRef = doc(db, 'tables', order.tableId.toString());
                        transaction.set(tableRef, { status: 'available', currentOrderId: null }, { merge: true });
                    }
                } else {
                    // CREATE NEW ORDER
                    // STRICT CHECK FOR TABLE LOCK
                    if (isTableOrder) {
                        const tableRef = doc(db, 'tables', order.tableId.toString());
                        const tableSnap = await transaction.get(tableRef);

                        if (tableSnap.exists()) {
                            const tableData = tableSnap.data();
                            if (tableData.status === 'occupied') {
                                throw new Error(`La Mesa ${order.tableId} ya está ocupada por otro pedido.`);
                            }
                        }

                        // Reserve table
                        const newOrderRef = doc(collection(db, 'orders'));
                        returningId = newOrderRef.id;

                        // Set Lock
                        transaction.set(tableRef, { status: 'occupied', currentOrderId: returningId }, { merge: true });

                        // Create Order
                        const { id, ...orderData } = order;
                        if (orderData.status === 'completed') {
                            orderData.completedAt = Date.now();
                            shouldUpdateStats = true;
                            completedOrderId = returningId;
                            orderCreatedAt = orderData.createdAt;
                            orderData.delivered = true; // Auto-deliver new completed table order
                        }
                        transaction.set(newOrderRef, orderData);

                    } else {
                        // Takeaway/Kiosk - No locking needed
                        const newOrderRef = doc(collection(db, 'orders'));
                        returningId = newOrderRef.id;
                        const { id, ...orderData } = order;
                        if (orderData.status === 'completed') {
                            orderData.completedAt = Date.now();
                            shouldUpdateStats = true;
                            completedOrderId = returningId;
                            orderCreatedAt = orderData.createdAt;
                            // No auto-deliver for takeaway completed new orders (unlikely but safe)
                        }
                        transaction.set(newOrderRef, orderData);
                    }
                }

                return returningId;
            });

            console.log('[addOrUpdateOrder] Transaction complete. Stats tracking flags:', {
                shouldUpdateStats,
                completedOrderId,
                orderCreatedAt
            });

            // Update stats AFTER transaction completes successfully
            if (shouldUpdateStats && completedOrderId && orderCreatedAt) {
                console.log('[addOrUpdateOrder] Stats conditions met, fetching order for stats...');
                try {
                    // Fetch the completed order to get accurate stats
                    const orderRef = doc(db, 'orders', completedOrderId);
                    const orderSnap = await getDoc(orderRef);

                    if (orderSnap.exists()) {
                        const completedOrder = { id: orderSnap.id, ...orderSnap.data() } as Order;
                        console.log('[addOrUpdateOrder] Fetched completed order:', completedOrder);

                        const { calculateOrderStats } = await import('@/lib/stats-helper');
                        const stats = calculateOrderStats(completedOrder, menuItems);
                        console.log('[addOrUpdateOrder] Calculated stats:', stats);

                        await updateDailyStats(new Date(orderCreatedAt), {
                            revenue: stats.revenue,
                            orderCount: 1,
                            paymentMethods: stats.paymentMethods,
                            itemSales: stats.itemSales
                        });
                    } else {
                        console.warn('[addOrUpdateOrder] Order not found after transaction!', completedOrderId);
                    }
                } catch (statsError) {
                    console.error("[addOrUpdateOrder] Error updating daily stats:", statsError);
                    // Don't fail the order operation if stats update fails
                }
            } else {
                console.log('[addOrUpdateOrder] Stats NOT updated. Conditions failed:', {
                    shouldUpdateStats,
                    completedOrderId,
                    orderCreatedAt
                });
            }

            return orderId;

        } catch (error) {
            console.error("Error adding or updating order:", error);
            // Re-throw or return null? Original returned null.
            // If it's the specific "Occupied" error, we might want to propagate it or alert.
            // But the signature returns string | null.
            if (error instanceof Error && error.message.includes("ocupada")) {
                alert(error.message); // Simple alert for now as we are in a hook
            }
            return null;
        }
    }, [menuItems]);

    const cancelOrder = useCallback(async (orderId: string) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) {
                console.error("Order not found");
                return;
            }

            const order = { id: orderSnap.id, ...orderSnap.data() } as Order;

            // If order was completed, we need to revert the stats
            if (order.status === 'completed') {
                const { calculateOrderStats } = await import('@/lib/stats-helper');
                const stats = calculateOrderStats(order, menuItems);

                // Invert values for cancellation
                const invertedItemSales: any = {};
                Object.keys(stats.itemSales).forEach(key => {
                    invertedItemSales[key] = {
                        ...stats.itemSales[key],
                        quantity: -stats.itemSales[key].quantity,
                        revenue: -stats.itemSales[key].revenue
                    };
                });

                const invertedPaymentMethods: any = {};
                Object.keys(stats.paymentMethods).forEach(key => {
                    invertedPaymentMethods[key] = -stats.paymentMethods[key];
                });

                await updateDailyStats(new Date(order.createdAt), {
                    revenue: -stats.revenue,
                    orderCount: -1,
                    paymentMethods: invertedPaymentMethods,
                    itemSales: invertedItemSales
                });
            }

            await updateDoc(orderRef, {
                status: 'cancelled',
                cancelledAt: Date.now(),
            });

            // Release Table Lock
            if (typeof order.tableId === 'number') {
                const tableRef = doc(db, 'tables', order.tableId.toString());
                // We use set with merge to ensure we don't overwrite other fields if they exist, 
                // though usually we just want to free it.
                // We don't check if it was 'occupied' by THIS order specifically, 
                // but generally cancelling the ACTIVE order should free the table.
                await setDoc(tableRef, { status: 'available', currentOrderId: null }, { merge: true });
            }

        } catch (error) {
            console.error("Error cancelling order:", error);
        }
    }, [menuItems]);

    const resetTableLock = useCallback(async (tableId: number) => {
        try {
            const tableRef = doc(db, 'tables', tableId.toString());
            await setDoc(tableRef, { status: 'available', currentOrderId: null }, { merge: true });
            console.log(`Table ${tableId} unlocked manually.`);
        } catch (error) {
            console.error("Error unlocking table:", error);
        }
    }, []);

    return { orders, addOrUpdateOrder, cancelOrder, resetTableLock };
}
