import type { MenuItem } from '@/types';

export const MENU_ITEMS: MenuItem[] = [
  // Platos
  { id: 32, nombre: "ENCEBOLLADO Jr", precio: 2.00, category: 'Platos' },
  { id: 1, nombre: "ENCEBOLLADO", precio: 2.50, category: 'Platos' },
  { id: 2, nombre: "ENCEBOLLADO MIXTO", precio: 4.00, category: 'Platos' },
  { id: 40, nombre: "ENCEBOLLADO MIXTO PEQ.", precio: 3.00, category: 'Platos' },
  { id: 3, nombre: "GUATITA CON ARROZ", precio: 3.00, category: 'Platos' },
  { id: 4, nombre: "BOLLO DE PESCADO", precio: 3.00, category: 'Platos' },
  { id: 5, nombre: "BOLLO MIXTO CON CAMARÓN", precio: 4.50, category: 'Platos' },
  { id: 6, nombre: "BANDERA 2 INGREDIENTES", precio: 4.00, category: 'Platos' },
  { id: 7, nombre: "BANDERA TRADICIONAL", precio: 4.50, category: 'Platos' },
  { id: 8, nombre: "BANDERA 4 INGREDIENTES", precio: 5.00, category: 'Platos' },
  { id: 9, nombre: "BANDERA COMPLETA", precio: 5.50, category: 'Platos' },
  { id: 10, nombre: "CEVICHE DE CAMARÓN", precio: 5.00, category: 'Platos' },
  { id: 11, nombre: "PORCIÓN DE GUATA SIN ARROZ", precio: 3.00, category: 'Platos' },
  { id: 12, nombre: "ENCOCADO DE ALBACORA", precio: 3.50, category: 'Platos' },
  { id: 13, nombre: "ENCOCADO DE CAMARÓN", precio: 4.00, category: 'Platos' },
  { id: 14, nombre: "ENCOCADO MIXTO CAMARÓN Y PESCADO", precio: 4.50, category: 'Platos' },
  { id: 15, "nombre": "CAZUELA DE ALBACORA", "precio": 3.50, "category": "Platos" },
  { id: 16, nombre: "CAZUELA DE CAMARÓN", precio: 4.00, category: 'Platos' },
  { id: 17, nombre: "CAZUELA MIXTA CAMARÓN Y PESCADO", precio: 4.50, category: 'Platos' },
  { id: 18, nombre: "TORTILLA DE CAMARONES", precio: 4.00, category: 'Platos' },

  // Adicionales
  { id: 19, nombre: "PORCIÓN DE ARROZ", precio: 0.50, category: 'Adicionales' },
  { id: 20, nombre: "CHIFLE", precio: 0.50, category: 'Adicionales', inventoryItemId: 'chifles-bolsa' },
  { id: 21, nombre: "PAN", precio: 0.25, category: 'Adicionales' },
  { id: 22, nombre: "MAIZ TOSTADO", precio: 0.25, category: 'Adicionales' },
  { id: 23, nombre: "TARRINA/CONTENEDOR", precio: 0.25, category: 'Adicionales' },
  { id: 34, nombre: "TOSTADA DE QUESO", precio: 1.00, category: 'Adicionales' },
  { id: 35, nombre: "TOSTADA MIXTA", precio: 1.25, category: 'Adicionales' },

  // Bebidas
  { id: 24, nombre: "COLA PERSONAL", precio: 0.75, category: 'Bebidas', sabores: ["COCA COLA", "SPRITE", "FANTA", "FIORAVANTI", "INCA COLA"], inventoryItemId: 'cola-personal-unidad' },
  { id: 25, nombre: "BATIDO", precio: 1.50, category: 'Bebidas', sabores: ["FRUTILLA", "MORA", "GUINEO", "CHOCOLATE", "MANGO"] },
  { id: 26, nombre: "Cola 1,35L", precio: 2.00, category: 'Bebidas' },
  { id: 36, nombre: "Café/Té", precio: 0.75, category: 'Bebidas' },
  { id: 37, nombre: "Jugo grande", precio: 1.00, category: 'Bebidas' },
  { id: 38, nombre: "Jugo pequeño", precio: 0.50, category: 'Bebidas' },
  { id: 39, nombre: "AGUA", precio: 0.75, category: 'Bebidas' },
  { id: 40, nombre: "FUZE TEA", precio: 0.75, category: 'Bebidas' },
  
];

