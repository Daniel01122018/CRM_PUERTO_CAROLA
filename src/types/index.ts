export interface MenuItem {
  id: number;
  nombre: string;
  precio: number;
  category: 'Platos' | 'Bebidas' | 'Adicionales';
  sabores?: string[];
  takeawayOnly?: boolean;
  customPrice?: boolean;
}

export interface OrderItem {
  menuItemId: number;
  quantity: number;
  notes: string;
  customPrice?: number;
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
  partialPayments?: { amount: number; method: PaymentMethod; timestamp: number }[];
  partialPaymentsTotal?: number;
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
}

export interface DailyData {
    date: string; // YYYY-MM-DD format
    initialCash: number;
}

    