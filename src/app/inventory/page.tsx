
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ClipboardList, ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon

export default function InventoryPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center text-center bg-muted/40">
      <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-semibold mb-2">Módulo de Inventario Deshabilitado</h1>
      <p className="text-muted-foreground mb-6">Esta funcionalidad ha sido temporalmente desactivada.</p>
      <Link href="/admin/dashboard"> {/* Corrected redirection to admin dashboard */}
        <Button>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard {/* Updated button text and added icon */}
        </Button>
      </Link>
    </div>
  );
}
