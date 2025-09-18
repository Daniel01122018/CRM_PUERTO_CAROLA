
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Order, Table, User, Expense, Employee } from '@/types';
import { USERS as staticUsers } from '@/lib/data';
import { TABLE_LAYOUT } from '@/lib/layout';

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

const setStateToLocalStorage = <T,>(key: string, value: T) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  }
};


export function useAppStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getInitialState<User | null>('currentUser', null));
  const [isMounted, setIsMounted] = useState(false);

  const orders = useLiveQuery(() => db.orders.toArray());
  const expenses = useLiveQuery(() => db.expenses.toArray());
  const manualEmployees = useLiveQuery(() => db.employees.toArray());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) setStateToLocalStorage('currentUser', currentUser);
  }, [currentUser, isMounted]);


  const employees: Employee[] | undefined = useMemo(() => {
    if (!manualEmployees) return undefined;
    
    const allEmployees = [...manualEmployees];
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

  const tables = useMemo<Table[] | undefined>(() => {
    if (!orders) return undefined;

    return TABLE_LAYOUT.map(layout => {
        const occupiedOrder = orders.find(o => o.tableId === layout.id && (o.status === 'active' || o.status === 'preparing'));
        return {
            ...layout,
            status: occupiedOrder ? 'occupied' : 'available',
            orderId: occupiedOrder?.id
        };
    });
  }, [orders]);


  const login = useCallback((username: string) => {
    const userData = staticUsers[username as keyof typeof staticUsers];
    if (userData) {
      const user: User = { username, role: userData.role };
      setCurrentUser(user);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const addOrUpdateOrder = useCallback(async (order: Order) => {
    await db.orders.put(order);
  }, []);
  
  const cancelOrder = useCallback(async (orderId: string) => {
    await db.orders.update(orderId, { status: 'cancelled', cancelledAt: Date.now() });
  }, []);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!currentUser) {
        console.error("No user logged in to create an expense.");
        return;
    }
    const newExpense: Expense = {
      id: Date.now().toString(),
      ...expense,
      createdAt: Date.now(),
      createdBy: currentUser.username,
    };
    await db.expenses.add(newExpense);
  }, [currentUser]);

  const addEmployee = useCallback(async (employee: Omit<Employee, 'id' | 'createdAt'>) => {
     if (!currentUser || currentUser.role !== 'admin') {
        console.error("Only admins can add employees.");
        throw new Error("Acción no permitida.");
     }
     const newEmployee: Employee = {
         id: Date.now().toString(),
         ...employee,
         createdAt: Date.now(),
     };
     await db.employees.add(newEmployee);
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