export const TAKEAWAY_MENU_ITEMS: MenuItem[] = [
  // Aquí va tu nueva lista de platos para llevar con precios actualizados.
  // He copiado algunos como ejemplo. ¡Modifícalos y añade los que faltan!
  // Los ID deben ser únicos en esta lista, pero no tienen que coincidir con los de la lista principal.

  // Platos para Llevar
  { id: 101, nombre: "ENCEBOLLADO JR", precio: 2.00, category: 'Platos' },
  { id: 102, nombre: "ENCEBOLLADO", precio: 2.50, category: 'Platos' },
  { id: 103, nombre: "ENCEBOLLADO T. LLENA", precio: 3.00, category: 'Platos' },
  { id: 104, nombre: "ENCEBOLLADO MIXTO", precio: 4.25, category: 'Platos' },
  { id: 105, nombre: "GUATITA CON ARROZ", precio: 3.25, category: 'Platos' },
  { id: 106, nombre: "BOLLO DE PESCADO", precio: 3.00, category: 'Platos' },
  { id: 107, nombre: "BOLLO MIXTO CON CAMARÓN", precio: 4.25, category: 'Platos' },
  { id: 108, nombre: "GUATITA MEDIA TARRINA", precio: 3.25, category: 'Platos' },
  { id: 109, nombre: "GUATITA TARRINA LLENA", precio: 6.25, category: 'Platos' },
  { id: 110, nombre: "CAZUELA MEDIA TARRINA", precio: 3.50, category: 'Platos' },
  { id: 111, nombre: "CAZUELA T. LLENA", precio: 7.00, category: 'Platos' },
  { id: 112, nombre: "Encebollado en Olla", precio: 0, category: 'Platos', customPrice: true },
  { id: 113, nombre: "BANDERA 2 INGREDIENTES", precio: 4.25, category: 'Platos' },
  { id: 114, nombre: "BANDERA TRADICIONAL", precio: 4.75, category: 'Platos' },
  { id: 115, nombre: "BANDERA 4 INGREDIENTES", precio: 5.25, category: 'Platos' },
  { id: 116, nombre: "BANDERA COMPLETA", precio: 5.75, category: 'Platos' },
  { id: 117, nombre: "CEVICHE DE CAMARÓN", precio: 5.25, category: 'Platos' },
  { id: 118, nombre: "ENCOCADO DE ALBACORA", precio: 3.75, category: 'Platos' },
  { id: 119, nombre: "ENCOCADO DE CAMARÓN", precio: 4.25, category: 'Platos' },
  { id: 120, nombre: "ENCOCADO MIXTO CAMARÓN Y PESCADO", precio: 4.75, category: 'Platos' },
  { id: 121, nombre: "CAZUELA DE ALBACORA", "precio": 3.75, "category": "Platos" },
  { id: 122, nombre: "CAZUELA DE CAMARÓN", precio: 4.25, category: 'Platos' },
  { id: 123, nombre: "CAZUELA MIXTA CAMARÓN Y PESCADO", precio: 4.75, category: 'Platos' },
  { id: 124, nombre: "TORTILLA DE CAMARONES", precio: 4.25, category: 'Platos' },

  // Adicionales y Bebidas (puedes copiarlos de la lista principal si tienen el mismo precio)
  { id: 201, nombre: "PORCIÓN DE ARROZ", precio: 0.50, category: 'Adicionales' },
  { id: 208, nombre: "TARRINA DE ARROZ", precio: 1.25, category: 'Adicionales' },
  { id: 202, nombre: "CHIFLE", precio: 0.50, category: 'Adicionales', inventoryItemId: 'chifles-bolsa' },
  { id: 203, nombre: "PAN", precio: 0.25, category: 'Adicionales' },
  { id: 204, nombre: "MAIZ TOSTADO", precio: 0.25, category: 'Adicionales' },
  { id: 205, nombre: "TARRINA/CONTENEDOR", precio: 0.25, category: 'Adicionales' },
  { id: 206, nombre: "TOSTADA DE QUESO", precio: 1.00, category: 'Adicionales' },
  { id: 207, nombre: "TOSTADA MIXTA", precio: 1.25, category: 'Adicionales' },

  { id: 301, nombre: "COLA PERSONAL", precio: 0.75, category: 'Bebidas', sabores: ["COCA COLA", "SPRITE", "FANTA", "FIORAVANTI", "INCA COLA"], inventoryItemId: 'cola-personal-unidad' },
  { id: 302, nombre: "BATIDO", precio: 1.50, category: 'Bebidas', sabores: ["FRUTILLA", "MORA", "GUINEO", "CHOCOLATE", "MANGO"] },
  { id: 303, nombre: "Cola 1,35L", precio: 2.00, category: 'Bebidas' },
  { id: 304, nombre: "Café/Té", precio: 0.75, category: 'Bebidas' },
  { id: 305, nombre: "Jugo grande", precio: 1.00, category: 'Bebidas' },
  { id: 306, nombre: "Jugo pequeño", precio: 0.50, category: 'Bebidas' },
  { id: 307, nombre: "AGUA", precio: 0.75, category: 'Bebidas' },
  { id: 308, nombre: "FUZE TEA", precio: 0.75, category: 'Bebidas' },
];


export const USERS = {
    'Caja001': { id: 'user-elena', password: '0123456789', role: 'employee' as const },
    'Mesero1': { id: 'user-mesero1', password: '1234567890', role: 'employee' as const },
    'admin1': { id: 'user-admin1', password: 'admin001', role: 'admin' as const },
    'cocina': { id: 'user-cocina', password: 'cocina01', role: 'kitchen' as const }
};

export const TOTAL_TABLES = 12;
