"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Order, Table, User, Expense, Employee } from '@/types';
import { TOTAL_TABLES, USERS as staticUsers } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";

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
  const [manualEmployees, setManualEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => getInitialState<User | null>('currentUser', null));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const listeners: (() => void)[] = [];
    
    try {
        const unsubscribeOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Order);
            setOrders(ordersData);
        }, (error) => console.error("Error listening to orders collection:", error));
        listeners.push(unsubscribeOrders);

        const unsubscribeExpenses = onSnapshot(collection(db, "expenses"), (snapshot) => {
            const expensesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Expense));
            setExpenses(expensesData);
        }, (error) => console.error("Error listening to expenses collection:", error));
        listeners.push(unsubscribeExpenses);
        
        const unsubscribeEmployees = onSnapshot(collection(db, "employees"), (snapshot) => {
            const employeesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Employee));
            setManualEmployees(employeesData);
        }, (error) => console.error("Error listening to employees collection:", error));
        listeners.push(unsubscribeEmployees);

        return () => {
           listeners.forEach(unsubscribe => unsubscribe());
        };
    } catch(e) {
        console.error("Could not initialize Firebase listener. Is your firebase.ts config correct?", e);
    }
  }, []);

  const employees: Employee[] = useMemo(() => {
     // Manually added employees are the primary source
    const allEmployees = [...manualEmployees];
    
    // Add system users only if they don't already exist in manualEmployees by name
    Object.entries(staticUsers)
      .filter(([_, user]) => user.role !== 'kitchen')
      .forEach(([name, user]) => {
        if (!allEmployees.some(e => e.name.toLowerCase() === name.toLowerCase())) {
           allEmployees.push({
             id: user.id,
             name: name,
             role: user.role,
             createdAt: 0,
           });
        }
    });

    return allEmployees;
  }, [manualEmployees]);


  useEffect(() => {
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
    const userData = staticUsers[username as keyof typeof staticUsers];
    if (userData) {
      const user: User = { username, role: userData.role, id: userData.id };
      setCurrentUser(user);
    }
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
      const orderToSave = { ...order, id: order.id }; // Ensure ID is part of the document data
      await setDoc(orderRef, orderToSave, { merge: true }); 
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

  const addEmployee = useCallback(async (employee: Omit<Employee, 'id' | 'createdAt'>) => {
     if (!currentUser || currentUser.role !== 'admin') {
        console.error("Only admins can add employees.");
        throw new Error("Acción no permitida.");
     }
     try {
         const newEmployee: Omit<Employee, 'id'> = {
             ...employee,
             createdAt: Date.now(),
         };
         await addDoc(collection(db, "employees"), newEmployee);
     } catch(error) {
         console.error("Error adding employee: ", error);
         throw new Error("No se pudo agregar el empleado.");
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
    employees,
    addEmployee,
  };
}
