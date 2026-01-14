# Arquitectura de Base de Datos - Puerto de Carola CRM

Este documento describe la estructura actual de la base de datos Firestore, las relaciones entre colecciones y recomendaciones para optimización y seguridad.

## 1. Estructura de Colecciones (Schema)

Firestore es una base de datos NoSQL orientada a documentos. A continuación se detallan las colecciones principales y sus modelos de datos.

### `orders` (Pedidos)
Almacena tanto los pedidos activos como el historial de pedidos completados.
*   **ID**: Generado automáticamente o basado en timestamp.
*   **Campos Clave**:
    *   `status`: 'active' | 'preparing' | 'completed' | 'cancelled' | 'pending_calculation' | 'enviado'
    *   `tableId`: number (1-12) | 'takeaway' | 'kiosk' | 'app'
    *   `origin`: 'crm' | 'app' | 'kiosk' (Para trazabilidad)
    *   `items`: Array de objetos (menuItemId, quantity, notes, price, name)
    *   `total`: number
    *   `customerName`: string (Obligatorio para app)
    *   `customerPhone`: string (Obligatorio para app)
    *   `paymentMethod`: 'Efectivo' | 'DeUna' | 'Transferencia'
    *   `createdAt`: timestamp (number)
    *   `completedAt`: timestamp (number)
*   **Uso**: Lectura intensa en tiempo real para cocina y caja. Escritura frecuente (actualización de estados).
    *   **Importante**: Los pedidos de la App **deben** guardar el `snapshot` de `price` y `name` en cada item para evitar inconsistencias si el menú cambia.

### `menu_items` (Menú)
Catálogo de productos disponibles.
*   **ID**: String único.
*   **Campos Clave**:
    *   `name`: string
    *   `price`: number
    *   `category`: 'Platos' | 'Bebidas', etc.
    *   `variants`: Array de variantes (ej. tamaños)
    *   `isAvailable`: boolean (Control de stock rápido)
*   **Uso**: Lectura muy frecuente (al abrir menú). Escritura poco frecuente (solo administración).

### `daily_stats` (Estadísticas Diarias)
Documentos agregados para reportes rápidos. Un documento por día.
*   **ID**: String formato `YYYY-MM-DD`.
*   **Campos Clave**:
    *   `totalRevenue`: number
    *   `orderCount`: number
    *   `paymentMethods`: Map { 'Efectivo': 100, ... }
    *   `hourlyOrders`: Map { '12': 5, '13': 8, ... }
    *   `itemSales`: Map con detalle de productos vendidos.
*   **Uso**: Lectura crítica para reportes (evita leer miles de pedidos individuales). Escritura en cada finalización de pedido.

### `tables` (Mesas Físicas)
Estado en tiempo real de las mesas.
*   **ID**: String (número de mesa, ej. "1").
*   **Campos Clave**:
    *   `status`: 'available' | 'occupied'
    *   `currentOrderId`: string (Referencia al pedido activo)
*   **Uso**: Crítico para evitar duplicidad de pedidos en la misma mesa. Control de concurrencia.

### `expenses` (Gastos)
Registro de salidas de dinero.
*   **Campos Clave**:
    *   `amount`: number
    *   `category`: string (Dinámica)
    *   `source`: 'caja' | 'caja_chica'
*   **Uso**: Reportes financieros y cuadre de caja.

### `inventory_items` & `inventory_movements` (Inventario)
Gestión de stock de ingredientes (módulo en desarrollo).
*   **Items**: Definición de ingredientes (Stock actual, Unidad, Costo).
*   **Movements**: Bitácora de entradas y salidas.

### `AppMenu` (Menú de la App Móvil)
Documento único desnormalizado para la aplicación de clientes. Optimizado para una sola lectura.
*   **ID Documento**: `fullMenu` (único documento en la colección)
*   **Campos Clave**:
    *   `categories`: Array de categorías `{ id, name, order }`
    *   `items`: Array de items del menú (con categoryId, name, price, variants, isAvailable, etc.)
    *   `updatedAt`: timestamp de última modificación
    *   `updatedBy`: usuario que realizó la última modificación
*   **Uso**: Solo lectura para la App móvil (una sola lectura por sesión). Escritura desde el CRM en `/admin/app-menu`.
*   **Importante**: Este menú es **independiente** del menú del POS (`categories` + `items`). Se puede sincronizar manualmente desde el POS, pero luego evoluciona de forma separada.

### `AppOrders` (Pedidos de la App Móvil)
Almacena pedidos creados desde la aplicación de clientes.
*   **ID**: Generado automáticamente.
*   **Campos Clave**:
    *   `status`: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
    *   `customerId`, `customerName`, `customerPhone`: Información del cliente
    *   `deliveryType`: 'pickup' | 'delivery'
    *   `deliveryAddress`: Dirección (solo para delivery)
    *   `items`: Array de items `{ menuItemId, menuItemName, quantity, unitPrice, notes }`
    *   `paymentMethod`: 'Efectivo' | 'DeUna' | 'Transferencia'
    *   `paymentStatus`: 'pending' | 'paid'
    *   `total`, `subtotal`, `deliveryFee`
    *   Timestamps: `createdAt`, `confirmedAt`, `preparingAt`, `readyAt`, `completedAt`, `cancelledAt`
    *   `fcmToken`: Token para notificaciones push (futuro)
