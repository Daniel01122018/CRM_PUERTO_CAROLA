export interface MenuItem {
  id: number;
  nombre: string;
  precio: number;
  category: 'Platos' | 'Bebidas' | 'Adicionales';
  sabores?: string[];
}

export interface OrderItem {
  menuItemId: number;
  quantity: number;
  notes: string;
}

export type OrderStatus = 'active' | 'preparing' | 'ready' | 'completed';

export interface Order {
  id: string; // timestamp based
  tableId: number | 'takeaway';
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: number;
  notes?: string;
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
