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
export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia';

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
  role: 'waiter' | 'admin' | 'kitchen';
}

export type ExpenseCategory = 'Proveedores' | 'Servicios' | 'Sueldos' | 'Marketing' | 'Mantenimiento' | 'Impuestos' | 'Otros';

export interface Expense {
    id: string;
    description: string;
    amount: number;
    category: ExpenseCategory;
    createdAt: number;
    createdBy: string;
}
