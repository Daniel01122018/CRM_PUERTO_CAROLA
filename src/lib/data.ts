import type { MenuItem } from '@/types';

export const MENU_ITEMS: MenuItem[] = [
  // Platos
  { id: 32, nombre: "ENCEBOLLADO Jr", precio: 2.00, category: 'Platos' },
  { id: 1, nombre: "ENCEBOLLADO", precio: 2.50, category: 'Platos' },
  { id: 2, nombre: "ENCEBOLLADO MIXTO", precio: 4.00, category: 'Platos' },
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
  { id: 15, nombre: "CAZUELA DE ALBACORA", precio: 3.50, category: 'Platos' },
  { id: 16, nombre: "CAZUELA DE CAMARÓN", precio: 4.00, category: 'Platos' },
  { id: 17, nombre: "CAZUELA MIXTA CAMARÓN Y PESCADO", precio: 4.50, category: 'Platos' },
  { id: 18, nombre: "TORTILLA DE CAMARONES", precio: 4.00, category: 'Platos' },

  // Adicionales
  { id: 19, nombre: "PORCIÓN DE ARROZ", precio: 0.50, category: 'Adicionales' },
  { id: 20, nombre: "CHIFLE", precio: 0.50, category: 'Adicionales' },
  { id: 21, nombre: "PAN", precio: 0.25, category: 'Adicionales' },
  { id: 22, nombre: "MAIZ TOSTADO", precio: 0.25, category: 'Adicionales' },
  { id: 23, nombre: "TARRINA/CONTENEDOR", precio: 0.25, category: 'Adicionales' },
  { id: 34, nombre: "TOSTADA DE QUESO", precio: 1.00, category: 'Adicionales' },
  { id: 35, nombre: "TOSTADA MIXTA", precio: 1.25, category: 'Adicionales' },

  // Bebidas
  { id: 24, nombre: "COLA PERSONAL", precio: 0.75, category: 'Bebidas', sabores: ["COCA COLA", "SPRITE", "FANTA", "FIORAVANTI", "INCA COLA"] },
  { id: 25, nombre: "BATIDO", precio: 1.50, category: 'Bebidas', sabores: ["FRUTILLA", "MORA", "GUINEO", "CHOCOLATE", "MANGO"] },
  { id: 26, nombre: "Cola 1,35L", precio: 2.00, category: 'Bebidas' },
  { id: 32, nombre: "Jugo grande", precio: 1.00, category: 'Bebidas' },
  { id: 33, nombre: "Jugo pequeño", precio: 0.50, category: 'Bebidas' },
  { id: 36, nombre: "Café/Té", precio: 0.75, category: 'Bebidas' },
  
  // Platos solo para llevar
  { id: 27, nombre: "Guatita Media tarrina", precio: 3.25, category: 'Platos', takeawayOnly: true },
  { id: 28, nombre: "Guatita Tarrina LLena", precio: 6.25, category: 'Platos', takeawayOnly: true },
  { id: 29, nombre: "Cazuela Media Tarrina", precio: 6.50, category: 'Platos', takeawayOnly: true },
  { id: 30, nombre: "Cazuela Tarrina LLena", precio: 6.50, category: 'Platos', takeawayOnly: true },
  { id: 31, nombre: "Encebollado en Olla", precio: 0, category: 'Platos', customPrice: true, takeawayOnly: true },
  { id: 33, nombre: "ENCEBOLLADO T. LLENA", precio: 2.50, category: 'Platos', takeawayOnly: true },
];

export const USERS = {
    'Elena': { id: 'user-elena', password: '0123456789', role: 'waiter' as const },
    'Mesero1': { id: 'user-mesero1', password: '1234567890', role: 'waiter' as const },
    'admin1': { id: 'user-admin1', password: 'admin001', role: 'admin' as const },
    'cocina': { id: 'user-cocina', password: 'cocina01', role: 'kitchen' as const }
};

export const TOTAL_TABLES = 14;
