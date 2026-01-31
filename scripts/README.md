# Script de Migración: Categorías de Gastos

Este script migra las categorías de gastos de una estructura de múltiples documentos a un documento único con mapa.

## Requisitos Previos

1. **Service Account Key**: Descarga el archivo de credenciales de Firebase Admin
   - Ve a [Firebase Console](https://console.firebase.google.com/) → Tu Proyecto
   - Settings (⚙️) → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Guarda el archivo como `serviceAccountKey.json` en la raíz del proyecto

2. **Instalar dependencias**:
   ```bash
   npm install firebase-admin
   ```

3. **Instalar tsx** (si no lo tienes):
   ```bash
   npm install -g tsx
   ```

## Cómo Ejecutar

```bash
npx tsx scripts/migrate-expense-categories.ts
```

## Qué hace el script

1. ✅ Lee todas las categorías existentes de `expense_categories/{categoryId}`
2. ✅ Convierte la estructura a un mapa de categorías
3. ✅ Crea el documento `expense_categories/config` con el mapa
4. ✅ Verifica que la migración fue exitosa
5. ℹ️ Los documentos antiguos NO se eliminan automáticamente (por seguridad)

## Después de la Migración

1. **Actualizar Firestore Rules** (IMPORTANTE):
   - Ve a Firebase Console → Firestore Database → Reglas
   - Las reglas ya están actualizadas en `firestore.rules`
   - Necesitas publicarlas manualmente en la consola

2. **Verificar en la aplicación**:
   - Login como **admin** y ve a `/expenses`
   - Verifica que el selector de categorías funciona
   - Prueba crear, editar y eliminar categorías
   - Login como **employee** y verifica que puede ver las categorías

3. **Limpiar documentos antiguos** (Opcional):
   - Una vez que confirmes que todo funciona correctamente
   - Ve a Firestore Console → `expense_categories` collection
   - Elimina manualmente los documentos individuales (NO elimines "config")

## Troubleshooting

### Error: "serviceAccountKey.json not found"
- Asegúrate de descargar el archivo desde Firebase Console
- Colócalo en la raíz del proyecto (mismo nivel que `package.json`)

### Error: "Permission denied"
- Verifica que el Service Account tiene permisos de lectura/escritura en Firestore
- Por defecto, debería tener permisos completos

### Las categorías no aparecen en la app
- Verifica que has publicado las nuevas Firestore Rules en la consola
- Verifica en Firestore Console que existe `expense_categories/config`
- Revisa la consola del navegador por errores
