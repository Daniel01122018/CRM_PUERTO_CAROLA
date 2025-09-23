
"use client";

import AppHeader from "@/components/app-header";
import OrderView from "@/components/order/order-view";

interface OrderPageProps {
    params: {
        id: string;
    }
}

export default function OrderPage({ params }: OrderPageProps) {
  // Aunque 'params' puede ser una promesa en Server Components,
  // en Client Components como este, las props ya vienen resueltas.
  // Pasamos el ID directamente al componente OrderView.
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AppHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <OrderView orderIdOrTableId={params.id} />
        </main>
    </div>
  );
}
