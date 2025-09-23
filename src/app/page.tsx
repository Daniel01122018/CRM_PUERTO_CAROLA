import LoginForm from '@/components/login-form';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[url('/MainPage.jpg')] bg-cover bg-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white font-headline">El Puerto de Carola</h1>
            <p className="text-gray-200">Sistema de Gestión de Restaurantes</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
