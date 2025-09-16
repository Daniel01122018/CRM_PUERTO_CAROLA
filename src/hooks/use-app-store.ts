
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Order, Table, User, Expense, Employee } from '@/types';
import { TOTAL_TABLES, USERS as staticUsers } from '@/lib/data';

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
  const [orders, setOrders] = useState<Order[]>(() => getInitialState<Order[]>('orders', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => getInitialState<Expense[]>('expenses', []));
  const [manualEmployees, setManualEmployees] = useState<Employee[]>(() => getInitialState<Employee[]>('employees', []));
  const [currentUser, setCurrentUser] = useState<User | null>(() => getInitialState<User | null>('currentUser', null));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Write state to localStorage whenever it changes
  useEffect(() => {
    if (isMounted) setStateToLocalStorage('orders', orders);
  }, [orders, isMounted]);

  useEffect(() => {
    if (isMounted) setStateToLocalStorage('expenses', expenses);
  }, [expenses, isMounted]);
  
  useEffect(() => {
    if (isMounted) setStateToLocalStorage('employees', manualEmployees);
  }, [manualEmployees, isMounted]);

  useEffect(() => {
    if (isMounted) setStateToLocalStorage('currentUser', currentUser);
  }, [currentUser, isMounted]);


  const employees: Employee[] = useMemo(() => {
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
      const user: User = { username, role: userData.role };
      setCurrentUser(user);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const addOrUpdateOrder = useCallback((order: Order) => {
    setOrders(prevOrders => {
      const existingOrderIndex = prevOrders.findIndex(o => o.id === order.id);
      if (existingOrderIndex > -1) {
        const newOrders = [...prevOrders];
        newOrders[existingOrderIndex] = order;
        return newOrders;
      }
      return [...prevOrders, order];
    });
  }, []);
  
  const cancelOrder = useCallback(async (orderId: string) => {
    setOrders(prevOrders => prevOrders.map(o => 
        o.id === orderId 
        ? { ...o, status: 'cancelled' as const, cancelledAt: Date.now() } 
        : o
    ));
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>) => {
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
    setExpenses(prev => [...prev, newExpense]);
  }, [currentUser]);

  const addEmployee = useCallback((employee: Omit<Employee, 'id' | 'createdAt'>) => {
     if (!currentUser || currentUser.role !== 'admin') {
        console.error("Only admins can add employees.");
        throw new Error("Acción no permitida.");
     }
     const newEmployee: Employee = {
         id: Date.now().toString(),
         ...employee,
         createdAt: Date.now(),
     };
     setManualEmployees(prev => [...prev, newEmployee]);
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
