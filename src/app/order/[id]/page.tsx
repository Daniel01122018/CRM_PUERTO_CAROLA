"use client";

import AppSidebar from "@/components/app-sidebar";
import OrderView from "@/components/order/order-view";
import { use } from "react";

type OrderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function OrderPage({ params }: OrderPageProps) {
  // Unwrap params promise with React.use()
  const { id } = use(params);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <OrderView key={id} orderIdOrTableId={id} />
      </main>
    </div>
  );
}
