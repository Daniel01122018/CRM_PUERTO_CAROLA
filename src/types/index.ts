export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: 'Platos Fuertes' | 'Bebidas' | 'Extras';
}

export interface OrderItem {
  menuItemId: number;
  quantity: number;
  notes: string;
}

export type OrderStatus = 'active' | 'preparing' | 'completed';

export interface Order {
  id: string; // timestamp based
  tableId: number | 'takeaway';
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: number;
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
