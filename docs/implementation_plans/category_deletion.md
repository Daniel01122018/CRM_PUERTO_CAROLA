
# Category Deletion Implementation Plan

## Overview
Added the ability to delete categories in the App Menu management module (`src/app/admin/app-menu/page.tsx`). This feature includes a visual delete button for each category and a confirmation dialog with a strict warning about data loss (deleting the category and its associated items/variants).

## Changes

### 1. `src/hooks/use-app-menu.ts`
- Verified that `deleteCategory` function already exists and correctly handles the deletion of a category and its cascading items.

### 2. `src/app/admin/app-menu/page.tsx`
- **Hook Integration**: Added `deleteCategory` to the destructured object from `useAppMenu`.
- **State Management**: Added `categoryToDelete` state to track the category pending deletion.
- **Handler Functions**:
    - `handleDeleteCategoryClick(categoryId)`: Sets the category to be deleted.
    - `confirmDeleteCategory()`: Calls `deleteCategory` and resets state.
- **UI Updates**:
    - Added a "Gestión de categoría" section within the `MenuTabs` render prop.
    - Added a "Eliminar Categoría" button (`variant="destructive"`) to this section.
    - Added an `AlertDialog` specifically for category deletion, implementing the requested warning message: "Esta acción eliminará la categoría y TODOS los productos (y sus variantes) que pertenezcan a ella."

## Verification
- **Functional**: The delete button should appear for each active category tab. Clicking it should trigger the warning dialog. Confirming should remove the category and its items from the database/UI. Cancellation should just close the dialog.
- **Visual**: The button is styled as destructive (red) and placed conveniently within the category view.
