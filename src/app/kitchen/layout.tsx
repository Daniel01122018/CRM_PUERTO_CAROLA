"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function KitchenLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { currentUser, isLoading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (isLoading) return;

        if (!currentUser) {
            router.push('/');
        } else if (currentUser.role !== 'kitchen' && currentUser.role !== 'admin') {
            router.push('/dashboard'); // Redirect if not kitchen or admin
        } else {
            setIsAuthorized(true);
        }
    }, [currentUser, isLoading, router]);

    if (isLoading || !isAuthorized) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Verificando acceso a cocina...</span>
            </div>
        );
    }

    return <>{children}</>;
}
