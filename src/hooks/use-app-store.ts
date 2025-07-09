"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Order, Table, User } from '@/types';
import { TOTAL_TABLES } from '@/lib/data';

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
  const [orders, setOrders] = useState<Order[]>(() => getInitialState<Order[]>('orders', []));
  const [currentUser, setCurrentUser] = useState<User | null>(() => getInitialState<User | null>('currentUser', null));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        window.localStorage.setItem('orders', JSON.stringify(orders));
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    }
  }, [orders, isMounted]);

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
        const occupiedOrder = orders.find(o => o.tableId === table.id && o.status !== 'completed');
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

  const addOrUpdateOrder = useCallback((order: Order) => {
    setOrders(prevOrders => {
      const existingOrderIndex = prevOrders.findIndex(o => o.id === order.id);
      if (existingOrderIndex > -1) {
        const updatedOrders = [...prevOrders];
        updatedOrders[existingOrderIndex] = order;
        return updatedOrders;
      }
      return [...prevOrders, order];
    });
  }, []);

  return { 
    isMounted,
    currentUser,
    login,
    logout,
    tables, 
    orders, 
    addOrUpdateOrder,
  };
}
