'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, AlertTriangle, Building2, UserCheck } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { translateRole } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';

interface InvitationInfo {
  id: string;
  email: string;
  role: string;
  clinic: {
    id: string;
    name: string;
    slug: string;
  };
}

import { Suspense } from 'react';

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Enlace de invitación inválido o token no proporcionado.');
      setLoading(false);
      return;
    }

    async function fetchInvitation() {
      try {
        const data = await api.get<InvitationInfo>(`/invitations/${token}`);
        setInvitation(data);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Error al validar el enlace de invitación.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const res = await api.post<{ message: string; clinicId: string }>(`/invitations/${token}/accept`, {});
      setToast({ message: '¡Membresía confirmada exitosamente!', type: 'success' });
      setTimeout(() => {
        router.push(`/clinics`);
      }, 1000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al aceptar invitación';
      setToast({ message: msg, type: 'error' });
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="auth-card animate-fade-in" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <Spinner size="lg" />
        <p className="text-sm text-slate-500 mt-4">Verificando token de correo electrónico...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="auth-card animate-fade-in" style={{ textAlign: 'center' }}>
        <div className="auth-logo-icon" style={{ margin: '0 auto 1rem', background: '#fef2f2', border: '1px solid #fecaca' }}>
          <AlertTriangle className="w-6 h-6 text-rose-500" />
        </div>
        <h2 className="auth-card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          Enlace No Válido o Expirado
        </h2>
        <p className="auth-card-subtitle" style={{ marginBottom: '1.5rem' }}>
          {error || 'La invitación ya no se encuentra disponible.'}
        </p>
        <Link href="/login" className="btn-primary w-full" style={{ justifyContent: 'center' }}>
          Ir al Inicio de Sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div className="auth-logo-icon" style={{ margin: '0 auto 1rem' }}>
          <Building2 className="w-6 h-6 text-teal-600" />
        </div>
        <h2 className="auth-card-title" style={{ fontSize: '1.35rem' }}>
          Invitación a Clínica Veterinaria
        </h2>
        <p className="auth-card-subtitle">
          Has sido invitado a unirte a <strong>{invitation.clinic.name}</strong>
        </p>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Correo Destinatario:</span>
          <strong>{invitation.email}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Rol Asignado:</span>
          <span className="status-badge status-active">{translateRole(invitation.role)}</span>
        </div>
      </div>

      {isAuthenticated && user?.email === invitation.email ? (
        <Button onClick={handleAccept} disabled={accepting} className="w-full" style={{ justifyContent: 'center' }}>
          {accepting ? <><Spinner size="sm" /> Aceptando...</> : <><UserCheck className="w-4 h-4 mr-2" /> Confirmar Membresía</>}
        </Button>
      ) : isAuthenticated ? (
        <div style={{ textAlign: 'center' }}>
          <p className="text-sm text-amber-600 mb-3">
            Iniciaste sesión como <strong>{user?.email}</strong>, pero esta invitación es para <strong>{invitation.email}</strong>.
          </p>
          <Link href="/login" className="btn-secondary w-full" style={{ justifyContent: 'center' }}>
            Cambiar de Cuenta
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href={`/login?email=${encodeURIComponent(invitation.email)}`} className="btn-primary w-full" style={{ justifyContent: 'center' }}>
            Iniciar Sesión para Aceptar
          </Link>
          <Link href={`/register?email=${encodeURIComponent(invitation.email)}`} className="btn-secondary w-full" style={{ justifyContent: 'center' }}>
            Crear Cuenta con este Correo
          </Link>
        </div>
      )}
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="auth-card animate-fade-in" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <Spinner size="lg" />
        <p className="text-sm text-slate-500 mt-4">Cargando formulario...</p>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}

