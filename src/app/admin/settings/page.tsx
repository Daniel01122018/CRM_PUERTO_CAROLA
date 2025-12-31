"use client";

import { useState, useEffect } from 'react';
import { useBanks } from '@/hooks/use-banks';
import { useAuth } from '@/hooks/use-auth';
import { useRestaurantConfig } from '@/hooks/use-restaurant-config';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, ArrowLeft, Landmark, Loader2, Save, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BankSettingsPage() {
    const { banks, loading: banksLoading, addBank, deleteBank } = useBanks();
    const { config, updateTables, loading: configLoading } = useRestaurantConfig();
    const { currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [newBankName, setNewBankName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tableCount, setTableCount] = useState<string>('');

    useEffect(() => {
        if (config?.totalTables) {
            setTableCount(config.totalTables.toString());
        }
    }, [config]);

    if (banksLoading || configLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!currentUser || currentUser.role !== 'admin') {
        router.push('/');
        return null;
    }

    const handleSaveTables = async () => {
        const count = parseInt(tableCount);
        if (isNaN(count) || count < 1 || count > 50) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "La cantidad de mesas debe estar entre 1 y 50.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await updateTables(count);
            toast({
                title: "Mesas actualizadas",
                description: `El número de mesas ha sido actualizado a ${count}.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddBank = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBankName.trim()) return;

        setIsSubmitting(true);
        try {
            await addBank(newBankName.trim());
            setNewBankName('');
            toast({
                title: "Banco añadido",
                description: `El banco "${newBankName}" ha sido creado satisfactoriamente.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBank = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de eliminar el banco "${name}"?`)) return;

        try {
            await deleteBank(id);
            toast({
                title: "Banco eliminado",
                description: "La configuración ha sido removida.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo eliminar el banco.",
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-slate-800">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                Ajustes del Restaurante
                            </h1>
                            <p className="text-slate-400">Configura mesas y opciones de pago.</p>
                        </div>
                    </div>
                </div>

                {/* Table Configuration */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <LayoutGrid className="h-5 w-5 text-indigo-400" />
                            Configuración del Salón
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Define cuántas mesas hay disponibles en el salón (Máximo 50).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row items-end gap-4 max-w-md">
                            <div className="space-y-2 flex-1">
                                <label className="text-sm font-medium text-slate-300">Total de Mesas</label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={tableCount}
                                    onChange={(e) => setTableCount(e.target.value)}
                                    className="bg-slate-900 border-slate-700 text-white focus:ring-indigo-500"
                                />
                            </div>
                            <Button
                                onClick={handleSaveTables}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                disabled={isSubmitting || !tableCount}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Cambios
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Add Bank Form */}
                    <Card className="md:col-span-1 bg-slate-800 border-slate-700 h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Landmark className="h-5 w-5 text-blue-400" />
                                Nuevo Banco
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Añade una opción para pagos por transferencia.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddBank} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Nombre del banco..."
                                        value={newBankName}
                                        onChange={(e) => setNewBankName(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:ring-blue-500"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                    disabled={isSubmitting || !newBankName.trim()}
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Añadir Banco
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Bank List */}
                    <Card className="md:col-span-2 bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-lg">Bancos Registrados</CardTitle>
                            <CardDescription className="text-slate-400">
                                Estos bancos aparecerán en el selector de cobro.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {banks.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                                    No hay bancos configurados.
                                </div>
                            ) : (
                                <div className="rounded-md border border-slate-700 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-900">
                                            <TableRow className="border-slate-700 hover:bg-transparent">
                                                <TableHead className="text-slate-300">Nombre</TableHead>
                                                <TableHead className="text-right text-slate-300">Acción</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {banks.map((bank) => (
                                                <TableRow key={bank.id} className="border-slate-700 hover:bg-slate-700/50">
                                                    <TableCell className="font-medium">{bank.name}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteBank(bank.id, bank.name)}
                                                            className="text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
