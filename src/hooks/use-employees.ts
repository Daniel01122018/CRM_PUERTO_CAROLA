"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./use-auth";
import { USERS as staticUsers } from "@/lib/data";
import type { Employee } from "@/types";

export function useEmployees() {
  const { currentUser } = useAuth();
  const [manualEmployees, setManualEmployees] = useState<Employee[] | undefined>(undefined);

  // 🔹 Fetch de empleados desde Firestore
  useEffect(() => {
    // 🔒 OPTIMIZATION: Only admins need employee data
    if (!currentUser || currentUser.role !== 'admin') {
      setManualEmployees([]);
      return;
    }

    const q = query(collection(db, "employees"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const employeesData: Employee[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Employee[];

        setManualEmployees(employeesData);
      },
      (error) => {
        console.error("Error fetching employees from Firestore:", error);
        setManualEmployees([]);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 🔹 Unificar empleados estáticos + Firestore
  const employees: Employee[] | undefined = useMemo(() => {
    if (!manualEmployees) return undefined;

    const staticEmployees: Employee[] = Object.entries(staticUsers).map(
      ([name, data]) => ({
        id: data.id,
        name,
        role: data.role,
        createdAt: 0,
      })
    );

    return [...staticEmployees, ...manualEmployees];
  }, [manualEmployees]);

  // 🔹 Añadir empleado
  const addEmployee = useCallback(
    async (employee: Omit<Employee, "id" | "createdAt">) => {
      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Acción no permitida.");
      }

      const newEmployee = {
        ...employee,
        createdAt: Date.now(),
      };

      await addDoc(collection(db, "employees"), newEmployee);
    },
    [currentUser]
  );

  // 🔹 Actualizar empleado
  const updateEmployee = useCallback(
    async (
      employeeId: string,
      updatedData: Partial<Omit<Employee, "id" | "createdAt">>
    ) => {
      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Solo los administradores pueden actualizar empleados.");
      }

      const employee = employees?.find((e) => e.id === employeeId);

      if (employee?.createdAt === 0) {
        throw new Error("Los usuarios estáticos no se pueden editar.");
      }

      const employeeRef = doc(db, "employees", employeeId);
      await updateDoc(employeeRef, updatedData);
    },
    [currentUser, employees]
  );

  // 🔹 Eliminar empleado
  const deleteEmployee = useCallback(
    async (employeeId: string) => {
      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Solo los administradores pueden eliminar empleados.");
      }

      const employee = employees?.find((e) => e.id === employeeId);

      if (employee?.createdAt === 0) {
        throw new Error("Los usuarios estáticos (Cajeros, Meseros) no se pueden eliminar.");
      }

      const employeeRef = doc(db, "employees", employeeId);
      await deleteDoc(employeeRef);
    },
    [currentUser, employees]
  );

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  };
}
