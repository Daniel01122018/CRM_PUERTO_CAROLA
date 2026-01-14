"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function EmployeeLayout({
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
        } else {
            // Waiters, Kitchen, and Admins can all access the main dashboard? 
            // Usually Kitchen has its own view. 
            // Let's assume Employee and Admin can access standard POS features.
            // Kitchen might technically access it but it's not their primary view.

            if (currentUser.role === 'employee' || currentUser.role === 'admin') {
                setIsAuthorized(true);
            } else {
                // unauthorized
                router.push('/');
            }
        }
    }, [currentUser, isLoading, router]);

    if (isLoading || !isAuthorized) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Verificando acceso...</span>
            </div>
        );
    }

    return <>{children}</>;
}
