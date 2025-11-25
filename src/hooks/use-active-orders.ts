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

                await setDoc(orderRef, order, { merge: true });

                // Check if status changed to completed to update daily stats
                if (order.status === 'completed' && currentOrder && currentOrder.status !== 'completed') {
                    const revenue = order.total;
                    const paymentMethod = order.paymentMethod || 'efectivo'; // Default to efectivo if missing

                    const itemSales: { [itemId: string]: { name: string; quantity: number; revenue: number } } = {};

                    order.items.forEach(item => {
                        const itemId = item.menuItemId.toString();
                        // Find item name and price
                        let name = "Item Desconocido";
                        let price = 0;

                        const menuItem = menuItems.find(i => i.id === itemId || (i as any).oldId === item.menuItemId);
                        if (menuItem) {
                            name = menuItem.name;
                            price = menuItem.price;
                        } else {
                            // Try variants
                            for (const i of menuItems as any[]) {
                                if (i.variants) {
                                    const v = i.variants.find((v: any) => v.id === item.menuItemId);
                                    if (v) {
                                        name = `${i.name} ${v.nombre}`;
                                        price = v.precio;
                                        break;
                                    }
                                }
                            }
                        }

                        // Override with custom price if present
                        if (item.customPrice) price = item.customPrice;

                        const itemRevenue = price * item.quantity;

                        if (!itemSales[itemId]) {
                            itemSales[itemId] = { name, quantity: 0, revenue: 0 };
                        }
                        itemSales[itemId].quantity += item.quantity;
                        itemSales[itemId].revenue += itemRevenue;
                    });

                    await updateDailyStats(new Date(), {
                        revenue: revenue,
                        orderCount: 1,
                        paymentMethods: { [paymentMethod]: revenue },
                        itemSales: itemSales
                    });
                }

                return order.id;
            } else {
                const { id, ...orderData } = order;
                const docRef = await addDoc(collection(db, 'orders'), orderData);

                // If created as completed (unlikely but possible)
                if (orderData.status === 'completed') {
                    const revenue = orderData.total;
                    const paymentMethod = orderData.paymentMethod || 'efectivo';

                    const itemSales: { [itemId: string]: { name: string; quantity: number; revenue: number } } = {};

                    orderData.items.forEach(item => {
                        const itemId = item.menuItemId.toString();
                        // Find item name and price
                        let name = "Item Desconocido";
                        let price = 0;

                        const menuItem = menuItems.find(i => i.id === itemId || (i as any).oldId === item.menuItemId);
                        if (menuItem) {
                            name = menuItem.name;
                            price = menuItem.price;
                        } else {
                            // Try variants
                            for (const i of menuItems as any[]) {
                                if (i.variants) {
                                    const v = i.variants.find((v: any) => v.id === item.menuItemId);
                                    if (v) {
                                        name = `${i.name} ${v.nombre}`;
                                        price = v.precio;
                                        break;
                                    }
                                }
                            }
                        }

                        if (item.customPrice) price = item.customPrice;
                        const itemRevenue = price * item.quantity;

                        if (!itemSales[itemId]) {
                            itemSales[itemId] = { name, quantity: 0, revenue: 0 };
                        }
                        itemSales[itemId].quantity += item.quantity;
                        itemSales[itemId].revenue += itemRevenue;
                    });

                    await updateDailyStats(new Date(), {
                        revenue: revenue,
                        orderCount: 1,
                        paymentMethods: { [paymentMethod]: revenue },
                        itemSales: itemSales
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
            await updateDoc(orderRef, {
                status: 'cancelled',
                cancelledAt: Date.now(),
            });
        } catch (error) {
            console.error("Error cancelling order:", error);
        }
    }, []);

    return { orders, addOrUpdateOrder, cancelOrder };
}
