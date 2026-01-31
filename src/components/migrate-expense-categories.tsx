"use client";

import { useState } from 'react';
import { collection, getDocs, doc, setDoc, deleteField, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Database, Loader2 } from 'lucide-react';

/**
 * Migration component to convert expense categories from multiple documents to single denormalized document
 * Only visible to admins
 */
export function MigrateExpenseCategories() {
    const { toast } = useToast();
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationComplete, setMigrationComplete] = useState(false);

    const handleMigration = async () => {
        setIsMigrating(true);

        try {
            // Step 1: Read all existing categories from collection
            const categoriesRef = collection(db, 'expense_categories');
            const snapshot = await getDocs(categoriesRef);

            if (snapshot.empty) {
                toast({
                    title: "⚠️ Sin categorías",
                    description: "No se encontraron categorías para migrar.",
                    variant: "default"
                });
                setIsMigrating(false);
                return;
            }

            // Step 2: Build categories map (excluding 'config' if it exists)
            const categoriesMap: Record<string, any> = {};
            let categoryCount = 0;

            snapshot.forEach((docSnap) => {
                // Skip the config document if it already exists
                if (docSnap.id === 'config') return;

                const data = docSnap.data();
                if (data.name) {
                    categoriesMap[data.name] = {
                        requiresNote: data.requiresNote || false,
                        createdAt: data.createdAt,
                        createdBy: data.createdBy
                    };
                    categoryCount++;
                }
            });

            if (categoryCount === 0) {
                toast({
                    title: "⚠️ Ya migrado",
                    description: "Las categorías ya están en el nuevo formato.",
                    variant: "default"
                });
                setMigrationComplete(true);
                setIsMigrating(false);
                return;
            }

            // Step 3: Write to config document
            const configRef = doc(db, 'expense_categories', 'config');
            await setDoc(configRef, {
                categories: categoriesMap,
                updatedAt: Date.now()
            });

            // Success!
            toast({
                title: "✅ Migración Completada",
                description: `Se migraron ${categoryCount} categorías exitosamente. Ahora puedes eliminar los documentos antiguos manualmente desde Firestore Console.`,
                duration: 10000
            });

            setMigrationComplete(true);
            setIsMigrating(false);

        } catch (error: any) {
            console.error('Migration error:', error);
            toast({
                variant: "destructive",
                title: "❌ Error en la migración",
                description: error.message || "No se pudo completar la migración. Verifica los permisos."
            });
            setIsMigrating(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    disabled={migrationComplete}
                >
                    <Database className="mr-2 h-4 w-4" />
                    {migrationComplete ? 'Migración Completada' : 'Migrar Categorías'}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Migrar Categorías de Gastos</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <p>Esta acción convertirá las categorías de gastos a un formato optimizado que reduce las lecturas de Firestore de ~10-20 a solo 1.</p>

                        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                            <p className="font-semibold text-blue-900 mb-1">¿Qué hace?</p>
                            <ul className="list-disc list-inside text-blue-800 space-y-1">
                                <li>Lee todas las categorías existentes</li>
                                <li>Crea un documento unificado optimizado</li>
                                <li>Los documentos antiguos NO se eliminan (por seguridad)</li>
                            </ul>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                            <p className="font-semibold text-amber-900 mb-1">Después de migrar:</p>
                            <ul className="list-disc list-inside text-amber-800 space-y-1">
                                <li>Verifica que todo funciona correctamente</li>
                                <li>Elimina manualmente los documentos antiguos desde Firestore Console</li>
                            </ul>
                        </div>

                        <p className="text-sm font-semibold">¿Deseas continuar?</p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isMigrating}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleMigration();
                        }}
                        disabled={isMigrating}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isMigrating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Migrando...
                            </>
                        ) : (
                            'Migrar Ahora'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
