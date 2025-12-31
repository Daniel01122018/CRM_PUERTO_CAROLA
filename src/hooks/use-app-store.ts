
"use client";

import { useMemo } from 'react';
import type { Table } from '@/types';
import { TOTAL_TABLES } from '@/lib/data';
import { useAuth } from './use-auth';
import { useActiveOrders } from './use-active-orders';
import { useExpenses } from './use-expenses';
import { useEmployees } from './use-employees';
import { useDailyData } from './use-daily-data';
import { useRestaurantConfig } from './use-restaurant-config';

export function useAppStore() {
  const { currentUser, login, logout, isMounted } = useAuth();
  const { orders, addOrUpdateOrder, cancelOrder, resetTableLock } = useActiveOrders();
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const { dailyData, setInitialCash } = useDailyData();
  const { config } = useRestaurantConfig();


  const tables = useMemo<Table[] | undefined>(() => {
    if (!orders) return undefined;

    const totalTables = config?.totalTables || 12;

    return Array.from({ length: totalTables }, (_, i) => {
      const tableId = i + 1;
      const occupiedOrder = orders.find(o => o.tableId === tableId && (o.status === 'active' || o.status === 'preparing'));
      return {
        id: tableId,
        status: occupiedOrder ? 'occupied' : 'available',
        orderId: occupiedOrder?.id
      };
    });
  }, [orders, config]);

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
    resetTableLock,
    // Expenses
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    // Employees
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    // Daily Data
    dailyData,
    setInitialCash,
    // Derived data
    tables,
  };
}
