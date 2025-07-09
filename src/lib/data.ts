import type { MenuItem } from '@/types';

export const MENU_ITEMS: MenuItem[] = [
  // Platos
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

  // Bebidas
  { id: 24, nombre: "COCA PERSONAL", precio: 0.75, category: 'Bebidas', sabores: ["COCA COLA", "SPRITE", "FANTA", "FIORAVANTI", "INCA COLA"] },
  { id: 25, nombre: "BATIDO", precio: 1.25, category: 'Bebidas', sabores: ["FRUTILLA", "MORA", "GUINEO", "CHOCOLATE", "MANGO"] },
  { id: 26, nombre: "Cola 1,35L", precio: 2.50, category: 'Bebidas' },
];

export const USERS = {
    'Elena': '0123456789',
    'Mesero1': '1234567890',
    'admin1': 'admin01',
    'cocina': 'cocina01'
};

export const TOTAL_TABLES = 10;
