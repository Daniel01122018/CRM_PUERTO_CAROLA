
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Expense } from '@/types';
import { useAuth } from './use-auth';

export function useExpenses() {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[] | undefined>(undefined);

  useEffect(() => {
    const q = query(collection(db, 'expenses'));
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
  }, [currentUser]);

  const updateExpense = useCallback(async (expenseId: string, updatedData: Partial<Omit<Expense, 'id'>>) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Solo los administradores pueden actualizar gastos.");
    }
    const expenseRef = doc(db, 'expenses', expenseId);
    await updateDoc(expenseRef, updatedData);
  }, [currentUser]);

  const deleteExpense = useCallback(async (expenseId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Solo los administradores pueden eliminar gastos.");
    }
    const expenseRef = doc(db, 'expenses', expenseId);
    await deleteDoc(expenseRef);
  }, [currentUser]);

  return { expenses, addExpense, updateExpense, deleteExpense };
}
