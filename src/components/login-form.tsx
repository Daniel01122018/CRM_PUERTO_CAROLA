"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { USERS } from '@/lib/data';
import { useAppStore } from '@/hooks/use-app-store';
import { Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  username: z.string().min(1, { message: 'El nombre de usuario es requerido.' }),
  password: z.string().min(1, { message: 'La contraseña es requerida.' }),
});

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const expectedPassword = USERS[values.username as keyof typeof USERS];
    if (expectedPassword && expectedPassword === values.password) {
      login(values.username);
      toast({
        title: 'Inicio de sesión exitoso',
        description: `Bienvenido, ${values.username}!`,
      });
      if (values.username === 'cocina') {
        router.push('/kitchen');
      } else {
        router.push('/dashboard');
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: 'Usuario o contraseña incorrectos.',
      });
    }
  };

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
                  <FormLabel>Usuario</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. Mesero1" {...field} />
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
            <Button type="submit" className="w-full">
              Ingresar
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
