
"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
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
      setOrders([]); // En caso de error, devolvemos un array vacío para evitar que la app se rompa
    });

    return () => unsubscribe();
  }, []);

  const addOrUpdateOrder = useCallback(async (order: Order) => {
    try {
      // setDoc con un ID específico crea o sobreescribe el documento.
      // Es el equivalente más cercano a `put` de Dexie.
      const orderRef = doc(db, 'orders', order.id);
      await setDoc(orderRef, order, { merge: true });
    } catch (error) {
      console.error("Error adding or updating order in Firestore:", error);
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
