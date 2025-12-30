
import type { Order, FirestoreItem } from '@/types';
import { ALL_MENU_ITEMS } from '@/lib/data';

export interface OrderStats {
    revenue: number;
    paymentMethods: { [key: string]: number };
    itemSales: { [itemId: string]: { name: string; quantity: number; revenue: number } };
}

export interface FoundMenuItem {
    name: string;
    price: number;
    category?: string;
    contexto?: 'salon' | 'llevar';
}

export function findMenuItem(menuItems: FirestoreItem[], id: string | number): FoundMenuItem | null {
    if (!menuItems && typeof id === 'undefined') return null;

    const idStr = id?.toString();
    const idNum = Number(id);

    // 1. Try Firestore Items first
    const menuItem = menuItems?.find(i => i.id === idStr || i.oldId === idNum);
    if (menuItem) {
        let contexto: 'salon' | 'llevar' | undefined = undefined;
        if (menuItem.paraLlevar) contexto = 'llevar';

        return {
            name: menuItem.name,
            price: menuItem.price,
            category: menuItem.categoryName,
            contexto
        };
    }

    // 2. Try variants
    if (menuItems) {
        for (const i of menuItems) {
            if (i.variants) {
                const v = i.variants.find((v: any) => v.id == id);
                if (v) {
                    return {
                        name: `${i.name} ${v.nombre}`,
                        price: v.precio,
                        category: i.categoryName,
                        contexto: v.contexto
                    };
                }
            }
        }
    }

    // 3. Fallback to Static Data
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

            let name = "Item Desconocido";
            let price = 0;

            const foundItem = findMenuItem(menuItems, item.menuItemId);
            if (foundItem) {
                name = foundItem.name;
                price = foundItem.price;
            }

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
