/**
 * Types for the App Menu - Denormalized menu structure for mobile app
 * This menu is independent from the POS menu (categories + items collections)
 */

export interface AppMenuVariant {
    id: number;
    nombre: string;
    precio: number;
    contexto: 'salon' | 'llevar';
}

export interface AppMenuItem {
    id: string;
    name: string;
    price: number;
    categoryId: string;
    categoryName: string;
    isAvailable: boolean;
    type: 'plato' | 'item';
    order: number;
    variants?: AppMenuVariant[];
    description?: string;
    imageUrl?: string;
}

export interface AppMenuCategory {
    id: string;
    name: string;
    order: number;
}

export interface AppMenuDocument {
    categories: AppMenuCategory[];
    items: AppMenuItem[];
    updatedAt: number;
    updatedBy: string;
}
