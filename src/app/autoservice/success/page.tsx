import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export default function AutoserviceSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <SuccessClient />
        </Suspense>
    );
}
