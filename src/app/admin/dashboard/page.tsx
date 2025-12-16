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
  Utensils,
  Package,
  TrendingUp,
  Smartphone,
  Monitor,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Module categories with their color themes
const moduleCategories = {
  operations: {
    gradient: "from-blue-500 to-indigo-600",
    bg: "from-blue-50 to-indigo-50",
    border: "border-blue-200/50",
    hoverBorder: "hover:border-blue-400/60",
    shadow: "hover:shadow-blue-100/50",
  },
  reports: {
    gradient: "from-purple-500 to-violet-600",
    bg: "from-purple-50 to-violet-50",
    border: "border-purple-200/50",
    hoverBorder: "hover:border-purple-400/60",
    shadow: "hover:shadow-purple-100/50",
  },
  management: {
    gradient: "from-emerald-500 to-teal-600",
    bg: "from-emerald-50 to-teal-50",
    border: "border-emerald-200/50",
    hoverBorder: "hover:border-emerald-400/60",
    shadow: "hover:shadow-emerald-100/50",
  },
  finance: {
    gradient: "from-amber-500 to-orange-600",
    bg: "from-amber-50 to-orange-50",
    border: "border-amber-200/50",
    hoverBorder: "hover:border-amber-400/60",
    shadow: "hover:shadow-amber-100/50",
  },
};

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
    { label: "Salón de Mesas", icon: LayoutGrid, path: "/dashboard", category: "operations" },
    { label: "Pedidos para Llevar", icon: ShoppingBag, path: "/takeaway", category: "operations" },
    { label: "Vista de Cocina", icon: ChefHat, path: "/kitchen", category: "operations" },
    { label: "Historial de Pedidos", icon: History, path: "/history", category: "reports" },
    { label: "Reportes Financieros", icon: BarChartBig, path: "/reports", category: "reports" },
    { label: "Reporte de Rendimiento", icon: TrendingUp, path: "/reports/performance", category: "reports" },
    { label: "Gestión de Gastos", icon: Wallet, path: "/expenses", category: "finance" },
    { label: "Gestión de Empleados", icon: Users, path: "/employees", category: "management" },
    { label: "Gestión de Menú", icon: Utensils, path: "/menu", category: "management" },
    { label: "Gestión de Inventario", icon: Package, path: "/inventory", category: "management" },
    { label: "Autoservicio (Kiosko)", icon: Smartphone, path: "/autoservice", category: "operations" },
    { label: "Admin. Kiosko", icon: Monitor, path: "/kiosk-admin", category: "operations" },
  ];

  if (!isMounted || !currentUser) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <h1 className="text-xl font-semibold text-gray-700">
            Cargando panel de administrador...
          </h1>
        </div>
      </div>
    );
  }

  // Get user initials for avatar
  const userInitials = currentUser.username
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* ======= HEADER ======= */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 sm:px-6 bg-white/80 backdrop-blur-xl border-b-2 border-gradient-to-r from-slate-200 via-blue-200 to-indigo-200 shadow-lg shadow-blue-100/20">
        <div className="flex items-center gap-4">
          {/* Logo/Brand area - could add logo here */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
            Panel de Administrador
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* User avatar with initials */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-700">
                {currentUser.username}
              </p>
              <p className="text-xs text-gray-500 font-medium">Administrador</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-lg ring-2 ring-blue-200">
              {userInitials}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 transition-all duration-300"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline font-semibold">Salir</span>
          </Button>
        </div>
      </header>

      {/* ======= MAIN ======= */}
      <main className="flex-1 w-full px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid gap-5 sm:gap-6 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          {modules.map((mod) => {
            const category = moduleCategories[mod.category as keyof typeof moduleCategories];

            return (
              <Link href={mod.path} key={mod.path} passHref className="block h-full group">
                <Card
                  className={`
                    h-full flex flex-col justify-between items-center text-center 
                    bg-gradient-to-br ${category.bg} 
                    border-2 ${category.border} ${category.hoverBorder}
                    hover:shadow-xl ${category.shadow}
                    hover:scale-[1.02]
                    transition-all duration-300 
                    rounded-2xl 
                    backdrop-blur-sm
                    relative
                    overflow-hidden
                  `}
                >
                  {/* Subtle animated background circle */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${category.gradient} opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />

                  <CardContent className="flex flex-col items-center justify-center flex-1 gap-4 p-6 relative z-10">
                    {/* Icon with gradient background circle */}
                    <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${category.gradient} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      <mod.icon className="h-12 w-12 sm:h-14 sm:w-14 text-white" />
                      {/* Subtle glow effect on hover */}
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300`} />
                    </div>

                    <CardTitle className="text-base sm:text-lg font-bold text-gray-800 leading-snug">
                      {mod.label}
                    </CardTitle>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Footer with subtle info */}
      <footer className="py-4 text-center">
        <p className="text-xs text-gray-500 font-medium">
          Sistema de Gestión El Puerto de Carola
        </p>
      </footer>
    </div>
  );
}