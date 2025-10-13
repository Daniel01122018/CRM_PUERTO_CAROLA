
"use client";

import Dexie, { type EntityTable } from 'dexie';
import type { Order, Expense, Employee, DailyData } from '@/types';

// 1. Define la clase de la base de datos
// Hereda de Dexie y le da un nombre 'ElPuertoDeCarolaDB'.
class ElPuertoDeCarolaDB extends Dexie {
    // 2. Define las "tablas" (Object Stores)
    // Estas son las propiedades que Dexie usará para acceder a tus datos.
    // Usamos 'EntityTable' para obtener una tipificación fuerte con nuestras interfaces.
    orders!: EntityTable<Order, 'id'>;
    expenses!: EntityTable<Expense, 'id'>;
    employees!: EntityTable<Employee, 'id'>;
    dailyData!: EntityTable<DailyData, 'date'>;

    constructor() {
        super('ElPuertoDeCarolaDB');
        
        // 3. Define el esquema de la base de datos
        // Se definen todas las tablas y sus índices en una única versión para evitar problemas de migración.
        // La versión 4 eliminó la tabla 'inventory'
        this.version(4).stores({
            orders: 'id, tableId, status, createdAt',
            expenses: 'id, category, createdAt, source',
            employees: 'id, name, createdAt',
            dailyData: '&date', // 'date' es la clave primaria (YYYY-MM-DD)
        }).upgrade(tx => {
            // Este upgrade se asegura que si un usuario viene de una versión anterior, la tabla 'inventory' se elimine.
            return tx.table('inventory').clear();
        });
        
        // Mantenemos la definición de versiones anteriores para asegurar una migración correcta
        // para usuarios que no hayan actualizado la app en mucho tiempo.
        this.version(3).stores({
            orders: 'id, tableId, status, createdAt',
            expenses: 'id, category, createdAt, source',
            employees: 'id, name, createdAt',
            dailyData: '&date',
            inventory: 'id, name'
        });
        this.version(2).stores({
            orders: 'id, tableId, status, createdAt',
            expenses: 'id, category, createdAt, source',
            employees: 'id, name, createdAt',
            dailyData: '&date',
        });
        this.version(1).stores({
            orders: 'id, tableId, status, createdAt',
            expenses: 'id, category, createdAt, source',
            employees: 'id, name, createdAt',
        });
    }
}

// Para manejar el caso donde Dexie elimina una tabla, necesitamos re-evaluar cómo definimos las versiones.
// La forma correcta es definir el esquema final en la última versión.
// Si un usuario tiene una versión antigua, Dexie migrará secuencialmente.
class CleanedElPuertoDeCarolaDB extends Dexie {
    orders!: EntityTable<Order, 'id'>;
    expenses!: EntityTable<Expense, 'id'>;
    employees!: EntityTable<Employee, 'id'>;
    dailyData!: EntityTable<DailyData, 'date'>;

    constructor() {
        super('ElPuertoDeCarolaDB');
        this.version(4).stores({
            orders: 'id, tableId, status, createdAt',
            expenses: 'id, category, createdAt, source',
            employees: 'id, name, createdAt',
            dailyData: '&date',
            // La tabla 'inventory' ya no se lista aquí, Dexie la eliminará al migrar.
        });
    }
}


// 4. Crea una instancia única de la base de datos
// Esto asegura que toda la aplicación use la misma conexión a la base de datos.
export const db = new CleanedElPuertoDeCarolaDB();
