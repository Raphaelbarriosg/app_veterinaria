'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

  const { data: clinic, isLoading, error, mutate } = useSWR<ClinicDetail>(
    `/clinics/${id}`,
    (url: string) => api.get<ClinicDetail>(url)
  );

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'VET' },
  });

  const onInvite = async (data: InviteForm) => {
    try {
      await api.post(`/clinics/${id}/members/invite`, data);
      setToast({ message: '✅ Invitación enviada correctamente', type: 'success' });
      reset();
      setShowInvite(false);
      mutate();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al enviar invitación';
      setToast({ message: msg, type: 'error' });
    }
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
        <div className="error-banner">No se pudo cargar la clínica.</div>
        <Link href="/clinics" className="btn-secondary mt-4">← Volver</Link>
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
        <div className="clinic-detail-icon">🏥</div>
        <div className="clinic-detail-info">
          <h1 className="clinic-detail-name">{clinic.name}</h1>
          <p className="clinic-detail-slug">@{clinic.slug}</p>
          <div className="clinic-detail-meta">
            {clinic.email && <span>✉️ {clinic.email}</span>}
            {clinic.phone && <span>📞 {clinic.phone}</span>}
            {clinic.address && <span>📍 {clinic.address}</span>}
          </div>
          {clinic.subscription && (
            <span className="clinic-plan-badge">
              ⭐ Plan {clinic.subscription.planType} · {clinic.subscription.status}
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

      {/* Members section */}
      <div className="members-section">
        <div className="members-header">
          <h2 className="section-title">👥 Miembros del equipo</h2>
          <Button
            id="invite-member-btn"
            size="sm"
            onClick={() => setShowInvite(!showInvite)}
          >
            {showInvite ? 'Cancelar' : '+ Invitar miembro'}
          </Button>
        </div>

        {/* Invite form */}
        {showInvite && (
          <div className="invite-form-container glass-card animate-fade-in">
            <h3 className="invite-form-title">Invitar nuevo miembro</h3>
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
            <span className="empty-state-icon">👥</span>
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
      </div>
    </div>
  );
}
