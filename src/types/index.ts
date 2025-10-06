
export interface MenuItemVariant {
  id: number;
  nombre: string;
  precio: number;
  contexto: 'salon' | 'llevar';
  customPrice?: boolean;
}

export interface MenuPlato {
  id: number;
  nombre: string;
  category: 'Platos';
  variantes: MenuItemVariant[];
}

export interface MenuItem {
  id: number;
  nombre: string;
  precio: number;
  category: 'Platos' | 'Bebidas' | 'Adicionales';
  sabores?: string[];
  customPrice?: boolean;
  inventoryItemId?: string; 
  paraLlevar?: boolean; // Para items que solo aparecen en modo "llevar"
  baseNombre?: string; // Nombre del plato base si es una variante
}

export interface OrderItem {
  menuItemId: number;
  quantity: number;
  notes: string;
  customPrice?: number;
  contexto: 'salon' | 'llevar'; // Para diferenciar precios de salón y llevar en una misma orden
}

export type OrderStatus = 'active' | 'preparing' | 'completed' | 'cancelled';
export type PaymentMethod = 'Efectivo' | 'DeUna' | 'Transferencia';

export interface Order {
  id: string; // timestamp based
  tableId: number | 'takeaway';
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: number;
  cancelledAt?: number;
  notes?: string;
  paymentMethod?: PaymentMethod;
}

export interface Table {
  id: number;
  status: 'available' | 'occupied';
  orderId?: string;
}

export interface User {
  username: string;
  role: 'employee' | 'admin' | 'kitchen';
}

export type ExpenseCategory = string;
export type ExpenseSource = 'caja' | 'caja_chica';

export interface Employee {
    id: string;
    name: string;
    role: string;
    createdAt: number;
}

export interface Expense {
    id:string;
    amount: number;
    category: ExpenseCategory;
    source: ExpenseSource;
    createdAt: number;
    createdBy: string;
    employeeId?: string;
    employeeName?: string;
    inventoryItemId?: string;
    inventoryItemQuantity?: number;
}

export interface DailyData {
    date: string; // YYYY-MM-DD format
    initialCash: number;
}

export interface InventoryItem {
    id: string;
    name: string;
    stock: number;
    unit: string; // 'unidades', 'libras', 'litros', etc.
    lowStockThreshold: number;
    createdAt: number;
}
