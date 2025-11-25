# El Puerto de Carola - Sistema de Gestión de Restaurante (CRM)

Este es un sistema de punto de venta (POS) y gestión de restaurante diseñado a medida para "El Puerto de Carola". La aplicación está construida con Next.js y utiliza **Firebase (Firestore)** como base de datos en la nube para una sincronización en tiempo real y persistencia robusta.

## 🌟 Características Principales

- **Gestión de Salón y Mesas:** Visualización en tiempo real del estado de las mesas (disponible/ocupada) y acceso rápido a los pedidos en curso.
- **Toma de Pedidos Optimizada:**
    - Interfaz táctil e intuitiva para añadir, modificar y eliminar artículos de un pedido.
    - Menús diferenciados y con precios distintos para consumo en el **salón** y para **pedidos para llevar**.
    - Capacidad para añadir notas específicas por artículo (ej. sabores de batido) y notas generales para la cocina.
- **Vista de Cocina (Kitchen Display System - KDS):** 
    - Pantalla en tiempo real que muestra solo los pedidos activos.
    - Actualización instantánea de estados y notificaciones de cancelación.
    - Optimizado para rendimiento con escucha selectiva de cambios.
- **Módulo de Pedidos para Llevar:** Gestión separada de la cola de pedidos para llevar, desde su creación hasta su finalización.
- **Gestión de Usuarios:** Sistema de autenticación simple basado en roles (mesero, administrador, cocina) para controlar el acceso a las diferentes secciones.
- **Módulo de Gastos:**
    - Registro de todos los egresos del negocio, clasificados por categorías personalizables.
    - Asignación de gastos de sueldo a empleados específicos.
    - Filtros avanzados por categoría y rango de fechas.
- **Gestión de Empleados:** Creación y visualización de un listado de empleados para asociar gastos de sueldos.
- **Reportes Financieros (Módulo de Administrador):**
    - **Arqueo de Caja Simplificado:** Cálculo automático del **efectivo esperado en caja** al final del día (Ventas en Efectivo - Gastos).
    - **Estadísticas Diarias Agregadas:** Sistema de agregación de datos optimizado para consultas rápidas de ingresos, gastos y beneficios.
    - KPIs (Indicadores Clave) personalizables por rango de fechas (semana actual/pasada, mes actual/pasado, rango personalizado).
    - Gráficos visuales para analizar **Ingresos vs. Gastos** y un **desglose de gastos** por categoría.
- **Reporte de Rendimiento Avanzado:**
    - **Análisis por Artículo:** Seguimiento detallado de ventas (cantidad, ingresos, ganancia) por cada ítem del menú.
    - **Categorización Inteligente:** Visualización separada para "Platos", "Bebidas" y "Adicionales".
    - **Comparativas:** Comparación de rendimiento entre períodos (ej. esta semana vs. semana pasada) con indicadores de tendencia.
    - **Top Performers:** Identificación automática de los artículos más vendidos y más rentables.
- **Historial de Pedidos:**
    - Registro completo de todos los pedidos finalizados.
    - Búsqueda y filtrado por mesa, ID, artículo o total.
    - Posibilidad de anular pedidos completados (acción de administrador).
    - Carga eficiente de datos históricos bajo demanda.

## 🛠️ Tecnologías Utilizadas

- **Framework:** Next.js (con App Router) y React.
- **Lenguaje:** TypeScript.
- **Estilos:** Tailwind CSS.
- **Componentes UI:** ShadCN/UI, con íconos de `lucide-react`.
- **Base de Datos:** **Firebase Firestore** para almacenamiento en la nube y sincronización en tiempo real.
- **Gestión de Estado:** Hooks personalizados optimizados (`useActiveOrders`, `useDailyStats`, `useOrderHistory`) para minimizar lecturas y mejorar el rendimiento.
- **Gráficos:** `Recharts`.
- **Formularios:** `react-hook-form` con `zod` para validaciones.

## 📂 Estructura del Proyecto

```
/src
├── /app/                # Rutas de la aplicación (App Router de Next.js)
│   ├── /dashboard/      # Pantalla principal del salón de mesas
│   ├── /order/[id]/     # Vista para crear o editar un pedido
│   ├── /kitchen/        # Vista para la cocina
│   ├── /history/        # Historial de pedidos y reportes diarios
│   ├── /reports/        # Reportes financieros avanzados
│   │   └── /performance/# Reporte detallado de rendimiento de productos
│   ├── /expenses/       # Gestión de gastos
│   ├── /employees/      # Gestión de empleados
│   └── page.tsx         # Página de inicio de sesión
│
├── /components/         # Componentes reutilizables de la aplicación
│   ├── /ui/             # Componentes base de ShadCN (Button, Card, etc.)
│   ├── /order/          # Componentes específicos de la vista de pedido
│   └── app-header.tsx   # Cabecera principal de la aplicación
│
├── /hooks/              # Hooks personalizados para lógica de negocio
│   ├── use-app-store.ts # Estado global de sesión y configuración
│   ├── use-active-orders.ts # Gestión de pedidos en curso (tiempo real)
│   ├── use-daily-stats.ts   # Estadísticas financieras agregadas
│   ├── use-order-history.ts # Carga de historial bajo demanda
│   └── use-expenses.ts      # Gestión de gastos
│
├── /lib/                # Librerías, datos y utilidades
│   ├── data.ts          # Datos estáticos (menú, usuarios)
│   ├── firebase.ts      # Configuración de Firebase
│   ├── daily-stats.ts   # Lógica de agregación de estadísticas
│   └── utils.ts         # Funciones de utilidad (ej. cn para clases)
│
└── /types/              # Definiciones de tipos e interfaces (TypeScript)
    └── index.ts
```

## 🚀 Cómo Empezar

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```
2.  **Configurar Variables de Entorno:**
    Asegúrate de tener un archivo `.env.local` con las credenciales de Firebase:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    ...
    ```
3.  **Ejecutar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:9002`.

### Credenciales de Ejemplo

Puedes encontrar los usuarios y contraseñas de ejemplo en el archivo `src/lib/data.ts` dentro del objeto `USERS`.
