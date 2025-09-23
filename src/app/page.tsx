import LoginForm from '@/components/login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sky-100 to-sky-300 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary font-headline">El Puerto de Carola</h1>
            <p className="text-muted-foreground">Sistema de Gestión de Restaurantes</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
