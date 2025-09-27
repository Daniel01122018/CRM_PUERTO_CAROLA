
"use client";

import AppSidebar from "@/components/app-sidebar";
import OrderView from "@/components/order/order-view";

interface OrderPageProps {
    params: {
        id: string;
    }
}

export default function OrderPage({ params }: OrderPageProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <OrderView orderIdOrTableId={params.id} />
        </main>
    </div>
  );
}
