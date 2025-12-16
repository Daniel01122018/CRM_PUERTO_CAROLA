"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, Clock, Sparkles, PartyPopper, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SuccessClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get("id");
    const [countdown, setCountdown] = useState(10);
    const [showConfetti, setShowConfetti] = useState(true);

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

        // Hide confetti after 3 seconds
        const confettiTimer = setTimeout(() => setShowConfetti(false), 3000);

        return () => {
            clearInterval(timer);
            clearTimeout(confettiTimer);
        };
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Confetti effect */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(30)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${1 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Main card */}
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-8 border-white/20 backdrop-blur-xl relative z-10 animate-in zoom-in duration-500">

                {/* Success header with gradient */}
                <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8 text-center relative overflow-hidden">
                    {/* Animated circles */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl" />

                    {/* Success icon */}
                    <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-white shadow-2xl mb-6 relative animate-bounce">
                        <CheckCircle2 className="h-14 w-14 text-green-500" />
                        <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20" />
                    </div>

                    <h1 className="text-4xl font-black text-white mb-3 drop-shadow-lg">
                        ¡Pedido Confirmado!
                    </h1>
                    <div className="flex items-center justify-center gap-2">
                        <PartyPopper className="h-5 w-5 text-yellow-300" />
                        <p className="text-green-50 text-lg font-medium">
                            Tu pedido está siendo preparado
                        </p>
                        <Sparkles className="h-5 w-5 text-yellow-300" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    {/* Order number */}
                    <div className="text-center">
                        <div className="inline-flex items-center gap-3 text-gray-600 text-sm font-bold mb-4 uppercase tracking-wider">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            Tu Número de Orden
                            <Sparkles className="h-5 w-5 text-purple-500" />
                        </div>
                        {orderId && (
                            <div className="relative">
                                <div className="border-4 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-xl">
                                    <p className="text-7xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent tracking-tight">
                                        #{orderId}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-4 font-medium">
                                        Conserva este número para referencias
                                    </p>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-pulse" />
                                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                            </div>
                        )}
                    </div>

                    {/* Thank you message */}
                    <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-100">
                        <p className="text-center text-gray-800 font-medium leading-relaxed">
                            <span className="font-black text-xl text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text block mb-2">
                                ¡Gracias por tu compra!
                            </span>
                            Recibirás tu pedido en breve.
                            <br />
                            Esperamos que lo disfrutes 😊
                        </p>
                    </div>

                    {/* Countdown timer */}
                    <div className="flex items-center justify-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5">
                        <Clock className="h-8 w-8 text-amber-600 animate-pulse" />
                        <div className="text-center">
                            <p className="text-sm text-gray-700 font-bold mb-1">
                                Redireccionando automáticamente en
                            </p>
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-14 w-14 flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-2xl rounded-xl shadow-lg animate-pulse">
                                    {countdown}
                                </div>
                                <span className="text-lg text-gray-700 font-bold">segundos</span>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-3 pt-4">
                        <Button
                            onClick={() => router.push("/autoservice")}
                            className="w-full h-16 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
                        >
                            <Home className="mr-3 h-6 w-6" />
                            Hacer Nuevo Pedido
                        </Button>

                        <Link href="/dashboard" className="block">
                            <Button
                                variant="outline"
                                className="w-full h-14 text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-bold rounded-2xl border-2 border-gray-300 transition-all hover:scale-105"
                            >
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Volver al Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t-2 border-gray-100 p-6 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                        <p className="text-sm text-gray-600 font-bold">
                            Sistema Autoservicio Activo
                        </p>
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                    </div>
                </div>
            </div>
        </div>
    );
}
