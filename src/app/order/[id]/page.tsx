import AppHeader from "@/components/app-header";
import OrderView from "@/components/order/order-view";

interface OrderPageProps {
    params: {
        id: string;
    }
}

export default async function OrderPage({ params }: OrderPageProps) {
  const orderId = params.id;

  return (
    <div className="flex min-h-screen w-full flex-col">
        <AppHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <OrderView orderIdOrTableId={orderId} />
        </main>
    </div>
  );
}
