# Plan de pruebas de rendimiento (CRM Puerto Carola)

## Objetivo
Detectar y aislar pantallas/acciones con latencias > 1s (p95), especialmente en:
- Dashboard
- Expenses
- History
- Reports
- Kitchen

## Métricas
- **TTI de navegación** (ms): tiempo desde click a vista usable.
- **Tiempo de primera data** (ms): tiempo hasta mostrar primer bloque real (no skeleton).
- **Tiempo de escritura visible** (ms): create/update/delete hasta reflejo en UI.
- **p50 / p95 / p99** por flujo.

## Escenarios críticos
1. Registrar gasto como `employee` y verificar visibilidad inmediata en su propia sesión.
2. Registrar gasto como `employee` y validar consistencia al abrir mismo rango como `admin`.
3. Completar orden y luego anularla, verificando decremento de `daily_stats` en UI.
4. Navegación rápida entre `dashboard -> expenses -> history -> reports` durante carga concurrente.

## Procedimiento recomendado
1. Ejecutar app en modo producción local:
   - `npm run build`
   - `npm run start`
2. Usar Chrome DevTools Performance con CPU throttling x4 para reproducir picos.
3. Repetir cada escenario 20 veces y registrar p50/p95.
4. Repetir en 2 perfiles de usuario (`admin` y `employee`) para detectar diferencias por caché.

## Criterios de aceptación
- p95 de navegación < 1000ms en flujos críticos.
- p95 de escritura visible < 1200ms en `expenses` y `orders`.
- No discrepancias de datos entre `employee` y `admin` después de 2 segundos.

## Checklist de diagnóstico si falla
- Revisar querys con rango + filtros (índices Firestore).
- Revisar caché localStorage/in-memory y TTL.
- Confirmar que post-write hay revalidación o actualización optimista consistente.
- Confirmar que `updatedAt` cambia en `daily_stats`.
