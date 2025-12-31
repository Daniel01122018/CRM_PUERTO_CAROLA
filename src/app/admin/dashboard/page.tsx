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
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Module categories with dark blue theme and categorized accents
const moduleCategories = {
  operations: {
    gradient: "from-blue-500 to-indigo-600",
    // Light mode: Dark blue-gray with subtle blue tint
    bgLight: "from-slate-800 via-blue-900/40 to-slate-800",
    // Dark mode: Navy/midnight blue
    bgDark: "dark:from-blue-950 dark:via-slate-950 dark:to-blue-950",
    borderLight: "border-blue-400/30",
    borderDark: "dark:border-blue-500/40",
    hoverBorderLight: "hover:border-blue-400/60",
    hoverBorderDark: "dark:hover:border-blue-400/70",
    shadowLight: "hover:shadow-blue-500/10",
    shadowDark: "dark:hover:shadow-blue-500/20",
  },
  reports: {
    gradient: "from-purple-500 to-violet-600",
    bgLight: "from-slate-800 via-purple-900/40 to-slate-800",
    bgDark: "dark:from-purple-950 dark:via-slate-950 dark:to-purple-950",
    borderLight: "border-purple-400/30",
    borderDark: "dark:border-purple-500/40",
    hoverBorderLight: "hover:border-purple-400/60",
    hoverBorderDark: "dark:hover:border-purple-400/70",
    shadowLight: "hover:shadow-purple-500/10",
    shadowDark: "dark:hover:shadow-purple-500/20",
  },
  management: {
    gradient: "from-emerald-500 to-teal-600",
    bgLight: "from-slate-800 via-emerald-900/40 to-slate-800",
    bgDark: "dark:from-emerald-950 dark:via-slate-950 dark:to-emerald-950",
    borderLight: "border-emerald-400/30",
    borderDark: "dark:border-emerald-500/40",
    hoverBorderLight: "hover:border-emerald-400/60",
    hoverBorderDark: "dark:hover:border-emerald-400/70",
    shadowLight: "hover:shadow-emerald-500/10",
    shadowDark: "dark:hover:shadow-emerald-500/20",
  },
  finance: {
    gradient: "from-amber-500 to-orange-600",
    bgLight: "from-slate-800 via-amber-900/40 to-slate-800",
    bgDark: "dark:from-amber-950 dark:via-slate-950 dark:to-amber-950",
    borderLight: "border-amber-400/30",
    borderDark: "dark:border-amber-500/40",
    hoverBorderLight: "hover:border-amber-400/60",
    hoverBorderDark: "dark:hover:border-amber-400/70",
    shadowLight: "hover:shadow-amber-500/10",
    shadowDark: "dark:hover:shadow-amber-500/20",
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
    { label: "Gestión de Menú", icon: Utensils, path: "/admin/menu", category: "management" },
    { label: "Gestión de Inventario", icon: Package, path: "/inventory", category: "management" },
    { label: "Autoservicio (Kiosko)", icon: Smartphone, path: "/autoservice", category: "operations" },
    { label: "Admin. Kiosko", icon: Monitor, path: "/kiosk-admin", category: "operations" },
    { label: "Configuración", icon: Settings, path: "/admin/settings", category: "management" },
  ];

  if (!isMounted || !currentUser) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 dark:from-slate-950 dark:via-blue-950 dark:to-black">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
          <h1 className="text-xl font-semibold text-slate-200">
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
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 dark:from-slate-950 dark:via-blue-950 dark:to-black">
      {/* ======= HEADER ======= */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 sm:px-6 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-xl border-b border-blue-800/40 dark:border-blue-900/50 shadow-xl shadow-black/20">
        <div className="flex items-center gap-4">
          {/* Logo/Brand area - could add logo here */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Panel de Administrador
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* User avatar with initials */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-100">
                {currentUser.username}
              </p>
              <p className="text-xs text-slate-400 font-medium">Administrador</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-lg ring-2 ring-blue-200">
              {userInitials}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 border-2 border-slate-700 dark:border-slate-800 hover:border-red-500 hover:bg-red-950/30 text-slate-200 hover:text-red-400 transition-all duration-300"
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
                    bg-gradient-to-br ${category.bgLight} ${category.bgDark}
                    border-2 ${category.borderLight} ${category.borderDark}
                    ${category.hoverBorderLight} ${category.hoverBorderDark}
                    hover:shadow-2xl ${category.shadowLight} ${category.shadowDark}
                    hover:scale-[1.02]
                    transition-all duration-300 
                    rounded-2xl 
                    backdrop-blur-sm
                    relative
                    overflow-hidden
                  `}
                >
                  {/* Subtle animated background circle */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${category.gradient} opacity-5 dark:opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />

                  <CardContent className="flex flex-col items-center justify-center flex-1 gap-4 p-6 relative z-10">
                    {/* Icon with gradient background circle */}
                    <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${category.gradient} shadow-xl shadow-black/30 group-hover:shadow-2xl group-hover:shadow-black/40 transition-all duration-300`}>
                      <mod.icon className="h-12 w-12 sm:h-14 sm:w-14 text-white drop-shadow-lg" />
                      {/* Subtle glow effect on hover */}
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300`} />
                    </div>

                    <CardTitle className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
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
        <p className="text-xs text-slate-500 dark:text-slate-600 font-medium">
          Sistema de Gestión El Puerto de Carola
        </p>
      </footer>
    </div>
  );
}