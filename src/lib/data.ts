
import type { MenuItem, MenuPlato } from '@/types';

export const MENU_PLATOS: MenuPlato[] = [
  {
    id: 1001,
    nombre: "Encebollado",
    category: 'Platos',
    variantes: [
      { id: 32, nombre: "Jr", precio: 2.00, contexto: 'salon' },
      { id: 1, nombre: "Normal", precio: 2.50, contexto: 'salon' },
      { id: 2, nombre: "Mixto", precio: 4.00, contexto: 'salon' },
      { id: 40, nombre: "Mixto Peq.", precio: 3.00, contexto: 'salon' },
      
      { id: 101, nombre: "Jr", precio: 2.25, contexto: 'llevar' },
      { id: 102, nombre: "Normal", precio: 2.75, contexto: 'llevar' },
      { id: 103, nombre: "T. Llena", precio: 3.25, contexto: 'llevar' },
      { id: 104, nombre: "Mixto", precio: 4.25, contexto: 'llevar' },
      { id: 999, nombre: "En Olla", precio: 0, contexto: 'llevar', customPrice: true },
    ]
  },
  {
    id: 1002,
    nombre: "Guatita",
    category: 'Platos',
    variantes: [
      { id: 3, nombre: "Con Arroz", precio: 3.00, contexto: 'salon' },
      { id: 11, nombre: "Sola (Porción)", precio: 3.00, contexto: 'salon' },
      
      { id: 105, nombre: "Con Arroz", precio: 3.25, contexto: 'llevar' },
      { id: 108, nombre: "Media Tarrina", precio: 3.25, contexto: 'llevar' },
      { id: 109, nombre: "Tarrina Llena", precio: 6.25, contexto: 'llevar' },
    ]
  },
  {
    id: 1003,
    nombre: "Bollo",
    category: 'Platos',
    variantes: [
      { id: 4, nombre: "De Pescado", precio: 3.00, contexto: 'salon' },
      { id: 5, nombre: "Mixto (con Camarón)", precio: 4.50, contexto: 'salon' },
      
      { id: 106, nombre: "De Pescado", precio: 3.00, contexto: 'llevar' },
      { id: 107, nombre: "Mixto (con Camarón)", precio: 4.25, contexto: 'llevar' },
    ]
  },
  {
    id: 1004,
    nombre: "Bandera",
    category: 'Platos',
    variantes: [
       { id: 6, nombre: "2 Ingredientes", precio: 4.00, contexto: 'salon' },
       { id: 7, nombre: "Tradicional", precio: 4.50, contexto: 'salon' },
       { id: 8, nombre: "4 Ingredientes", precio: 5.00, contexto: 'salon' },
       { id: 9, nombre: "Completa", precio: 5.50, contexto: 'salon' },
       
       { id: 113, nombre: "2 Ingredientes", precio: 4.25, contexto: 'llevar' },
       { id: 114, nombre: "Tradicional", precio: 4.75, contexto: 'llevar' },
       { id: 115, nombre: "4 Ingredientes", precio: 5.25, contexto: 'llevar' },
       { id: 116, nombre: "Completa", precio: 5.75, contexto: 'llevar' },
    ]
  },
  {
    id: 1005,
    nombre: "Ceviche",
    category: 'Platos',
    variantes: [
      { id: 10, nombre: "De Camarón", precio: 5.00, contexto: 'salon' },
      { id: 117, nombre: "De Camarón", precio: 5.25, contexto: 'llevar' },
    ]
  },
  {
    id: 1006,
    nombre: "Encocado",
    category: 'Platos',
    variantes: [
      { id: 12, nombre: "De Albacora", precio: 3.50, contexto: 'salon' },
      { id: 13, nombre: "De Camarón", precio: 4.00, contexto: 'salon' },
      { id: 14, nombre: "Mixto (Pescado y Camarón)", precio: 4.50, contexto: 'salon' },
      
      { id: 118, nombre: "De Albacora", precio: 3.75, contexto: 'llevar' },
      { id: 119, nombre: "De Camarón", precio: 4.25, contexto: 'llevar' },
      { id: 120, nombre: "Mixto (Pescado y Camarón)", precio: 4.75, contexto: 'llevar' },
    ]
  },
  {
    id: 1007,
    nombre: "Cazuela",
    category: 'Platos',
    variantes: [
      { id: 15, nombre: "De Albacora", precio: 3.50, contexto: 'salon' },
      { id: 16, nombre: "De Camarón", precio: 4.00, contexto: 'salon' },
      { id: 17, nombre: "Mixta (Pescado y Camarón)", precio: 4.50, contexto: 'salon' },
      
      { id: 121, nombre: "De Albacora", precio: 3.75, contexto: 'llevar' },
      { id: 122, nombre: "De Camarón", precio: 4.25, contexto: 'llevar' },
      { id: 123, nombre: "Mixta (Pescado y Camarón)", precio: 4.75, contexto: 'llevar' },
      { id: 110, nombre: "Media Tarrina", precio: 3.50, contexto: 'llevar' },
      { id: 111, nombre: "Tarrina Llena", precio: 7.00, contexto: 'llevar' },
    ]
  },
   {
    id: 1008,
    nombre: "Tortilla de Camarones",
    category: 'Platos',
    variantes: [
      { id: 18, nombre: "Normal", precio: 4.00, contexto: 'salon' },
      { id: 124, nombre: "Para LLevar", precio: 4.25, contexto: 'llevar' },
    ]
  },
];


