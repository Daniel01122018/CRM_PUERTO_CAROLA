# Documentación de la Aplicación Móvil

Este documento describe la arquitectura backend y las integraciones de la aplicación móvil de clientes con el CRM.

---

## 1. Colecciones de Firestore

### AppMenu (Menú)

**Ruta**: `AppMenu/fullMenu`

Documento único desnormalizado que contiene todo el menú. Optimizado para minimizar lecturas en la app móvil.

```typescript
interface AppMenuDocument {
  categories: {
    id: string;
    name: string;
    order: number;
  }[];
  items: {
    id: string;
    name: string;
    price: number;
    categoryId: string;
    categoryName: string;
    isAvailable: boolean;
    type: 'plato' | 'item';
    order: number;
    variants?: {
      id: number;
      nombre: string;
      precio: number;
      contexto: 'salon' | 'llevar';
    }[];
    description?: string;
    imageUrl?: string;
  }[];
  updatedAt: number;
  updatedBy: string;
}
```

**Operaciones desde la App**:
- `getDoc()` para obtener menú completo (1 lectura)
- Recomendado: Cachear en AsyncStorage y verificar `updatedAt`

**Gestión desde CRM**:
- Ruta: `/admin/app-menu`
- Permite sincronizar desde menú del POS
- CRUD de categorías e items

---

### AppOrders (Pedidos)

**Ruta**: `AppOrders/{orderId}`

Almacena pedidos creados desde la aplicación de clientes.

```typescript
interface AppOrder {
  id: string;
  
  // Estado
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: number;
  confirmedAt: number | null;
  preparingAt: number | null;
  readyAt: number | null;
  completedAt: number | null;
  cancelledAt: number | null;
  updatedAt: number;
  
  // Cliente
  customerId: string;        // UID de Firebase Auth
  customerName: string;
  customerPhone: string;
  fcmToken: string | null;   // Para notificaciones push
  
  // Entrega
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress: string | null;
  deliveryFee: number;
  pickupTime: number | null;
  
  // Items
  items: {
    menuItemId: string;
    menuItemName: string;
    notes: string;
    quantity: number;
    unitPrice: number;
  }[];
  
  // Pago
  paymentMethod: 'Efectivo' | 'DeUna' | 'Transferencia' | null;
  paymentStatus: 'pending' | 'paid';
  
  // Totales
  subtotal: number;
  total: number;
  notes: string;
}
```

---

## 2. Flujo de Estados de Pedidos

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   [App Móvil]              [CRM]                               │
│   ─────────────            ─────                               │
│                                                                 │
│   Cliente crea ──────────▶ PENDING ◀────── Nuevo pedido        │
│   pedido                        │                               │
│                                 ▼                               │
│                            CONFIRMED ◀───── Admin confirma      │
│                                 │                               │
│                                 ▼                               │
│                            PREPARING ◀───── Cocina prepara      │
│                                 │                               │
│                                 ▼                               │
│                              READY ◀─────── Listo para entrega  │
│                                 │                               │
│                                 ▼                               │
│                            COMPLETED ◀───── Pago confirmado     │
│                                 │                               │
│                                 ▼                               │
│                          daily_stats actualizado                │
│                                                                 │
│   ───────────────────────────────────────────────────────────  │
│   En cualquier momento (excepto completed):                     │
│                            CANCELLED ◀───── Admin cancela       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Integración con Reportes (daily_stats)

Cuando un pedido pasa a `completed`:

1. Se obtiene la fecha actual (formato `YYYY-MM-DD`)
2. Se actualiza el documento `daily_stats/{fecha}`:
   - `totalRevenue += order.total`
   - `orderCount += 1`
   - `paymentMethods[paymentMethod] += order.total`
   - `itemSales` se actualiza con cada item vendido

Esto unifica los ingresos de la App con los del POS en los reportes financieros.

---

## 4. Notificaciones Push (Futuro)

El campo `fcmToken` está reservado para implementar notificaciones push.

### Flujo propuesto:
1. La App obtiene el token FCM al iniciar sesión
2. Guarda el token en el documento del pedido
3. Al cambiar estado, una Cloud Function envía notificación:
   - `confirmed`: "Tu pedido ha sido confirmado"
   - `preparing`: "Tu pedido está siendo preparado"
   - `ready`: "Tu pedido está listo para recoger"

### Implementación:
Requiere Cloud Function que escuche cambios en `AppOrders`:

```javascript
// functions/index.js (ejemplo)
exports.onOrderStatusChange = functions.firestore
  .document('AppOrders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status !== after.status && after.fcmToken) {
      await sendPushNotification(after.fcmToken, after.status);
    }
  });
```

---

## 5. Reglas de Seguridad Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // AppMenu: Lectura para todos, escritura solo admins
    match /AppMenu/{doc} {
      allow read: if true;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // AppOrders: El cliente puede crear y leer sus pedidos
    // Los admins pueden leer/actualizar todos
    match /AppOrders/{orderId} {
      allow create: if request.auth != null 
        && request.resource.data.customerId == request.auth.uid;
      
      allow read: if request.auth != null 
        && (resource.data.customerId == request.auth.uid 
            || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 6. Endpoints y Hooks del CRM

| Hook | Uso |
|------|-----|
| `useAppMenu()` | Gestión del menú de la App |
| `useAppOrders()` | Gestión de pedidos de la App |

### Funciones de useAppMenu:
- `syncFromPOSMenu()` - Copia menú del POS
- `addCategory()`, `updateCategory()`, `deleteCategory()`
- `addItem()`, `updateItem()`, `deleteItem()`, `reorderItem()`

### Funciones de useAppOrders:
- `confirmOrder(orderId)` - pending → confirmed
- `startPreparing(orderId)` - confirmed → preparing
- `markAsReady(orderId)` - preparing → ready
- `completeOrder(orderId, paymentMethod)` - ready → completed (+ daily_stats)
- `cancelOrder(orderId)` - cualquier estado → cancelled

---

## 7. Caché Recomendado (App Móvil)

Para minimizar lecturas de Firestore:

```typescript
// En la App móvil
import AsyncStorage from '@react-native-async-storage/async-storage';

async function getMenu() {
  const cached = await AsyncStorage.getItem('app_menu');
  const cachedData = cached ? JSON.parse(cached) : null;
  
  // Verificar si hay actualización
  const docRef = doc(db, 'AppMenu', 'fullMenu');
  const docSnap = await getDoc(docRef);
  const serverData = docSnap.data();
  
  if (!cachedData || serverData.updatedAt > cachedData.updatedAt) {
    await AsyncStorage.setItem('app_menu', JSON.stringify(serverData));
    return serverData;
  }
  
  return cachedData;
}
```

---

## 8. Tipos TypeScript (Referencia)

Los tipos están definidos en:
- `src/types/app-menu.ts` - Tipos del menú
- `src/types/app-orders.ts` - Tipos de pedidos
