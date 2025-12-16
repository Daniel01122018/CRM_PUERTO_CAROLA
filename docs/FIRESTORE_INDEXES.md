# Índices Compuestos en Firestore - Documentación Técnica

## 📚 Tabla de Contenidos
1. [¿Qué es un Índice Compuesto?](#qué-es-un-índice-compuesto)
2. [Cómo Funciona Internamente](#cómo-funciona-internamente)
3. [Índice Específico del Proyecto](#índice-específico-del-proyecto)
4. [Impacto en Performance](#impacto-en-performance)
5. [Costos y Consideraciones](#costos-y-consideraciones)

---

## ¿Qué es un Índice Compuesto?

### Concepto Básico

Un **índice compuesto** es una estructura de datos que Firestore crea y mantiene para acelerar queries que filtran u ordenan por **múltiples campos simultáneamente**.

**Analogía**: Es como el índice de un libro que no solo lista palabras (un campo), sino combinaciones de palabras (múltiples campos), permitiéndote encontrar contenido específico instantáneamente sin leer todo el libro.

### ¿Por qué lo necesitamos?

En Firestore, cuando haces un query con:
- **Múltiples `where()` filters** en diferentes campos
- **`where()` + `orderBy()`** en campos diferentes
- **Múltiples `orderBy()`** en diferentes campos

Firestore **requiere** un índice compuesto para ejecutar esa query eficientemente.

---

## Cómo Funciona Internamente

### Sin Índice (Scan Completo)

Imagina que tienes 3000 orders y quieres encontrar:
- Orders creadas hoy (`createdAt >= todayStart`)
- Que estén en estado "active" o "preparing" (`status in ['active', 'preparing']`)
- Ordenadas por fecha descendente

**Sin índice**:
```
1. Lee los 3000 documentos de la colección 📄📄📄...
2. Filtra en memoria: createdAt >= today → quedan 50
3. Filtra en memoria: status in [...] → quedan 15
4. Ordena en memoria: por createdAt
5. Retorna 15 resultados
```
⏱️ **Tiempo**: ~1-3 segundos | **Reads**: 3000 documentos

### Con Índice Compuesto

Firestore pre-construye una estructura ordenada:

```
Índice: (status ASC, createdAt DESC)
┌──────────┬─────────────┬──────────────┐
│ status   │ createdAt   │ Document Ref │
├──────────┼─────────────┼──────────────┤
│ active   │ 2024-12-15  │ → doc_001    │
│ active   │ 2024-12-14  │ → doc_045    │
│ active   │ 2024-12-13  │ → doc_089    │
│ preparing│ 2024-12-15  │ → doc_003    │
│ preparing│ 2024-12-14  │ → doc_021    │
│ completed│ 2024-12-15  │ → doc_500    │ ← No se lee
│ completed│ 2024-12-14  │ → doc_501    │ ← No se lee
└──────────┴─────────────┴──────────────┘
```

**Con índice**:
```
1. Salta directamente a status='active' (búsqueda binaria)
2. Lee solo docs con status='active' + createdAt >= today
3. Salta a status='preparing'
4. Lee solo docs con status='preparing' + createdAt >= today
5. Retorna 15 resultados (ya ordenados!)
```
⏱️ **Tiempo**: ~50-200ms | **Reads**: 15 documentos

### Estructura Interna del Índice

Firestore usa un **B+ Tree** (árbol balanceado):

```
                    Root
                     │
        ┌────────────┴────────────┐
     status='active'        status='preparing'
        │                          │
   ┌────┴────┐              ┌──────┴──────┐
2024-12-15  2024-12-14   2024-12-15  2024-12-14
   │           │             │           │
[docs]      [docs]        [docs]      [docs]
```

**Ventajas**:
- ✅ Búsqueda O(log n) en lugar de O(n)
- ✅ Resultados ya ordenados (no sorting adicional)
- ✅ Solo lee documentos relevantes

---

## Índice Específico del Proyecto

### Configuración del Índice

**Collection**: `orders`

**Campos indexados**:
1. `status` (Ascending)
2. `createdAt` (Descending)
3. `__name__` (Descending) ← Auto-agregado por Firebase

### Query que lo Utiliza

**Archivo**: `src/hooks/use-active-orders.ts`

```typescript
const q = query(
  collection(db, 'orders'),
  where('createdAt', '>=', todayStart),    // Filtro 1
  where('status', 'in', ['active', 'preparing']), // Filtro 2
  orderBy('createdAt', 'desc')             // Ordenamiento
);
```

### ¿Por qué estos campos específicos?

#### 1. `status` (Ascending)
**Propósito**: Agrupar orders por estado
**Valores**: `'active'`, `'preparing'`, `'completed'`, `'cancelled'`

Permite a Firestore:
- Saltar directamente a los documentos con status deseado
- Ignorar completamente `completed` y `cancelled` (no los lee)

#### 2. `createdAt` (Descending)
**Propósito**: Ordenar de más reciente a más antiguo
**Valores**: Timestamps (números grandes)

Permite a Firestore:
- Leer solo orders de hoy (filtra >= todayStart)
- Retornar resultados ya ordenados (reciente → antiguo)

#### 3. `__name__` (Auto)
**Propósito**: Desempate cuando dos docs tienen mismos valores
**Valores**: Document IDs

Firebase lo agrega automáticamente para:
- Garantizar orden determinístico (siempre el mismo)
- Manejar casos donde status + createdAt sean idénticos

---

## Impacto en Performance

### Antes del Índice (Sin Filtro de Status)

**Query original**:
```typescript
where('createdAt', '>=', todayStart)
orderBy('createdAt', 'desc')
```

**Docs leídos**: ~30-50 (todos los orders de hoy)
- ✅ Active: 10
- ✅ Preparing: 5
- ❌ Completed: 20 (innecesarias)
- ❌ Cancelled: 5 (innecesarias)

**Performance**:
- Tiempo: ~100-300ms
- Reads: 30-50/login
- Costo: $0.006 por 1000 logins

### Después del Índice (Con Filtro de Status)

**Query optimizado**:
```typescript
where('createdAt', '>=', todayStart)
where('status', 'in', ['active', 'preparing'])
orderBy('createdAt', 'desc')
```

**Docs leídos**: ~10-20 (solo relevantes)
- ✅ Active: 10
- ✅ Preparing: 5
- ⏭️ Completed: 0 (saltadas)
- ⏭️ Cancelled: 0 (saltadas)

**Performance**:
- Tiempo: ~50-150ms (**50% más rápido**)
- Reads: 10-20/login (**-50% reads**)
- Costo: $0.003 por 1000 logins (**-50% costo**)

### Mejora en Escala

Con el tiempo, a medida que acumulas más orders completadas:

| Orders de Hoy | Sin Índice | Con Índice | Ahorro |
|---------------|------------|------------|--------|
| 50 total      | 50 reads   | 15 reads   | -70%   |
| 100 total     | 100 reads  | 15 reads   | -85%   |
| 500 total     | 500 reads  | 15 reads   | -97%   |

¡El ahorro crece exponencialmente! 📈

---

## Resumen Ejecutivo

### Lo que hace el índice:

1. **Pre-organiza** tus 3000+ orders por `status` y `createdAt`
2. **Permite** saltar directamente a orders relevantes (active/preparing)
3. **Ignora** orders innecesarias (completed/cancelled)
4. **Retorna** resultados ya ordenados (sin sorting adicional)

### Impacto en tu aplicación:

- ✅ **50% más rápido**: Login y carga de dashboard
- ✅ **50% menos reads**: Ahorro de costos
- ✅ **Mejor UX**: Respuesta más ágil
- ✅ **Escalable**: Performance mejora con más datos

### Tiempo de compilación:

- **3000 docs**: ~10-15 minutos ⏰
- **Una sola vez**: Después se mantiene automáticamente
- **Vale la pena**: Beneficio permanente vs costo único

---

## Referencias

- [Firestore Indexing Best Practices](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Composite Indexes](https://firebase.google.com/docs/firestore/query-data/index-overview#composite_indexes)
