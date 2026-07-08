'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthUser } from '@/stores/auth-store';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginResponse {
  user: AuthUser;
}

const ROLE_REDIRECTS: Record<string, string> = {
  VET: '/vet',
  OWNER: '/owner',
  CLINIC_ADMIN: '/vet',
  SUPER_ADMIN: '/vet',
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error de conexión' }));
        setToast({ message: err.message || 'Credenciales inválidas', type: 'error' });
        return;
      }

      const result: LoginResponse = await res.json();
      setUser(result.user);

      setToast({ message: '¡Bienvenido de vuelta!', type: 'success' });

      const redirect = ROLE_REDIRECTS[result.user.role] ?? '/';
      setTimeout(() => router.push(redirect), 500);
    } catch {
      setToast({ message: 'Error de conexión. Intenta de nuevo.', type: 'error' });
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="auth-card animate-fade-in">
        <div className="auth-card-header">
          <h1 className="auth-card-title">Iniciar sesión</h1>
          <p className="auth-card-subtitle">
            Accede a tu panel de gestión veterinaria
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <Input
            id="login-email"
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            id="login-password"
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button
            id="login-submit"
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full mt-2"
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                Ingresando...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </Button>
        </form>

        {/* Credenciales demo */}
        <div className="auth-demo-creds">
          <p className="auth-demo-title">Credenciales de prueba</p>
          <div className="auth-demo-grid">
            <div className="auth-demo-item">
              <span className="auth-demo-role vet">VET</span>
              <span className="auth-demo-email">vet@test.com</span>
              <span className="auth-demo-pass">vet123</span>
            </div>
            <div className="auth-demo-item">
              <span className="auth-demo-role owner">OWNER</span>
              <span className="auth-demo-email">owner@test.com</span>
              <span className="auth-demo-pass">owner123</span>
            </div>
            <div className="auth-demo-item">
              <span className="auth-demo-role admin">ADMIN</span>
              <span className="auth-demo-email">admin@test.com</span>
              <span className="auth-demo-pass">admin123</span>
            </div>
          </div>
        </div>

        <p className="auth-switch-text">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="auth-switch-link">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </>
  );
}