*   **Uso**: Escritura desde App móvil. Lectura/actualización desde CRM (`/admin/app-orders`).
*   **Integración**: Al completar un pedido, se actualiza `daily_stats` para unificar reportes financieros.

---

## 2. Mapa de Interacciones

Cómo fluyen los datos entre las colecciones durante las operaciones principales.

### A. Crear Pedido (Mesa)
1.  **Lectura**: Verifica `tables/{tableId}` para asegurar que `status === 'available'`.
2.  **Escritura (Transacción)**:
    *   Crea documento en `orders`.
    *   Actualiza `tables/{tableId}` a `status: 'occupied'`.

### B. Finalizar Pedido
1.  **Escritura (Transacción)**:
    *   Actualiza `orders/{orderId}`: `status = 'completed'`, `completedAt = now`.
    *   Actualiza `tables/{tableId}`: `status = 'available'`.
2.  **Agregación (Post-Transacción)**:
    *   Calcula estadísticas del pedido.
    *   Actualiza `daily_stats/{YYYY-MM-DD}` sumando ingresos y conteos.

### C. Recalcular Datos (Migración)
1.  **Lectura Batch**: Lee todos los `orders` (filtrado por fecha si aplica).
2.  **Procesamiento**: Agrupa en memoria por día.
3.  **Escritura Batch**: Sobrescribe documentos en `daily_stats`.

### D. Pedido desde App (Integración)
1.  **Estado Inicial**: Los pedidos nacen como `pending_calculation`.
2.  **Flujo Crítico**:
    *   `pending_calculation` -> `active`: El CRM confirma productos y precios.
    *   `active` -> `preparing`: Cocina recibe el pedido.
    *   `preparing` -> `enviado`: El motorizado/repartidor retira el pedido.
    *   `enviado` -> `completed`: El cliente recibe y el pago se confirma.
3.  **Estadísticas (`daily_stats`)**:
    > [!IMPORTANT]
    > Actualmente, el CRM actualiza `daily_stats` desde el frontend al pasar a `completed`.
    > Si la App marca un pedido como `completed` directamente, **DEBE** ejecutar la lógica de agregación en `daily_stats` o delegarlo a una Cloud Function para asegurar reportes válidos.

---

## 3. Oportunidades de Optimización

### Indices Compuestos (Performance)
Actualmente Firestore requiere índices para consultas con múltiples filtros (ej. `where status == completed AND createdAt > X`).
*   **Recomendación**: Crear índice compuesto en `orders`: `status` (Asc) + `createdAt` (Desc). Esto acelerará drásticamente la carga del historial y validaciones.

### Estrategia de Archivado (Costos/Velocidad)
La colección `orders` crecerá indefinidamente. Consultar pedidos activos será más lento con el tiempo si no se filtra correctamente.
*   **Recomendación**: Implementar una Cloud Function programada (o script mensual) que mueva pedidos completados de más de 6 meses a una colección `orders_archive`.
    *   Mantiene la colección "caliente" ligera.
    *   Reduce costos de lectura en índices.

### Denormalización de Menú (Integridad)
Actualmente, los pedidos guardan `menuItemId`. Si se cambia el nombre o precio de un plato, el historial antiguo podría verse afectado si se recalcula mal.
*   **Mejora Actual**: El sistema ya guarda una copia del precio y nombre al momento de la venta (`snapshot`).
*   **Recomendación**: Asegurar que **siempre** se guarde `itemName` y `executionPrice` dentro del objeto `items` del pedido, para no depender de `menu_items` para reportes históricos.

### Lecturas en Tiempo Real (Costos)
El uso de `onSnapshot` en `useActiveOrders` es excelente para UX, pero lee todo el set de datos activos constantemente.
*   **Optimización**: Asegurar que la query de `onSnapshot` tenga un límite (ej. `limit(100)`) o un filtro de tiempo estricto (`createdAt > startOfToday`) para no cargar pedidos "zombies" que quedaron activos por error hace meses.

---

## 4. Auditoría de Seguridad & Reglas

Actualmente (asumiendo modo de desarrollo), las reglas suelen ser `allow read, write: if true;` o básicas.

### Modelo de Seguridad Recomendado (RBAC)

Se deben implementar reglas de seguridad en `firestore.rules` basadas en el rol del usuario (`request.auth.token.role`).

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Funciones Helper
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isEmployee() {
      return request.auth != null;
    }

    // Reglas Específicas
    
    // Pedidos: Empleados pueden crear/actualizar. Solo Admin puede borrar.
    match /orders/{orderId} {
      allow read: if isEmployee();
      allow create, update: if isEmployee();
      allow delete: if isAdmin();
    }
    
    // Menú: Solo lectura para empleados. Solo Admin edita.
    match /menu_items/{itemId} {
      allow read: if isEmployee();
      allow write: if isAdmin();
    }
    
    // Reportes/Estadísticas: Solo Admin.
    match /daily_stats/{day} {
      allow read, write: if isAdmin();
    }
    
    // Configuración y Usuarios: Estrictamente Admin.
    match /users/{userId} {
      allow read, write: if isAdmin();
    }
  }
}
```

### Validaciones de Datos (Schema Validation)
Firestore no impone esquema, pero las reglas pueden hacerlo.
*   **Recomendación**: Agregar validaciones básicas en las reglas para evitar datos corruptos.
    *   Ej: `allow create: if request.resource.data.total >= 0;`
    *   Ej: `allow create: if request.resource.data.items.size() > 0;`
