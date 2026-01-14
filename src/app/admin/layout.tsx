"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
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
        } else if (currentUser.role !== 'admin') {
            router.push('/dashboard'); // Redirect non-admins to main dashboard or unauthorized page
            // Optionally show a toast here
        } else {
            setIsAuthorized(true);
        }
    }, [currentUser, isLoading, router]);

    if (isLoading || !isAuthorized) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Verificando permisos...</span>
            </div>
        );
    }

    return <>{children}</>;
}
