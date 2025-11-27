
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
  paraLlevar?: boolean; // Para items que solo aparecen en modo "llevar"
  baseNombre?: string; // Nombre del plato base si es una variante
  contexto?: 'salon' | 'llevar'; // Contexto de servicio
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
  id: string;
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

export interface DailyStats {
  date: string;
  totalRevenue: number;
  totalExpenses: number;
  orderCount: number;
  paymentMethods: { [key: string]: number };
  categoryBreakdown: { [key: string]: number };
  itemSales?: { [itemId: string]: { name: string; quantity: number; revenue: number } };
}

// ========================================
// Inventory Management Types
// ========================================

export type InventoryUnit = 'kg' | 'lb' | 'unidades' | 'litros' | 'bolsas' | 'cajas';
export type MovementType = 'entrada' | 'salida' | 'ajuste';

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  color?: string; // Para visualización en UI
  createdAt: number;
  createdBy: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string; // Denormalizado para consultas rápidas
  currentStock: number;
  unit: InventoryUnit;
  minStock: number; // Nivel mínimo para alertas
  maxStock?: number; // Nivel máximo sugerido (opcional)
  costPerUnit: number; // Costo promedio ponderado
  supplier?: string; // Proveedor habitual
  lastPurchaseDate?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string; // Denormalizado
  categoryId: string;
  categoryName: string; // Denormalizado
  type: MovementType;
  quantity: number;
  unit: InventoryUnit;
  costPerUnit?: number; // Solo para entradas
  totalCost?: number; // Solo para entradas (compras)
  reason?: string; // Motivo de salida o ajuste
  notes?: string;
  createdAt: number;
  createdBy: string;
  relatedExpenseId?: string; // Link al gasto si es una compra
  relatedOrderId?: string; // Si es deducción automática por receta
}

// Sistema de Recetas (Opcional)
export interface RecipeIngredient {
  itemId: string;
  itemName: string; // Denormalizado
  quantity: number;
  unit: InventoryUnit;
}

export interface Recipe {
  id: string;
  dishName: string; // Nombre del plato del menú
  menuItemId: number; // ID del item del menú
  ingredients: RecipeIngredient[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

