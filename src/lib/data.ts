import type { MenuItem } from '@/types';

export const MENU_ITEMS: MenuItem[] = [
  { id: 1, name: 'ENCEBOLLADO', price: 5.00, category: 'Platos Fuertes' },
  { id: 2, name: 'GUATITA CON ARROZ', price: 6.50, category: 'Platos Fuertes' },
  { id: 3, name: 'BANDERA', price: 7.50, category: 'Platos Fuertes' },
  { id: 4, name: 'CEVICHE DE CAMARÓN', price: 8.00, category: 'Platos Fuertes' },
  { id: 5, name: 'SECO DE CHIVO', price: 7.00, category: 'Platos Fuertes' },
  
  { id: 10, name: 'COCA-COLA', price: 1.50, category: 'Bebidas' },
  { id: 11, name: 'JUGO DE NARANJA', price: 2.00, category: 'Bebidas' },
  { id: 12, name: 'AGUA SIN GAS', price: 1.00, category: 'Bebidas' },

  { id: 20, name: 'PORCIÓN DE ARROZ', price: 1.00, category: 'Extras' },
  { id: 21, name: 'CHIFLE', price: 0.75, category: 'Extras' },
  { id: 22, name: 'AJÍ CRIOLLO', price: 0.50, category: 'Extras' },
  { id: 23, name: 'PORCIÓN DE PAN', price: 0.50, category: 'Extras' },
];

export const USERS = {
    'Elena': '0123456789',
    'Mesero1': '1234567890',
    'admin1': 'admin01',
    'cocina': 'cocina01'
};

export const TOTAL_TABLES = 10;
