'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
            <div className="mb-6 rounded-full bg-muted p-6">
                <WifiOff className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight">
                No tienes conexión a internet
            </h1>
            <p className="mb-8 max-w-sm text-muted-foreground">
                Parece que has perdido la conexión. Algunas funciones pueden no estar disponibles hasta que te reconectes.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
                Reintentar
            </button>
        </div>
    );
}
