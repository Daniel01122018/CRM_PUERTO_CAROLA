/**
 * Types for App Orders - Orders from the mobile customer app
 * Stored in the AppOrders collection
 */

export type AppOrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type AppOrderDeliveryType = 'pickup' | 'delivery';
export type AppOrderPaymentStatus = 'pending' | 'paid';

export interface AppOrderItem {
    menuItemId: string;
    menuItemName: string;
    notes: string;
    quantity: number;
    unitPrice: number;
}

export interface AppOrder {
    id: string;

    // Status and timestamps
    status: AppOrderStatus;
    createdAt: number;
    confirmedAt: number | null;
    preparingAt: number | null;
    readyAt: number | null;
    completedAt: number | null;
    cancelledAt: number | null;
    updatedAt: number;

    // Customer info
    customerId: string;
    customerName: string;
    customerPhone: string;
    fcmToken: string | null; // For future push notifications

    // Delivery
    deliveryType: AppOrderDeliveryType;
    deliveryAddress: string | null;
    deliveryFee: number;
    pickupTime: number | null;

    // Order items
    items: AppOrderItem[];

    // Payment
    paymentMethod: 'Efectivo' | 'DeUna' | 'Transferencia' | null;
    paymentStatus: AppOrderPaymentStatus;

    // Totals
    subtotal: number;
    total: number;
    notes: string;
}

// Status display helpers
export const APP_ORDER_STATUS_LABELS: Record<AppOrderStatus, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Listo',
    completed: 'Completado',
    cancelled: 'Cancelado'
};

export const APP_ORDER_STATUS_COLORS: Record<AppOrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
    preparing: 'bg-orange-100 text-orange-800 border-orange-300',
    ready: 'bg-green-100 text-green-800 border-green-300',
    completed: 'bg-gray-100 text-gray-800 border-gray-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300'
};

// Next valid states for each status
export const APP_ORDER_NEXT_STATES: Record<AppOrderStatus, AppOrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
};
