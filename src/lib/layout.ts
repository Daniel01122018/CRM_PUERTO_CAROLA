import type { TableLayout } from '@/types';

// Este archivo define la distribución de las mesas en el salón.
// Puedes ajustar la posición y el tamaño de cada mesa cambiando los valores de gridRow, gridCol, rowSpan y colSpan.
// La cuadrícula base es de 8 columnas y 6 filas.

export const TABLE_LAYOUT: TableLayout[] = [
  { id: 1, gridRow: '1', gridCol: '1' },
  { id: 2, gridRow: '1', gridCol: '2' },
  { id: 3, gridRow: '1', gridCol: '3' },
  { id: 4, gridRow: '2', gridCol: '1' },
  { id: 5, gridRow: '2', gridCol: '2' },
  { id: 6, gridRow: '2', gridCol: '3' },
  { id: 7, gridRow: '3', gridCol: '1' },
  { id: 8, gridRow: '3', gridCol: '2' },
  { id: 9, gridRow: '3', gridCol: '3' },
  { id: 10, gridRow: '1', gridCol: '5', colSpan: 2 },
  { id: 11, gridRow: '2', gridCol: '5', colSpan: 2 },
  { id: 12, gridRow: '4', gridCol: '1', rowSpan: 2 },
  { id: 13, gridRow: '4', gridCol: '2' },
  { id: 14, gridRow: '4', gridCol: '3' },
];
