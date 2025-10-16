
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, addDoc, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Employee } from '@/types';
import { useAuth } from './use-auth';
import { USERS as staticUsers } from '@/lib/data';

export function useEmployees() {
  const { currentUser } = useAuth();
  const [manualEmployees, setManualEmployees] = useState<Employee[] | undefined>(undefined);

  useEffect(() => {
    const q = query(collection(db, 'employees'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const employeesData: Employee[] = [];
      querySnapshot.forEach((doc) => {
        employeesData.push({ id: doc.id, ...doc.data() } as Employee);
      });
      setManualEmployees(employeesData);
    }, (error) => {
      console.error("Error fetching employees from Firestore:", error);
      setManualEmployees([]);
    });

    return () => unsubscribe();
  }, []);

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

  const addEmployee = useCallback(async (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    if (!currentUser || currentUser.role !== 'admin') {
      console.error("Only admins can add employees.");
      throw new Error("Acción no permitida.");
    }
    const newEmployee = {
      ...employee,
      createdAt: Date.now(),
    };
    await addDoc(collection(db, 'employees'), newEmployee);
  }, [currentUser]);

  return { employees, addEmployee };
}
