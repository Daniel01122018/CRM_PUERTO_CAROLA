"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, Clock, Receipt, Printer, History, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AutoserviceSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get("id");
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push("/autoservice");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
            {/* Card Principal */}
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-200">

                {/* Header con gradiente sutil */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm mb-4">
                        <CheckCircle2 className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Orden Confirmada
                    </h1>
                    <p className="text-blue-100 text-sm">
                        Tu pedido está siendo procesado
                    </p>
                </div>

                {/* Contenido Principal */}
                <div className="p-6 space-y-6">
                    {/* Número de Orden */}
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 text-gray-600 text-sm font-medium mb-3">
                            <Receipt className="h-4 w-4" />
                            Número de Orden
                        </div>
                        {orderId && (
                            <div className="border-2 border-blue-100 bg-blue-50 rounded-xl p-4">
                                <p className="text-5xl font-black text-blue-700 tracking-tight">
                                    #{orderId}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Conserve este número para referencias
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Mensaje de confirmación */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <p className="text-gray-700 text-center">
                            <span className="font-semibold text-gray-900">¡Gracias por tu compra!</span>
                            <br />
                            Recibirás tu pedido en breve.
                        </p>
                    </div>

                    {/* Contador */}
                    <div className="flex items-center justify-center gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <div className="text-center">
                            <p className="text-sm text-gray-700">
                                Redireccionando en
                            </p>
                            <div className="flex items-center justify-center gap-1">
                                <div className="h-8 w-8 flex items-center justify-center bg-amber-500 text-white font-bold rounded">
                                    {countdown}
                                </div>
                                <span className="text-sm text-gray-600">segundos</span>
                            </div>
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="space-y-3">
                        <Button
                            onClick={() => router.push("/autoservice")}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                        >
                            <Home className="mr-2 h-5 w-5" />
                            Nuevo Pedido
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                onClick={() => window.print()}
                                className="h-11 border-gray-300 hover:bg-gray-50 rounded-lg"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push("/autoservice/history")}
                                className="h-11 border-gray-300 hover:bg-gray-50 rounded-lg"
                            >
                                <History className="mr-2 h-4 w-4" />
                                Historial
                            </Button>
                        </div>

                        <Link href="/dashboard" className="block">
                            <Button
                                variant="ghost"
                                className="w-full h-11 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver al Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                            <p className="text-xs text-gray-500">
                                ¿Necesitas ayuda?
                            </p>
                            <a
                                href="#"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Contactar Soporte
                            </a>
                        </div>
                        <div className="h-8 w-px bg-gray-300"></div>
                        <div className="text-center">
                            <p className="text-xs text-gray-500">
                                Horario de atención
                            </p>
                            <p className="text-sm text-gray-700 font-medium">
                                24/7
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Indicador de Sistema */}
            <div className="mt-6 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-xs text-gray-500 font-medium">
                    Sistema de Autoservicio • Conectado
                </p>
            </div>
        </div>
    );
}