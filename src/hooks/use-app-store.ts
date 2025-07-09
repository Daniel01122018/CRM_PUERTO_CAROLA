"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Order, Table, User, OrderStatus } from '@/types';
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

  // Effect to sync orders to localStorage
  useEffect(() => {
    if (isMounted) {
      try {
        window.localStorage.setItem('orders', JSON.stringify(orders));
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    }
  }, [orders, isMounted]);

  // Derive tables state from orders state
  const tables = useMemo<Table[]>(() => {
    const initialTables: Table[] = Array.from({ length: TOTAL_TABLES }, (_, i) => ({
      id: i + 1,
      status: 'available',
    }));

    return initialTables.map(table => {
        const occupiedOrder = orders.find(o => o.tableId === table.id && (o.status === 'active' || o.status === 'preparing' || o.status === 'ready'));
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
     try {
      window.localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (error) {
      console.error('Error writing currentUser to localStorage:', error);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      window.localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Error removing currentUser from localStorage:', error);
    }
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

  const getOrder = useCallback((orderId: string) => {
    return orders.find(o => o.id === orderId);
  }, [orders]);
  
  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? {...o, status} : o));
  }, []);

  const removeOrder = useCallback((orderId: string) => {
    setOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
  }, []);

  return { 
    isMounted,
    currentUser,
    login,
    logout,
    tables, 
    orders, 
    addOrUpdateOrder,
    getOrder,
    updateOrderStatus,
    removeOrder
  };
}
