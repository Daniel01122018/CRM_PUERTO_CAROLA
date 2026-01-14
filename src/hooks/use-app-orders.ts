import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    doc,
    updateDoc,
    where,
    Timestamp,
    increment,
    setDoc,
    getDoc
} from 'firebase/firestore';
import { useAppStore } from './use-app-store';
import type { AppOrder, AppOrderStatus } from '@/types/app-orders';
import type { DailyStats } from '@/types';

/**
 * Hook for managing App Orders from the mobile customer app
 */
export function useAppOrders() {
    const { currentUser } = useAppStore();
    const [orders, setOrders] = useState<AppOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load orders with real-time updates
    useEffect(() => {
        // Query active orders (not completed or cancelled)
        const q = query(
            collection(db, 'AppOrders'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as AppOrder));

            setOrders(ordersData);
            setLoading(false);
        }, (err) => {
            console.error('Error loading app orders:', err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Get timestamp field name for each status
    const getTimestampFieldForStatus = (status: AppOrderStatus): string | null => {
        const timestampFields: Partial<Record<AppOrderStatus, string>> = {
            confirmed: 'confirmedAt',
            preparing: 'preparingAt',
            ready: 'readyAt',
            completed: 'completedAt',
            cancelled: 'cancelledAt'
        };
        return timestampFields[status] || null;
    };

    // Update order status
    const updateOrderStatus = useCallback(async (
        orderId: string,
        newStatus: AppOrderStatus,
        paymentMethod?: 'Efectivo' | 'DeUna' | 'Transferencia'
    ) => {
        const orderRef = doc(db, 'AppOrders', orderId);
        const now = Date.now();

        const updateData: Record<string, any> = {
            status: newStatus,
            updatedAt: now
        };

        // Set the corresponding timestamp
        const timestampField = getTimestampFieldForStatus(newStatus);
        if (timestampField) {
            updateData[timestampField] = now;
        }

        // If completing, also mark as paid and set payment method
        if (newStatus === 'completed') {
            updateData.paymentStatus = 'paid';
            if (paymentMethod) {
                updateData.paymentMethod = paymentMethod;
            }
        }

        await updateDoc(orderRef, updateData);

        // If completed, update daily_stats
        if (newStatus === 'completed') {
            const order = orders.find(o => o.id === orderId);
            if (order) {
                await updateDailyStatsForOrder(order, paymentMethod || 'Efectivo');
            }
        }

        // TODO: Send push notification to customer
        // await sendPushNotification(orderId, newStatus);
    }, [orders]);

    // Update daily_stats when order is completed
    const updateDailyStatsForOrder = async (
        order: AppOrder,
        paymentMethod: 'Efectivo' | 'DeUna' | 'Transferencia'
    ) => {
        const now = new Date();
        const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const statsRef = doc(db, 'daily_stats', dateKey);

        try {
            const statsSnap = await getDoc(statsRef);

            if (statsSnap.exists()) {
                // Update existing stats
                const currentStats = statsSnap.data() as DailyStats;

                // Calculate item sales
                const newItemSales = { ...currentStats.itemSales };
                order.items.forEach(item => {
                    const itemKey = item.menuItemId;
                    if (newItemSales[itemKey]) {
                        newItemSales[itemKey].quantity += item.quantity;
                        newItemSales[itemKey].revenue += item.unitPrice * item.quantity;
                    } else {
                        newItemSales[itemKey] = {
                            name: item.menuItemName,
                            quantity: item.quantity,
                            revenue: item.unitPrice * item.quantity
                        };
                    }
                });

                // Update payment methods
                const newPaymentMethods = { ...currentStats.paymentMethods };
                newPaymentMethods[paymentMethod] = (newPaymentMethods[paymentMethod] || 0) + order.total;

                await updateDoc(statsRef, {
                    totalRevenue: increment(order.total),
                    orderCount: increment(1),
                    paymentMethods: newPaymentMethods,
                    itemSales: newItemSales,
                    updatedAt: Date.now()
                });
            } else {
                // Create new stats document
                const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
                order.items.forEach(item => {
                    itemSales[item.menuItemId] = {
                        name: item.menuItemName,
                        quantity: item.quantity,
                        revenue: item.unitPrice * item.quantity
                    };
                });

                const newStats: DailyStats = {
                    date: dateKey,
                    totalRevenue: order.total,
                    totalExpenses: 0,
                    orderCount: 1,
                    paymentMethods: { [paymentMethod]: order.total },
                    categoryBreakdown: { 'App': order.total },
                    itemSales,
                    serviceTypeBreakdown: {
                        mesa: { count: 0, revenue: 0 },
                        llevar: { count: 1, revenue: order.total }
                    },
                    updatedAt: Date.now()
                };

                await setDoc(statsRef, newStats);
            }
        } catch (err) {
            console.error('Error updating daily_stats:', err);
        }
    };

    // Confirm order (pending -> confirmed)
    const confirmOrder = useCallback(async (orderId: string) => {
        await updateOrderStatus(orderId, 'confirmed');
    }, [updateOrderStatus]);

    // Start preparing (confirmed -> preparing)
    const startPreparing = useCallback(async (orderId: string) => {
        await updateOrderStatus(orderId, 'preparing');
    }, [updateOrderStatus]);

    // Mark as ready (preparing -> ready)
    const markAsReady = useCallback(async (orderId: string) => {
        await updateOrderStatus(orderId, 'ready');
    }, [updateOrderStatus]);

    // Complete order (ready -> completed)
    const completeOrder = useCallback(async (
        orderId: string,
        paymentMethod: 'Efectivo' | 'DeUna' | 'Transferencia'
    ) => {
        await updateOrderStatus(orderId, 'completed', paymentMethod);
    }, [updateOrderStatus]);

    // Cancel order
    const cancelOrder = useCallback(async (orderId: string) => {
        await updateOrderStatus(orderId, 'cancelled');
    }, [updateOrderStatus]);

    // Filter helpers
    const activeOrders = orders.filter(o =>
        !['completed', 'cancelled'].includes(o.status)
    );

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const inProgressOrders = orders.filter(o =>
        ['confirmed', 'preparing', 'ready'].includes(o.status)
    );

    return {
        // Data
        orders,
        activeOrders,
        pendingOrders,
        inProgressOrders,
        loading,
        error,

        // Actions
        confirmOrder,
        startPreparing,
        markAsReady,
        completeOrder,
        cancelOrder,
        updateOrderStatus
    };
}
