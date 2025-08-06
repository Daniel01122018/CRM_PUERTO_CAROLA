"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Order, Table, User, Expense } from '@/types';
import { TOTAL_TABLES } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, addDoc } from "firebase/firestore";

const getInitialState = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

export function useAppStore() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => getInitialState<User | null>('currentUser', null));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Set up the real-time listener for orders from Firestore
    try {
        const unsubscribeOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
            const ordersData = snapshot.docs.map(doc => doc.data() as Order);
            setOrders(ordersData);
        }, (error) => {
            console.error("Error listening to orders collection:", error);
            if (error.code === 'permission-denied') {
                alert("Error de permisos: No se pudo conectar a la base de datos de pedidos. Verifica la configuración de Firebase y las reglas de seguridad de Firestore.");
            }
        });

        const unsubscribeExpenses = onSnapshot(collection(db, "expenses"), (snapshot) => {
            const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
            setExpenses(expensesData);
        }, (error) => {
            console.error("Error listening to expenses collection:", error);
            if (error.code === 'permission-denied') {
                 alert("Error de permisos: No se pudo conectar a la base de datos de gastos. Verifica la configuración de Firebase y las reglas de seguridad de Firestore.");
            }
        });

        return () => {
            unsubscribeOrders(); 
            unsubscribeExpenses();
        };
    } catch(e) {
        console.error("Could not initialize Firebase listener. Is your firebase.ts config correct?", e);
    }
  }, []);


  useEffect(() => {
    // We still use localStorage for the current user session, as it's specific to the device
    if (isMounted) {
        try {
            window.localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } catch (error) {
            console.error('Error writing currentUser to localStorage:', error);
        }
    }
  }, [currentUser, isMounted]);

  const tables = useMemo<Table[]>(() => {
    const initialTables: Table[] = Array.from({ length: TOTAL_TABLES }, (_, i) => ({
      id: i + 1,
      status: 'available',
    }));

    return initialTables.map(table => {
        const occupiedOrder = orders.find(o => o.tableId === table.id && (o.status === 'active' || o.status === 'preparing'));
        return {
            ...table,
            status: occupiedOrder ? 'occupied' : 'available',
            orderId: occupiedOrder?.id
        };
    });
  }, [orders]);


  const login = useCallback((username: string) => {
    let role: User['role'] = 'waiter';
    if (username === 'admin1') role = 'admin';
    if (username === 'cocina') role = 'kitchen';
    
    const user: User = { username, role };
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const addOrUpdateOrder = useCallback(async (order: Order) => {
    if (!order.id) {
        console.error("Order must have an ID to be saved to Firestore.");
        return;
    }
    try {
      const orderRef = doc(db, "orders", order.id);
      await setDoc(orderRef, order, { merge: true }); 
    } catch (error) {
        console.error("Error adding/updating document: ", error);
    }
  }, []);
  
  const cancelOrder = useCallback(async (orderId: string) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const cancelledOrderData = {
            status: 'cancelled' as const,
            cancelledAt: Date.now()
        };
        await setDoc(orderRef, cancelledOrderData, { merge: true });
    } catch (error) {
        console.error("Error cancelling order: ", error);
    }
  }, []);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!currentUser) {
        console.error("No user logged in to create an expense.");
        return;
    }
    try {
      const newExpense: Omit<Expense, 'id'> = {
        ...expense,
        createdAt: Date.now(),
        createdBy: currentUser.username,
      };
      await addDoc(collection(db, "expenses"), newExpense);
    } catch (error) {
      console.error("Error adding expense: ", error);
    }
  }, [currentUser]);

  return { 
    isMounted,
    currentUser,
    login,
    logout,
    tables, 
    orders, 
    addOrUpdateOrder,
    cancelOrder,
    expenses,
    addExpense,
  };
}
