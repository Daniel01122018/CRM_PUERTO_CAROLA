
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';

export default function InventoryPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center text-center bg-muted/40">
      <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-semibold mb-2">Módulo de Inventario Deshabilitado</h1>
      <p className="text-muted-foreground mb-6">Esta funcionalidad ha sido temporalmente desactivada.</p>
      <Link href="/dashboard">
        <Button>Volver al Salón</Button>
      </Link>
    </div>
  );
}
