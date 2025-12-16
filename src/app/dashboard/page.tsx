
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import AppSidebar from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Square, CheckSquare, ShoppingBag, ArrowLeft, Monitor } from 'lucide-react';
import type { Table } from '@/types';

/* ====== Componente Mesa Individual ====== */
function TableCard({ table }: { table: Table }) {
  const status = {
    available: {
      class: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300/60 hover:border-green-400 hover:shadow-green-200/40",
      text: "Disponible",
      sub: "Lista para un nuevo pedido",
      icon: <CheckSquare className="h-3 w-3 text-green-700" />,
      accentGradient: "from-green-500 to-emerald-600",
    },
    occupied: {
      class: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300/60 hover:border-amber-400 hover:shadow-amber-200/40",
      text: "Ocupada",
      sub: "Pedido en curso",
      icon: <Square className="h-3 w-3 text-amber-700" />,
      accentGradient: "from-amber-500 to-orange-600",
    },
  };

  const { class: colorClass, text, sub, icon, accentGradient } =
    table.status === "occupied" ? status.occupied : status.available;

  return (
    <Link
      key={table.id}
      href={`/order/${table.orderId || `new-${table.id}`}`}
      className="block min-h-[130px] h-full group"
    >
      <Card
        className={`transition-all duration-300 h-full flex flex-col justify-between border-2 backdrop-blur-md ${colorClass} hover:-translate-y-1.5 hover:shadow-xl relative overflow-hidden`}
      >
        {/* Subtle background circle decoration */}
        <div className={`absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br ${accentGradient} opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />

        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
          <CardTitle className="text-sm sm:text-base font-black text-gray-900">
            Mesa {table.id}
          </CardTitle>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${accentGradient} shadow-md group-hover:shadow-lg transition-all duration-300`}>
            <UtensilsCrossed className="h-4 w-4 text-white" />
          </div>
        </CardHeader>

        <CardContent className="flex flex-col justify-end relative z-10">
          <div className="text-base sm:text-lg font-black capitalize text-gray-900">{text}</div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 font-medium mt-1">
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
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
          <span className="text-xl font-semibold text-white drop-shadow-lg">Cargando...</span>
        </div>
      </div>
    );
  }

  if (currentUser.role === "kitchen") {
    router.push("/kitchen");
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
        <span className="text-xl font-semibold text-white drop-shadow-lg">Redirigiendo...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[url('/SalonPage.jpg')] bg-cover bg-center bg-fixed">
      {/* Enhanced overlay with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-blue-900/40 backdrop-blur-[2px]" />

      <div className="relative z-10 flex flex-col min-h-screen w-full">
        <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {/* ======= Header ======= */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <AppSidebar />
              <div className="flex items-center gap-2">
                <div className="hidden sm:block w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <UtensilsCrossed className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-2xl whitespace-nowrap bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Salón de Mesas
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
              {currentUser.role === "admin" && (
                <Link href="/admin/dashboard" className="flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm bg-white/15 backdrop-blur-xl hover:bg-white/25 text-white border-2 border-white/30 hover:border-white/50 font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Volver al Dashboard</span>
                    <span className="sm:hidden">Dashboard</span>
                  </Button>
                </Link>
              )}
              <Link href="/takeaway" className="flex-1 sm:flex-none">
                <Button
                  className="flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/30"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden sm:inline">Para Llevar</span>
                  <span className="sm:hidden">Llevar</span>
                </Button>
              </Link>
              <Link href="/kiosk-admin" className="flex-1 sm:flex-none">
                <Button
                  variant="secondary"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm bg-white/90 hover:bg-white text-gray-900 font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <Monitor className="h-4 w-4" />
                  <span className="hidden sm:inline">Autoservicio</span>
                  <span className="sm:hidden">Kiosk</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* ======= Grid de Mesas ======= */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4 sm:gap-5 w-full">
            {tables.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}