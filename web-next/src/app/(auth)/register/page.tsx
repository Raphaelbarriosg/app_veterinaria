'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Toast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['VET', 'OWNER'], {
    message: 'Selecciona un rol',
  }),
  phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

const roleOptions = [
  { value: 'VET', label: '🩺 Veterinario' },
  { value: 'OWNER', label: '🐾 Dueño de mascota' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'OWNER' },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error de registro' }));
        setToast({ message: err.message || 'Error al registrarse', type: 'error' });
        return;
      }

      setToast({ message: '¡Cuenta creada! Redirigiendo...', type: 'success' });
      setTimeout(() => router.push('/login'), 1200);
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
          <h1 className="auth-card-title">Crear cuenta</h1>
          <p className="auth-card-subtitle">
            Únete a la plataforma veterinaria VetCare
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <Input
            id="register-name"
            label="Nombre completo"
            type="text"
            placeholder="Dr. Juan García"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            id="register-email"
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            id="register-password"
            label="Contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            id="register-phone"
            label="Teléfono (opcional)"
            type="tel"
            placeholder="+56 9 1234 5678"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Select
            id="register-role"
            label="Tu rol en la plataforma"
            options={roleOptions}
            error={errors.role?.message}
            {...register('role')}
          />

          <Button
            id="register-submit"
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full mt-2"
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                Creando cuenta...
              </>
            ) : (
              'Crear cuenta'
            )}
          </Button>
        </form>

        <p className="auth-switch-text">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="auth-switch-link">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </>
  );
}
