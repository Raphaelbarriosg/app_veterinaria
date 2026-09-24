'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Star,
  Users,
  UserPlus,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  X,
  Sliders,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { translateRole } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';

interface ClinicDetail {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  maxVets: number;
  maxPets: number;
  subscription?: { planType: string; status: string };
  members: Array<{
    id: string;
    role: string;
    user: { id: string; name: string; email: string };
  }>;
}

interface InvitationItem {
  id: string;
  email: string;
  role: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['VET', 'OWNER', 'CLINIC_ADMIN']),
});

type InviteForm = z.infer<typeof inviteSchema>;

export default function ClinicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { data: clinic, isLoading, error, mutate } = useSWR<ClinicDetail>(
    `/clinics/${id}`,
    (url: string) => api.get<ClinicDetail>(url)
  );

  const { data: invitations, mutate: mutateInvitations } = useSWR<InvitationItem[]>(
    `/clinics/${id}/invitations`,
    (url: string) => api.get<InvitationItem[]>(url).catch(() => [])
  );

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'VET' },
  });

  const onInvite = async (data: InviteForm) => {
    try {
      await api.post(`/clinics/${id}/members/invite`, data);
      setToast({ message: 'Invitación enviada correctamente', type: 'success' });
      reset();
      setShowInvite(false);
      mutate();
      mutateInvitations();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al enviar invitación';
      setToast({ message: msg, type: 'error' });
    }
  };

  const onCancelInvite = async (invitationId: string) => {
    try {
      await api.delete(`/clinics/${id}/invitations/${invitationId}`);
      setToast({ message: 'Invitación cancelada', type: 'info' });
      mutateInvitations();
    } catch (err) {
      setToast({ message: 'Error al cancelar invitación', type: 'error' });
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${origin}/invitations/${token}`);
    setCopiedToken(token);
    setToast({ message: 'Enlace copiado al portapapeles', type: 'success' });
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const roleColors: Record<string, string> = {
    VET: 'role-vet',
    OWNER: 'role-owner',
    CLINIC_ADMIN: 'role-admin',
    SUPER_ADMIN: 'role-super',
  };

  if (isLoading) return <div className="page flex justify-center pt-16"><Spinner size="lg" /></div>;

  if (error || !clinic) {
    return (
      <div className="page">
        <div className="error-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle className="w-4 h-4 text-rose-400" /> No se pudo cargar la clínica.
        </div>
        <Link href="/clinics" className="btn-secondary mt-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="breadcrumb">
        <Link href="/clinics" className="breadcrumb-link">Clínicas</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{clinic.name}</span>
      </div>

      {/* Clinic header */}
      <div className="clinic-detail-header glass-card">
        <div className="clinic-detail-icon" style={{ background: 'rgba(20,184,166,0.1)', color: 'var(--color-accent)', padding: '16px', borderRadius: '14px' }}>
          <Building2 className="w-8 h-8" />
        </div>
        <div className="clinic-detail-info">
          <h1 className="clinic-detail-name">{clinic.name}</h1>
          <p className="clinic-detail-slug">@{clinic.slug}</p>
          <div className="clinic-detail-meta" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '4px' }}>
            {clinic.email && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {clinic.email}
              </span>
            )}
            {clinic.phone && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {clinic.phone}
              </span>
            )}
            {clinic.address && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {clinic.address}
              </span>
            )}
          </div>
          {clinic.subscription && (
            <span className="clinic-plan-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
              <Star className="w-3.5 h-3.5 text-amber-400" /> Plan {clinic.subscription.planType} · {clinic.subscription.status}
            </span>
          )}
        </div>
        <div className="clinic-detail-limits">
          <div className="limit-item">
            <span className="limit-value">{clinic.members?.length ?? 0}</span>
            <span className="limit-label">miembros</span>
          </div>
          <div className="limit-item">
            <span className="limit-value">{clinic.maxVets}</span>
            <span className="limit-label">max VETs</span>
          </div>
          <div className="limit-item">
            <span className="limit-value">{clinic.maxPets}</span>
            <span className="limit-label">max pacientes</span>
          </div>
        </div>
      </div>

      {/* Admin Dashboard Quick Access */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', marginBottom: '1.5rem' }}>
        <Link
          href="/clinic-admin"
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            fontSize: '0.875rem',
            padding: '0.55rem 1.15rem',
            borderRadius: '10px',
          }}
        >
          <Sliders className="w-4 h-4" /> Abrir Dashboard de Administrador
        </Link>
      </div>

      {/* Members section */}
      <div className="members-section">
        <div className="members-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users className="w-5 h-5 text-teal-400" /> Miembros del equipo
          </h2>
          <Button
            id="invite-member-btn"
            size="sm"
            onClick={() => setShowInvite(!showInvite)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {showInvite ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {showInvite ? 'Cancelar' : 'Invitar miembro'}
          </Button>
        </div>

        {/* Invite form */}
        {showInvite && (
          <div className="invite-form-container glass-card animate-fade-in">
            <h3 className="invite-form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus className="w-4 h-4 text-teal-400" /> Invitar nuevo miembro
            </h3>
            <form onSubmit={handleSubmit(onInvite)} className="invite-form">
              <Input
                id="invite-email"
                label="Email del nuevo miembro"
                type="email"
                placeholder="veterinario@email.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <div className="form-field">
                <label className="form-label" htmlFor="invite-role">Rol</label>
                <select id="invite-role" className="form-input" {...register('role')}>
                  <option value="VET">Veterinario</option>
                  <option value="OWNER">Dueño</option>
                  <option value="CLINIC_ADMIN">Admin. Clínica</option>
                </select>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Spinner size="sm" /> Enviando...</> : 'Enviar invitación'}
              </Button>
            </form>
          </div>
        )}

        {/* Members list */}
        {!clinic.members || clinic.members.length === 0 ? (
          <div className="empty-state">
            <Users className="w-10 h-10 text-slate-500 mb-2" />
            <p className="empty-state-text">No hay miembros registrados</p>
          </div>
        ) : (
          <div className="members-list">
            {clinic.members.map((member) => (
              <div key={member.id} className="member-item glass-card">
                <div className="member-avatar">
                  {member.user.name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div className="member-info">
                  <p className="member-name">{member.user.name}</p>
                  <p className="member-email">{member.user.email}</p>
                </div>
                <span className={`role-badge ${roleColors[member.role] ?? ''}`}>
                  {translateRole(member.role)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pending invitations */}
        {invitations && invitations.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail className="w-4 h-4 text-teal-400" /> Invitaciones Pendientes ({invitations.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inv.email}</span>
                    <span className={`role-badge ${roleColors[inv.role] ?? ''}`} style={{ marginLeft: '8px' }}>
                      {translateRole(inv.role)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyInviteLink(inv.token)}
                      style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedToken === inv.token ? <><Check className="w-3 h-3 text-emerald-500" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar Enlace</>}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCancelInvite(inv.id)}
                      style={{ fontSize: '0.75rem', color: '#dc2626', borderColor: 'rgba(239,68,68,0.3)' }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
