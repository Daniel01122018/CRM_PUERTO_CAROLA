"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, Hammer } from 'lucide-react';

const MenuManagementPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <Hammer className="h-8 w-8" /> Módulo de Menú
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-muted-foreground">
            Este módulo está actualmente en construcción.
          </p>
          <p className="text-md text-gray-600">
            ¡Pronto podrás gestionar tus categorías, opciones maestras y variantes de menú aquí!
          </p>
          <Button onClick={() => router.push('/admin/dashboard')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuManagementPage;
