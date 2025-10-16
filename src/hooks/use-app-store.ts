
"use client";

import { useMemo } from 'react';
import type { Table } from '@/types';
import { TOTAL_TABLES } from '@/lib/data';
import { useAuth } from './use-auth';
import { useOrders } from './use-orders';
import { useExpenses } from './use-expenses';
import { useEmployees } from './use-employees';
import { useDailyData } from './use-daily-data';

export function useAppStore() {
  const { currentUser, login, logout, isMounted } = useAuth();
  const { orders, addOrUpdateOrder, cancelOrder } = useOrders();
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { employees, addEmployee } = useEmployees();
  const { dailyData, setInitialCash } = useDailyData();

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

  return {
    // Auth
    currentUser,
    login,
    logout,
    isMounted,
    // Orders
    orders,
    addOrUpdateOrder,
    cancelOrder,
    // Expenses
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    // Employees
    employees,
    addEmployee,
    // Daily Data
    dailyData,
    setInitialCash,
    // Derived data
    tables,
  };
}
