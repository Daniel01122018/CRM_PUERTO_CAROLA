
"use client";

import Dexie, { type EntityTable } from 'dexie';
import type { Order, Expense, Employee, DailyData, InventoryItem } from '@/types';

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
    inventory!: EntityTable<InventoryItem, 'id'>;

    constructor() {
        super('ElPuertoDeCarolaDB');
        
        // 3. Define el esquema de la base de datos
        // Aquí le decimos a Dexie cómo están estructuradas nuestras tablas.
        // 'id' será la clave primaria (primary key).
        // 'status', 'createdAt', 'tableId' son "índices" (indexes).
        // Los índices son cruciales para hacer búsquedas y filtros rápidos
        // sin tener que leer toda la tabla cada vez.
        this.version(1).stores({
            orders: 'id, tableId, status, createdAt',
            expenses: 'id, category, createdAt',
            employees: 'id, name, createdAt'
        });
        
        // Nueva versión para añadir el índice 'source' a la tabla de gastos
        this.version(2).stores({
            orders: 'id, tableId, status, createdAt',
            expenses: 'id, category, createdAt, source',
            employees: 'id, name, createdAt'
        });

        this.version(3).stores({
            dailyData: '&date', // 'date' es la clave primaria (YYYY-MM-DD)
        });

        this.version(4).stores({
            inventory: 'id, name, createdAt'
        });
    }
}

// 4. Crea una instancia única de la base de datos
// Esto asegura que toda la aplicación use la misma conexión a la base de datos.
export const db = new ElPuertoDeCarolaDB();
