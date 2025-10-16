
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/types';

export function useOrders() {
  const [orders, setOrders] = useState<Order[] | undefined>(undefined);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData: Order[] = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(ordersData);
    }, (error) => {
      console.error("Error fetching orders from Firestore:", error);
      setOrders([]);
    });

    return () => unsubscribe();
  }, []);

  const addOrUpdateOrder = useCallback(async (order: Omit<Order, 'id'> & { id?: string }): Promise<string | null> => {
    try {
      if (order.id) {
        // Si el pedido ya tiene ID, es una actualización
        const orderRef = doc(db, 'orders', order.id);
        await setDoc(orderRef, order, { merge: true });
        return order.id;
      } else {
        // Si el pedido no tiene ID, es uno nuevo
        const { id, ...orderData } = order;
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        return docRef.id; // Devuelve el nuevo ID generado por Firebase
      }
    } catch (error) {
      console.error("Error adding or updating order in Firestore:", error);
      return null;
    }
  }, []);

  const cancelOrder = useCallback(async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        cancelledAt: Date.now(),
      });
    } catch (error) {
      console.error("Error cancelling order in Firestore:", error);
    }
  }, []);

  return { orders, addOrUpdateOrder, cancelOrder };
}
