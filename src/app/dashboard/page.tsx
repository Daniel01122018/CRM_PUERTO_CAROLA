
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import AppSidebar from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Square, CheckSquare, ShoppingBag, ArrowLeft } from 'lucide-react';
import type { Table } from '@/types';

/* ====== Componente Mesa Individual ====== */
function TableCard({ table }: { table: Table }) {
  const status = {
    available: {
      class: "bg-green-100/80 border-green-300 hover:bg-green-200/80",
      text: "Disponible",
      sub: "Lista para un nuevo pedido",
      icon: <CheckSquare className="h-3 w-3 text-green-800" />,
    },
    occupied: {
      class: "bg-amber-100/80 border-amber-300 hover:bg-amber-200/80",
      text: "Ocupada",
      sub: "Pedido en curso",
      icon: <Square className="h-3 w-3 text-amber-800" />,
    },
  };

  const { class: colorClass, text, sub, icon } =
    table.status === "occupied" ? status.occupied : status.available;

  return (
    <Link
      key={table.id}
      href={`/order/${table.orderId || `new-${table.id}`}`}
      className="block min-h-[120px] h-full"
    >
      <Card
        className={`transition-all duration-300 h-full flex flex-col justify-between border backdrop-blur-sm ${colorClass} hover:-translate-y-1 hover:shadow-md`}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
            Mesa {table.id}
          </CardTitle>
          <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
        </CardHeader>

        <CardContent className="flex flex-col justify-end">
          <div className="text-base sm:text-lg font-bold capitalize">{text}</div>
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1">
            {icon}
            <span>{sub}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/* ====== Página Principal ====== */
export default function DashboardPage() {
  const { isMounted, currentUser, tables } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isMounted && !currentUser) {
      router.push("/");
    }
  }, [currentUser, isMounted, router]);

  if (!isMounted || !currentUser || !tables) {
    return (
      <div className="flex h-screen items-center justify-center text-white text-lg">
        Cargando...
      </div>
    );
  }

  if (currentUser.role === "kitchen") {
    router.push("/kitchen");
    return (
      <div className="flex h-screen items-center justify-center text-white text-lg">
        Redirigiendo...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[url('/SalonPage.jpg')] bg-cover bg-center bg-fixed">
      {/* Capa de oscurecimiento para contraste */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col min-h-screen w-full">
        <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {/* ======= Header ======= */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <AppSidebar />
              <h1 className="text-2xl sm:text-3xl font-semibold text-white drop-shadow-md whitespace-nowrap">
                Salón de Mesas
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
              {currentUser.role === "admin" && (
                <Link href="/admin/dashboard" className="flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border-white/40"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Volver al Dashboard</span>
                    <span className="sm:hidden">Dashboard</span>
                  </Button>
                </Link>
              )}
              <Link href="/takeaway" className="flex-1 sm:flex-none">
                <Button
                  className="flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm bg-primary text-white hover:bg-primary/90"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden sm:inline">Para Llevar</span>
                  <span className="sm:hidden">Llevar</span>
                </Button>
              </Link>
            </div>
          </div>
                {/* ======= Grid de Mesas ======= */}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 sm:gap-4 w-full">
            {tables.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}