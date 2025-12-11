
import type { Order, FirestoreItem } from '@/types';
import { ALL_MENU_ITEMS } from '@/lib/data';

export interface OrderStats {
    revenue: number;
    paymentMethods: { [key: string]: number };
    itemSales: { [itemId: string]: { name: string; quantity: number; revenue: number } };
}

export function calculateOrderStats(order: Order | (Omit<Order, 'id'> & { id?: string }), menuItems: FirestoreItem[]): OrderStats {
    const revenue = order.total;
    const paymentMethod = order.paymentMethod || 'efectivo';

    const itemSales: { [itemId: string]: { name: string; quantity: number; revenue: number } } = {};

    if (order.items) {
        order.items.forEach(item => {
            const itemId = item.menuItemId.toString();
            // Find item name and price
            let name = "Item Desconocido";
            let price = 0;
            let found = false;

            // 1. Try Firestore Items first
            if (menuItems && menuItems.length > 0) {
                const menuItem = menuItems.find(i => i.id === itemId || i.oldId === item.menuItemId);

                if (menuItem) {
                    name = menuItem.name;
                    price = menuItem.price;
                    found = true;
                } else {
                    // Try variants in Firestore items
                    for (const i of menuItems) {
                        if (i.variants) {
                            // Loose comparison for ID to handle string/number mismatch
                            const v = i.variants.find((v: any) => v.id == item.menuItemId);
                            if (v) {
                                name = `${i.name} ${v.nombre}`;
                                price = v.precio;
                                found = true;
                                break;
                            }
                        }
                    }
                }
            }

            // 2. Fallback to ALL_MENU_ITEMS (Static Data) if not found
            if (!found) {
                // ALL_MENU_ITEMS is a flat list including variants
                const staticItem = ALL_MENU_ITEMS.find(i => i.id == item.menuItemId);
                if (staticItem) {
                    name = staticItem.nombre; // static items use 'nombre'
                    price = staticItem.precio;
                    found = true;
                }
            }

            // Override with custom price if present
            if (item.customPrice) price = item.customPrice;

            const itemRevenue = price * item.quantity;

            if (!itemSales[itemId]) {
                itemSales[itemId] = { name, quantity: 0, revenue: 0 };
            }
            itemSales[itemId].quantity += item.quantity;
            itemSales[itemId].revenue += itemRevenue;
        });
    }

    return {
        revenue,
        paymentMethods: { [paymentMethod]: revenue },
        itemSales
    };
}