export const MENU_ITEMS: MenuItem[] = [
  // Adicionales
  { id: 19, nombre: "PORCIÓN DE ARROZ", precio: 0.50, category: 'Adicionales' },
  { id: 20, nombre: "CHIFLE", precio: 0.50, category: 'Adicionales', inventoryItemId: 'chifles-bolsa' },
  { id: 21, nombre: "PAN", precio: 0.25, category: 'Adicionales' },
  { id: 22, nombre: "MAIZ TOSTADO", precio: 0.25, category: 'Adicionales' },
  { id: 23, nombre: "TARRINA/CONTENEDOR", precio: 0.25, category: 'Adicionales' },
  { id: 34, nombre: "TOSTADA DE QUESO", precio: 1.00, category: 'Adicionales' },
  { id: 35, nombre: "TOSTADA MIXTA", precio: 1.25, category: 'Adicionales' },
  { id: 208, nombre: "TARRINA DE ARROZ", precio: 1.25, category: 'Adicionales', paraLlevar: true },


  // Bebidas
  { id: 24, nombre: "COLA PERSONAL", precio: 0.75, category: 'Bebidas', sabores: ["COCA COLA", "SPRITE", "FANTA", "FIORAVANTI", "INCA COLA"], inventoryItemId: 'cola-personal-unidad' },
  { id: 25, nombre: "BATIDO", precio: 1.50, category: 'Bebidas', sabores: ["FRUTILLA", "MORA", "GUINEO", "CHOCOLATE", "MANGO"] },
  { id: 26, nombre: "Cola 1,35L", precio: 2.00, category: 'Bebidas' },
  { id: 36, nombre: "Café/Té", precio: 0.75, category: 'Bebidas' },
  { id: 37, nombre: "Jugo grande", precio: 1.00, category: 'Bebidas' },
  { id: 38, nombre: "Jugo pequeño", precio: 0.50, category: 'Bebidas' },
  { id: 39, nombre: "AGUA", precio: 0.75, category: 'Bebidas' },
  { id: 41, nombre: "FUZE TEA", precio: 0.75, category: 'Bebidas' },
  
];

// Helper para obtener todos los items en una sola lista, combinando platos y variantes
const getAllMenuItems = (): MenuItem[] => {
  const allItems: MenuItem[] = [...MENU_ITEMS];
  MENU_PLATOS.forEach(plato => {
    plato.variantes.forEach(variante => {
      allItems.push({
        ...variante,
        nombre: `${plato.nombre} ${variante.nombre}`,
        baseNombre: plato.nombre,
        category: 'Platos',
      });
    });
  });
  return allItems;
};

export const ALL_MENU_ITEMS = getAllMenuItems();

export const USERS = {
    'Caja001': { id: 'user-elena', password: '0123456789', role: 'employee' as const },
    'Mesero1': { id: 'user-mesero1', password: '1234567890', role: 'employee' as const },
    'admin1': { id: 'user-admin1', password: 'admin001', role: 'admin' as const },
    'cocina': { id: 'user-cocina', password: 'cocina01', role: 'kitchen' as const }
};

export const TOTAL_TABLES = 12;

    

    
