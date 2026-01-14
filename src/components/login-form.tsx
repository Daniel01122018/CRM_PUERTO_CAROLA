
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  username: z.string().min(1, { message: 'El nombre de usuario es requerido.' }),
  password: z.string().min(1, { message: 'La contraseña es requerida.' }),
});

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, currentUser, claimAdmin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Redirection logic based on currentUser
  useEffect(() => {
    if (currentUser) {
      // Redirection logic by role
      if (currentUser.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (currentUser.role === 'kitchen') {
        router.push('/kitchen');
      } else if (currentUser.role === 'employee') {
        router.push('/dashboard');
      } else if (currentUser.role === 'kiosk') {
        router.push('/kiosk-menu');
      } else {
        // Fallback for debugging: If role doesn't match any known role
        // This helps if the user made a typo in Firestore (e.g. "Admin" instead of "admin")
        console.warn("Unknown role or role mismatch:", currentUser.role);
        toast({
          title: "Rol no reconocido",
          description: `Tu usuario tiene el rol: "${currentUser.role}". Verifica que esté escrito en minúsculas en Firestore (ej. 'admin').`,
          variant: "destructive"
        });
      }
    }
  }, [currentUser, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await login(values.username, values.password);
      // Wait a bit for the auth state listener to update currentUser
      // In real world, we might want to watch currentUser in a useEffect or similar, 
      // but here we just show success and let the root layout redirect based on currentUser change.
      // However, we need to know if we should redirect or show "Wait for approval"

      toast({
        title: 'Autenticación correcta',
        description: 'Verificando permisos...',
      });

      // The redirection logic is better handled by a useEffect dependent on currentUser 
      // or effectively we can just wait here a bit or assume the listener fires quickly.

    } catch (error: any) {
      console.error("Login failed:", error);
      let errorMessage = 'Usuario o contraseña incorrectos.';
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Credenciales inválidas.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intente más tarde.';
      }

      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: errorMessage,
      });
    }
  };

  const handleClaimAdmin = async () => {
    try {
      setIsClaiming(true);
      await claimAdmin();
      toast({
        title: 'Permisos asignados',
        description: 'Ahora eres administrador.',
      });
      // Redirection will happen automatically via useEffect
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo asignar el rol.',
      });
    } finally {
      setIsClaiming(false);
    }
  }

  if (currentUser && (currentUser.role as any) === 'guest') {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <p>Has iniciado sesión como <strong>{currentUser.username}</strong>.</p>
          <p className="text-sm text-yellow-600">Este usuario no tiene un rol asignado.</p>
          <Button onClick={handleClaimAdmin} disabled={isClaiming} className="w-full">
            {isClaiming ? 'Asignando...' : 'Inicializar como Administrador'}
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Pulsa este botón solo si estás configurando el sistema por primera vez.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de usuario</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. Mesero1" {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="********"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
