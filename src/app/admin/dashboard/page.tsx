"use client";

import Link from "next/link";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  BarChartBig,
  Wallet,
  ChefHat,
  History,
  LayoutGrid,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboard() {
  const { currentUser, isMounted, logout } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isMounted && (!currentUser || currentUser.role !== "admin")) {
      router.push("/");
    }
  }, [currentUser, isMounted, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const modules = [
    { label: "Salón de Mesas", icon: LayoutGrid, path: "/dashboard" },
    { label: "Pedidos para Llevar", icon: ShoppingBag, path: "/takeaway" },
    { label: "Vista de Cocina", icon: ChefHat, path: "/kitchen" },
    { label: "Historial de Pedidos", icon: History, path: "/history" },
    { label: "Reportes Financieros", icon: BarChartBig, path: "/reports" },
    { label: "Gestión de Gastos", icon: Wallet, path: "/expenses" },
    { label: "Gestión de Empleados", icon: Users, path: "/employees" },
  ];

  if (!isMounted || !currentUser) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-semibold mb-4">
          Cargando panel de administrador...
        </h1>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* ======= HEADER ======= */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-background border-b shadow-sm">
        <h1 className="text-lg sm:text-2xl font-bold text-primary truncate">
          Panel de Administrador
        </h1>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden sm:block font-medium text-sm truncate max-w-[120px] sm:max-w-[180px]">
            Bienvenido, {currentUser.username}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1 sm:gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>
      {/* ======= MAIN ======= */}
      <main className="flex-1 w-full px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in">
        <div
          className="grid gap-4 sm:gap-6 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]"
        >
          {modules.map((mod) => (
            <Link href={mod.path} key={mod.path} passHref className="block h-full">
              <Card className="h-full flex flex-col justify-between items-center text-center hover:bg-primary/5 hover:shadow-lg transition-all duration-300 rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center flex-1 gap-4 p-6">
                  <mod.icon className="h-16 w-16 sm:h-20 sm:w-20 text-primary" />
                  <CardTitle className="text-base sm:text-lg font-semibold">
                    {mod.label}
                  </CardTitle>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}