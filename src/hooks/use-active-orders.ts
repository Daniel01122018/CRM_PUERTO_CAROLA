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
    getDoc
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

        // Query orders created today or later
        const q = query(
            collection(db, 'orders'),
            where('createdAt', '>=', todayStart),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const ordersData: Order[] = [];
            querySnapshot.forEach((doc) => {
                ordersData.push({ id: doc.id, ...doc.data() } as Order);
            });
            setOrders(ordersData);
        }, (error) => {
            console.error("Error fetching active orders from Firestore:", error);
            setOrders([]);
        });

        return () => unsubscribe();
    }, []);

    const { items: menuItems } = useMenu();

    const addOrUpdateOrder = useCallback(async (order: Omit<Order, 'id'> & { id?: string }): Promise<string | null> => {
        try {
            if (order.id) {
                const orderRef = doc(db, 'orders', order.id);
                const orderSnap = await getDoc(orderRef);
                const currentOrder = orderSnap.exists() ? orderSnap.data() as Order : null;

                // If status is becoming completed, add completedAt timestamp
                if (order.status === 'completed' && (!currentOrder || currentOrder.status !== 'completed')) {
                    order.completedAt = Date.now();
                }

                await setDoc(orderRef, order, { merge: true });

                // Check if status changed to completed to update daily stats
                if (order.status === 'completed' && currentOrder && currentOrder.status !== 'completed') {
                    // Use helper to calculate stats
                    const { calculateOrderStats } = await import('@/lib/stats-helper');
                    const stats = calculateOrderStats({ ...order, items: order.items || [] } as any, menuItems);

                    await updateDailyStats(new Date(), {
                        revenue: stats.revenue,
                        orderCount: 1,
                        paymentMethods: stats.paymentMethods,
                        itemSales: stats.itemSales
                    });
                }

                return order.id;
            } else {
                const { id, ...orderData } = order;
                const docRef = await addDoc(collection(db, 'orders'), orderData);

                // If created as completed (unlikely but possible)
                if (orderData.status === 'completed') {
                    orderData.completedAt = Date.now();
                    const { calculateOrderStats } = await import('@/lib/stats-helper');
                    const stats = calculateOrderStats({ ...orderData, items: orderData.items || [] } as any, menuItems);

                    await updateDailyStats(new Date(), {
                        revenue: stats.revenue,
                        orderCount: 1,
                        paymentMethods: stats.paymentMethods,
                        itemSales: stats.itemSales
                    });
                }

                return docRef.id;
            }
        } catch (error) {
            console.error("Error adding or updating order:", error);
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
        } catch (error) {
            console.error("Error cancelling order:", error);
        }
    }, [menuItems]);

    return { orders, addOrUpdateOrder, cancelOrder };
}
