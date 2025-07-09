import AppHeader from "@/components/app-header";
import KitchenDisplay from "@/components/kitchen/kitchen-display";

export default function KitchenPage() {
    return (
        <div className="flex min-h-screen w-full flex-col bg-stone-50">
            <AppHeader />
            <main className="flex-1 p-4 md:p-6">
                <KitchenDisplay />
            </main>
        </div>
    );
}
