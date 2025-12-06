"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home } from "lucide-react";
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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full text-center space-y-8 animate-in zoom-in-50 duration-500">
                <div className="flex justify-center">
                    <div className="h-32 w-32 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-20 w-20 text-green-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-gray-900">¡Pedido Enviado!</h1>
                    <p className="text-gray-500 text-lg">Tu orden ha sido registrada correctamente.</p>
                </div>

                {orderId && (
                    <div className="bg-gray-100 p-6 rounded-2xl">
                        <p className="text-gray-500 font-medium mb-2">Número de Orden</p>
                        <p className="text-6xl font-black text-blue-600">#{orderId}</p>
                    </div>
                )}

                <p className="text-sm text-gray-400">
                    Volviendo al inicio en {countdown} segundos...
                </p>

                <Link href="/autoservice" className="block">
                    <Button size="lg" className="w-full h-14 text-lg font-bold rounded-xl">
                        <Home className="mr-2 h-5 w-5" />
                        Volver al Inicio
                    </Button>
                </Link>
            </div>
        </div>
    );
}
