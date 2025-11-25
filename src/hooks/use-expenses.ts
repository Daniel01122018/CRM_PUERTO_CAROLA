
"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Expense } from '@/types';
import { useAuth } from './use-auth';
import { updateDailyStats } from '@/lib/daily-stats';

export function useExpenses() {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[] | undefined>(undefined);

  useEffect(() => {
    // Optimization: Only fetch expenses for the current month by default
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const q = query(
      collection(db, 'expenses'),
      where('createdAt', '>=', startOfMonth)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const expensesData: Expense[] = [];
      querySnapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() } as Expense);
      });
      setExpenses(expensesData);
    }, (error) => {
      console.error("Error fetching expenses from Firestore:", error);
      setExpenses([]);
    });

    return () => unsubscribe();
  }, []);

  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!currentUser) {
      throw new Error("No hay usuario autenticado para registrar un gasto.");
    }
    const newExpense = {
      ...expenseData,
      createdAt: Date.now(),
      createdBy: currentUser.username,
    };
    await addDoc(collection(db, 'expenses'), newExpense);

    // Update daily stats
    await updateDailyStats(new Date(), {
      expenses: expenseData.amount
    });
  }, [currentUser]);

  const updateExpense = useCallback(async (expenseId: string, updatedData: Partial<Omit<Expense, 'id'>>) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Solo los administradores pueden actualizar gastos.");
    }
    const expenseRef = doc(db, 'expenses', expenseId);

    // If amount is changing, we need to adjust stats. 
    // This is complex because we need the old amount.
    // For now, let's assume updates are rare or small fixes.
    // Ideally we should fetch old doc, compare amounts, and update stats diff.
    // Let's implement it properly.

    const expenseSnap = await getDoc(expenseRef);
    if (expenseSnap.exists()) {
      const oldData = expenseSnap.data() as Expense;
      if (updatedData.amount !== undefined && updatedData.amount !== oldData.amount) {
        const diff = updatedData.amount - oldData.amount;
        await updateDailyStats(new Date(oldData.createdAt), {
          expenses: diff
        });
      }
    }

    await updateDoc(expenseRef, updatedData);
  }, [currentUser]);

  const deleteExpense = useCallback(async (expenseId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Solo los administradores pueden eliminar gastos.");
    }
    const expenseRef = doc(db, 'expenses', expenseId);

    // Fetch expense to get amount for stats adjustment
    const expenseSnap = await getDoc(expenseRef);
    if (expenseSnap.exists()) {
      const expenseData = expenseSnap.data() as Expense;
      await updateDailyStats(new Date(expenseData.createdAt), {
        expenses: -expenseData.amount
      });
    }

    await deleteDoc(expenseRef);
  }, [currentUser]);

  return { expenses, addExpense, updateExpense, deleteExpense };
}
