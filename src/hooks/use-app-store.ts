
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Order, Table, User, Expense, Employee, DailyData, InventoryItem, OrderItem } from '@/types';
import { USERS as staticUsers, TOTAL_TABLES, MENU_ITEMS, TAKEAWAY_MENU_ITEMS } from '@/lib/data';
import { format } from 'date-fns';

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
  const inventoryItems = useLiveQuery(() => db.inventory.toArray());

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dailyData = useLiveQuery(() => db.dailyData.get(todayStr), [todayStr]);

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
      .filter(([_, user]) => user.role !== 'kitchen' && user.role !== 'admin')
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

    return Array.from({ length: TOTAL_TABLES }, (_, i) => {
        const tableId = i + 1;
        const occupiedOrder = orders.find(o => o.tableId === tableId && (o.status === 'active' || o.status === 'preparing'));
        return {
            id: tableId,
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

  const updateInventoryFromOrder = useCallback(async (order: Order) => {
    if (!inventoryItems) return;

    const allMenuItems = [...MENU_ITEMS, ...TAKEAWAY_MENU_ITEMS];

    for (const orderItem of order.items) {
        const menuItem = allMenuItems.find(mi => mi.id === orderItem.menuItemId);

        if (menuItem && menuItem.inventoryItemId) {
            const inventoryItem = inventoryItems.find(invItem => invItem.id === menuItem.inventoryItemId);

            if (inventoryItem) {
                const newStock = inventoryItem.stock - orderItem.quantity;
                await db.inventory.update(inventoryItem.id, { stock: newStock });
            }
        }
    }
  }, [inventoryItems]);

  const addOrUpdateOrder = useCallback(async (order: Order) => {
    const existingOrder = await db.orders.get(order.id);
    
    // Si el pedido se está completando ahora, y antes no lo estaba, descontar inventario
    if (order.status === 'completed' && existingOrder?.status !== 'completed') {
        await updateInventoryFromOrder(order);
    }

    await db.orders.put(order);
  }, [updateInventoryFromOrder]);
  
  const cancelOrder = useCallback(async (orderId: string) => {
    await db.orders.update(orderId, { status: 'cancelled', cancelledAt: Date.now() });
  }, []);

  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!currentUser) {
        throw new Error("No hay usuario autenticado para registrar un gasto.");
    }
    const newExpense: Expense = {
      id: Date.now().toString(),
      ...expenseData,
      createdAt: Date.now(),
      createdBy: currentUser.username,
    };
    await db.expenses.add(newExpense);
  }, [currentUser]);

  const updateExpense = useCallback(async (expenseId: string, updatedData: Partial<Omit<Expense, 'id'>>) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Solo los administradores pueden actualizar gastos.");
    }
    await db.expenses.update(expenseId, updatedData);
  }, [currentUser]);

  const deleteExpense = useCallback(async (expenseId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Solo los administradores pueden eliminar gastos.");
    }
    await db.expenses.delete(expenseId);
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

  const setInitialCash = useCallback(async (amount: number) => {
    if (!currentUser || currentUser.role !== 'admin') {
        throw new Error("Solo los administradores pueden establecer la caja inicial.");
    }
    const today = format(new Date(), 'yyyy-MM-dd');
    const data: DailyData = {
        date: today,
        initialCash: amount,
    };
    await db.dailyData.put(data);
  }, [currentUser]);

  const addInventoryItem = useCallback(async (item: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Solo los administradores pueden añadir artículos al inventario.");
    }
    const existingItem = await db.inventory.get(item.name.toLowerCase().replace(/\s+/g, '-'));
    if(existingItem) {
        throw new Error("Ya existe un artículo con un nombre similar en el inventario.");
    }
    const newItem: InventoryItem = {
      id: item.name.toLowerCase().replace(/\s+/g, '-'), // Generar ID a partir del nombre
      ...item,
      createdAt: Date.now(),
    };
    await db.inventory.add(newItem);
  }, [currentUser]);

  const updateInventoryItem = useCallback(async (itemId: string, updates: Partial<Omit<InventoryItem, 'id'>>) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Solo los administradores pueden actualizar el inventario.");
    }
    await db.inventory.update(itemId, updates);
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
    updateExpense,
    deleteExpense,
    employees,
    addEmployee,
    dailyData,
    setInitialCash,
    inventoryItems,
    addInventoryItem,
    updateInventoryItem
  };
}
