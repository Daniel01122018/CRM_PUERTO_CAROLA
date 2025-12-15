
import type { Order } from '@/types';
import { FirestoreItem } from '@/hooks/use-menu';
import { ALL_MENU_ITEMS } from '@/lib/data';

export interface OrderStats {
    revenue: number;
    paymentMethods: { [key: string]: number };
    itemSales: { [itemId: string]: { name: string; quantity: number; revenue: number } };
}

export function findMenuItem(menuItems: FirestoreItem[], id: string | number): { name: string; price: number; category?: string; contexto?: 'salon' | 'llevar' } | null {
    if (!menuItems || menuItems.length === 0) return null;

    const idStr = id.toString();

    // 1. Try Firestore Items first
    const menuItem = menuItems.find(i => i.id === idStr || i.oldId === Number(id));
    if (menuItem) {
        return {
            name: menuItem.name,
            price: menuItem.price,
            category: menuItem.categoryName,
            contexto: menuItem.type === 'plato' ? 'salon' : undefined // Infer or map if needed, or maybe add to FirestoreItem
        };
    }

    // 2. Try variants
    for (const i of menuItems) {
        if (i.variants) {
            // Loose comparison for ID to handle string/number mismatch
            const v = i.variants.find((v: any) => v.id == id);
            if (v) {
                return {
                    name: `${i.name} ${v.nombre}`,
                    price: v.precio,
                    category: i.categoryName, // Inherit category from parent
                    contexto: v.contexto
                };
            }
        }
    }

    // 3. Fallback to ALL_MENU_ITEMS (Static Data)
    const staticItem = ALL_MENU_ITEMS.find(i => i.id == id);
    if (staticItem) {
        return {
            name: staticItem.nombre,
            price: staticItem.precio,
            category: staticItem.category,
            contexto: staticItem.contexto
        };
    }

    return null;
}

export function calculateOrderStats(order: Order | (Omit<Order, 'id'> & { id?: string }), menuItems: FirestoreItem[]): OrderStats {
    const revenue = order.total;
    const paymentMethod = order.paymentMethod || 'efectivo';

    const itemSales: { [itemId: string]: { name: string; quantity: number; revenue: number } } = {};

    if (order.items) {
        order.items.forEach(item => {
            const itemId = item.menuItemId.toString();

            // Default values
            let name = "Item Desconocido";
            let price = 0;

            // Use shared helper for lookup
            const foundItem = findMenuItem(menuItems, item.menuItemId);
            if (foundItem) {
                name = foundItem.name;
                price = foundItem.price;
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
