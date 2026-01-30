# Plan de Rediseño: Módulo de Gestión de Aplicación

## 1. Visión
Transformar el módulo actual "Gestión de Aplicación" en un **Hub Administrativo Integral** para la app móvil. El objetivo es pasar de una vista simple de pestañas a una estructura escalable que soporte futuras funcionalidades (Promociones, Usuarios, Notificaciones Push, Configuración avanzada) sin saturar la interfaz.

## 2. Nueva Arquitectura Propuesta

En lugar de usar pestañas simples (`Tabs`) dentro de una sola página, se propone una estructura de **Sub-Navegación** o **Sub-Módulo**. Esto da más espacio a cada sección y previene la fatiga visual.

### Estructura de Navegación Lateral (o Superior Persistente)
*   **Resumen (Dashboard)**: Vista general (Pedidos activos, totales del día, estado del servicio).
*   **Pedidos (Live Ops)**: Gestión de órdenes en tiempo real.
*   **Menú App**: Gestión de catálogo (Sincronización, Categorías, Items, Disponibilidad).
*   **Usuarios** *(Futuro)*: Gestión de perfiles de clientes.
*   **Marketing** *(Futuro)*: Promociones, Cupones, Banners.
*   **Configuración**: Horarios, Zonas de entrega, Banner principal.

## 3. Cambios Visuales y de UX

### A. Layout Principal (`/admin/app`)
*   **Header Mejorado**: Título claro con botones de acción global (ej. "Cerrar Tienda App" - Emergencia).
*   **Navegación**: Menú de navegación tipo "Pills" o "Sidebar interno" para cambiar entre secciones.

### B. Gestión de Menú (`/admin/app/menu`)
Actualmente falta la gestión de categorías.
*   **Solución**: Agregar un botón **"Gestionar Categorías"** que abra un panel/modal dedicado donde se listen todas las categorías con opciones para:
    *   Editar Nombre.
    *   Reordenar (Drag & Drop o Flechas).
    *   **Eliminar Categoría** (Requerimiento actual pendiente).
*   **Barra de Herramientas**: Agrupar acciones [Sincronizar POS] [Nuevo Item] [Gestionar Categorías].

### C. Gestión de Pedidos (`/admin/app/orders`)
*   Mejorar la visualización de tarjetas de pedido.
*   Indicadores visuales más claros para "Tiempo transcurrido".

## 4. Hoja de Ruta de Implementación

### Fase 1: Reestructuración y "Quick Wins" (Inmediato)
1.  **Refactorizar Layout**: Modificar `admin/app/page.tsx` para usar un diseño más modular, preparando el terreno para nuevas secciones.
2.  **Mejoras en Menú**:
    *   Implementar funcionalidad "Eliminar Categoría".
    *   Implementar modal "Gestionar Categorías" (CRUD completo).
    *   Reorganizar botones de acción.
3.  **UI Polish**: Mejorar estética general (espaciado, tipografía, iconos).

### Fase 2: Expansión (Futuro)
1.  Crear rutas dedicadas (`/admin/app/orders`, `/admin/app/menu`) en lugar de componentes renderizados condicionalmente, para permitir "deeplinking" (poder compartir un link directo a un pedido o sección).
2.  Módulo de Usuarios y Marketing.

---

## Plan de Acción Inmediato (Esta sesión)

1.  **Crear Componente `CategoryManager`**: Un diálogo robusto para listar, editar y eliminar categorías.
2.  **Actualizar `AppMenuContent`**: Integrar el `CategoryManager` y reorganizar la cabecera.
3.  **Mejorar `admin/app/page.tsx`**: Cambiar el diseño de Pestañas a una estructura de navegación interna más moderna (ej. usando `Tabs` de `ui/tabs` pero estilizadas como navegación principal del módulo, o separando visualmente el header del contenido).

¿Procedemos con la **Fase 1**?
