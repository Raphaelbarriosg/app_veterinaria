'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  PawPrint,
  Activity,
  AlertTriangle,
  Stethoscope,
  Clock,
  Mail,
  Phone,
  MapPin,
  Star,
  UserPlus,
  Trash2,
  Copy,
  Check,
  Shield,
  RefreshCw,
  Sliders,
  ChevronRight,
  UserCheck,
  ExternalLink,
  Info,
  Calendar,
} from 'lucide-react';
import { useClinicAdmin } from '@/hooks/use-clinic-admin';
import {
  translateRole,
  translateSpecies,
  formatDateString,
  ClinicMemberItem,
  ClinicInvitationItem,
} from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Toast } from '@/components/ui/toast';

export default function ClinicAdminPage() {
  const {
    currentClinicId,
    setActiveClinicId,
    clinics,
    currentClinic,
    stats,
    members,
    invitations,
    isLoading,
    statsLoading,
    inviteMember,
    cancelInvitation,
    updateMemberRole,
    removeMember,
    updateClinic,
    refreshAll,
  } = useClinicAdmin();

  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'settings'>('overview');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'VET' | 'OWNER' | 'CLINIC_ADMIN'>('VET');
  const [isInviting, setIsInviting] = useState(false);

  // Role change state
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [newRoleSelection, setNewRoleSelection] = useState<'VET' | 'OWNER' | 'CLINIC_ADMIN'>('VET');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Removing member state
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // Copied token state
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Settings form state
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string;
    currency: string;
    timezone: string;
  } | null>(null);

  // Initialize settings form when clinic loads
  const currentSettings = settingsForm || {
    name: stats?.clinic?.name || currentClinic?.name || '',
    email: stats?.clinic?.email || currentClinic?.email || '',
    phone: stats?.clinic?.phone || currentClinic?.phone || '',
    address: stats?.clinic?.address || currentClinic?.address || '',
    currency: stats?.clinic?.currency || 'CLP',
    timezone: stats?.clinic?.timezone || 'America/Santiago',
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setToast({ message: 'El correo electrónico es requerido', type: 'error' });
      return;
    }
    setIsInviting(true);
    try {
      await inviteMember({ email: inviteEmail.trim(), role: inviteRole });
      setToast({ message: `Invitación enviada con éxito a ${inviteEmail}`, type: 'success' });
      setInviteEmail('');
      setInviteRole('VET');
      setShowInviteModal(false);
    } catch (err: any) {
      setToast({ message: err?.message || 'Error al enviar la invitación', type: 'error' });
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvite = async (invitationId: string, email: string) => {
    if (!confirm(`¿Deseas revocar la invitación enviada a ${email}?`)) return;
    try {
      await cancelInvitation(invitationId);
      setToast({ message: 'Invitación cancelada correctamente', type: 'info' });
    } catch (err: any) {
      setToast({ message: err?.message || 'Error al cancelar la invitación', type: 'error' });
    }
  };

  const handleRoleChange = async (memberUserId: string) => {
    setIsUpdatingRole(true);
    try {
      await updateMemberRole(memberUserId, newRoleSelection);
      setToast({ message: 'Rol del miembro actualizado', type: 'success' });
      setEditingMemberId(null);
    } catch (err: any) {
      setToast({ message: err?.message || 'Error al cambiar el rol', type: 'error' });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleRemoveMember = async (member: ClinicMemberItem) => {
    if (
      !confirm(
        `¿Estás seguro de remover a ${member.user.name} (${translateRole(member.role)}) de la clínica?`
      )
    ) {
      return;
    }
    setRemovingMemberId(member.userId);
    try {
      await removeMember(member.userId);
      setToast({ message: `${member.user.name} ha sido removido de la clínica`, type: 'info' });
    } catch (err: any) {
      setToast({ message: err?.message || 'Error al remover al miembro', type: 'error' });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteUrl = `${origin}/invitations/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setToast({ message: 'Enlace de invitación copiado al portapapeles', type: 'success' });
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateClinic(currentSettings);
      setToast({ message: 'Información de la clínica actualizada con éxito', type: 'success' });
    } catch (err: any) {
      setToast({ message: err?.message || 'Error al guardar configuración', type: 'error' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const roleColors: Record<string, string> = {
    VET: 'role-vet',
    OWNER: 'role-owner',
    CLINIC_ADMIN: 'role-admin',
    SUPER_ADMIN: 'role-super',
  };

  if (isLoading && !currentClinic) {
    return (
      <div className="page flex items-center justify-center pt-16">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (!clinics || clinics.length === 0) {
    return (
      <div className="page animate-fade-in">
        <div className="empty-state large glass-card p-8">
          <Building2 className="w-12 h-12 text-slate-400 mb-3" />
          <h2 className="empty-state-title">Sin Clínicas Asignadas</h2>
          <p className="empty-state-text">
            No tienes ninguna clínica asociada con rol de Administrador.
          </p>
          <Link href="/clinics" className="btn-primary mt-4 inline-flex items-center gap-2">
            Ver todas las clínicas
          </Link>
        </div>
      </div>
    );
  }

  const clinicName = stats?.clinic?.name || currentClinic?.name || 'Mi Clínica';
  const clinicSlug = stats?.clinic?.slug || currentClinic?.slug || 'clinica';
  const clinicStatus = stats?.clinic?.status || currentClinic?.status || 'ACTIVE';

  return (
    <div className="page animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header & Clinic Selector */}
      <div
        className="glass-card"
        style={{
          padding: '1.5rem 1.75rem',
          marginBottom: '1.75rem',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,253,250,0.85))',
          border: '1px solid rgba(20,184,166,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #00a884 0%, #14b8a6 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 168, 132, 0.25)',
              }}
            >
              <Building2 className="w-7 h-7" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  {clinicName}
                </h1>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: clinicStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: clinicStatus === 'ACTIVE' ? '#059669' : '#d97706',
                    border: `1px solid ${clinicStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  }}
                >
                  {clinicStatus === 'ACTIVE' ? 'Activa' : 'En Prueba (Trial)'}
                </span>

                {stats?.subscription && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '20px',
                      background: 'rgba(251, 191, 36, 0.15)',
                      color: '#b45309',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Plan {stats.subscription.planType}
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Portal de Administración Clínica · @{clinicSlug}
              </p>
            </div>
          </div>

          {/* Quick Actions & Clinic Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {clinics.length > 1 && (
              <select
                className="form-input"
                style={{ width: 'auto', padding: '0.5rem 0.75rem', fontSize: '0.85rem', borderRadius: '10px' }}
                value={currentClinicId || ''}
                onChange={(e) => setActiveClinicId(e.target.value)}
              >
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshAll()}
              disabled={statsLoading}
              title="Actualizar datos"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </Button>

            <Button
              id="admin-invite-btn"
              size="sm"
              onClick={() => setShowInviteModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Invitar Miembro</span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderTop: '1px solid var(--color-border)',
            marginTop: '1.25rem',
            paddingTop: '0.75rem',
          }}
        >
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'overview' ? 'var(--color-accent)' : 'transparent',
              color: activeTab === 'overview' ? '#ffffff' : 'var(--color-text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <Activity className="w-4 h-4" />
            <span>Estadísticas en Tiempo Real</span>
          </button>

          <button
            id="admin-tab-team"
            onClick={() => setActiveTab('team')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'team' ? 'var(--color-accent)' : 'transparent',
              color: activeTab === 'team' ? '#ffffff' : 'var(--color-text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <Users className="w-4 h-4" />
            <span>Equipo ({members.length})</span>
            {invitations.length > 0 && (
              <span
                style={{
                  background: activeTab === 'team' ? '#ffffff' : 'var(--color-accent)',
                  color: activeTab === 'team' ? 'var(--color-accent)' : '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  marginLeft: '2px',
                }}
              >
                {invitations.length} pend.
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'settings' ? 'var(--color-accent)' : 'transparent',
              color: activeTab === 'settings' ? '#ffffff' : 'var(--color-text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <Sliders className="w-4 h-4" />
            <span>Configuración</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: ESTADÍSTICAS EN TIEMPO REAL (OVERVIEW)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* KPI Stats Grid */}
          <div className="stats-grid">
            {/* Card 1: Mascotas */}
            <div className="stat-card stat-card-neutral">
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(0, 168, 132, 0.12)',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PawPrint className="w-6 h-6" />
              </div>
              <div style={{ flex: 1 }}>
                <p className="stat-card-value">{stats?.totalPets ?? 0}</p>
                <p className="stat-card-label">Pacientes Registrados</p>
                {stats?.capacity && (
                  <div style={{ marginTop: '6px' }}>
                    <div
                      style={{
                        height: '5px',
                        background: '#e2e8f0',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        maxWidth: '120px',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${stats.capacity.pctPets}%`,
                          background: 'var(--color-accent)',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {stats.totalPets} de {stats.capacity.maxPets} cupos
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Tratamientos Activos */}
            <div className="stat-card stat-card-green">
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="stat-card-value" style={{ color: '#047857' }}>
                  {stats?.activeTreatments ?? 0}
                </p>
                <p className="stat-card-label">Tratamientos Activos</p>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  {stats?.completedTreatments ?? 0} completados
                </span>
              </div>
            </div>

            {/* Card 3: Veterinarios */}
            <div className="stat-card stat-card-neutral">
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Stethoscope className="w-6 h-6" />
              </div>
              <div style={{ flex: 1 }}>
                <p className="stat-card-value" style={{ color: '#1d4ed8' }}>
                  {stats?.vetsCount ?? 0}
                </p>
                <p className="stat-card-label">Veterinarios Activos</p>
                {stats?.capacity && (
                  <div style={{ marginTop: '6px' }}>
                    <div
                      style={{
                        height: '5px',
                        background: '#e2e8f0',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        maxWidth: '120px',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${stats.capacity.pctVets}%`,
                          background: '#3b82f6',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {stats.vetsCount} de {stats.capacity.maxVets} permitidos
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: Alertas Críticas */}
            <div
              className={`stat-card ${
                (stats?.criticalAlerts ?? 0) > 0 ? 'stat-card-red' : 'stat-card-neutral'
              }`}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: (stats?.criticalAlerts ?? 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                  color: (stats?.criticalAlerts ?? 0) > 0 ? '#dc2626' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p
                  className="stat-card-value"
                  style={{ color: (stats?.criticalAlerts ?? 0) > 0 ? '#dc2626' : 'inherit' }}
                >
                  {stats?.criticalAlerts ?? 0}
                </p>
                <p className="stat-card-label">Casos Críticos / Alertas</p>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  Semáforo rojo o alarma 24h
                </span>
              </div>
            </div>
          </div>

          {/* Two-Column Details Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Especies Distribution */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                <PawPrint className="w-5 h-5 text-teal-600" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  Distribución de Pacientes
                </h3>
              </div>

              {!stats?.speciesDistribution || stats.speciesDistribution.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No hay pacientes registrados aún.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {stats.speciesDistribution.map((item) => {
                    const total = stats.totalPets || 1;
                    const pct = Math.round((item.count / total) * 100);
                    return (
                      <div key={item.species}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>{translateSpecies(item.species)}</span>
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            {item.count} ({pct}%)
                          </span>
                        </div>
                        <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg, #00a884, #14b8a6)',
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Subscription & Plan Status */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  Suscripción & Cuotas del Plan
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: 'rgba(254, 243, 199, 0.4)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', textTransform: 'uppercase' }}>
                      Plan Contratado
                    </span>
                    <h4 style={{ margin: '2px 0 0 0', fontSize: '1.15rem', fontWeight: 700, color: '#78350f' }}>
                      {stats?.subscription?.planType || 'FREE'}
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#92400e' }}>Días restantes</span>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#b45309' }}>
                      {stats?.subscription?.daysRemaining ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Capacity Gauges */}
                {stats?.capacity && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span>Límite de Veterinarios</span>
                        <span style={{ fontWeight: 600 }}>
                          {stats.capacity.currentVets} / {stats.capacity.maxVets}
                        </span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${stats.capacity.pctVets}%`,
                            background: stats.capacity.pctVets > 85 ? '#ef4444' : '#10b981',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span>Capacidad de Pacientes</span>
                        <span style={{ fontWeight: 600 }}>
                          {stats.capacity.currentPets} / {stats.capacity.maxPets}
                        </span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${stats.capacity.pctPets}%`,
                            background: stats.capacity.pctPets > 85 ? '#ef4444' : '#00a884',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock className="w-5 h-5 text-teal-600" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  Actividad Clínica Reciente
                </h3>
              </div>
              <Link
                href="/vet"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Ver Semáforo Clínico <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Sin registros de evolución recientes en las últimas 24 horas.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      padding: '0.875rem 1rem',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'rgba(0, 168, 132, 0.08)',
                          color: 'var(--color-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      >
                        {activity.petSpecies.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                          {activity.petName}{' '}
                          <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                            ({activity.diagnosis})
                          </span>
                        </p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Registrado por {activity.registeredByName} ({translateRole(activity.registeredByRole)})
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {activity.alarmSigns && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                          }}
                        >
                          Alarma: {activity.alarmSigns}
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {formatDateString(activity.registeredAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: GESTIÓN COMPLETA DEL EQUIPO (TEAM TAB)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'team' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Team Header & Invitation Callout */}
          <div
            className="glass-card"
            style={{
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                Personal de la Clínica
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Gestiona los roles, accesos e invitaciones activas de tu equipo médico y de gestión.
              </p>
            </div>

            <Button
              id="team-invite-btn"
              onClick={() => setShowInviteModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus className="w-4 h-4" /> Invitar Miembro
            </Button>
          </div>

          {/* Active Members Section */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck className="w-5 h-5 text-teal-600" />
              Miembros Activos ({members.length})
            </h3>

            {members.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                No hay miembros registrados.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="member-item glass-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: '#ffffff',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="member-avatar">
                        {member.user.name?.charAt(0).toUpperCase() ?? 'U'}
                      </div>
                      <div>
                        <p className="member-name" style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                          {member.user.name}
                        </p>
                        <p className="member-email" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                          {member.user.email}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '3px 0 0 0' }}>
                          Incorporado el {formatDateString(member.joinedAt).split(' ')[0]}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {editingMemberId === member.userId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <select
                            className="form-input"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', borderRadius: '8px' }}
                            value={newRoleSelection}
                            onChange={(e) => setNewRoleSelection(e.target.value as any)}
                          >
                            <option value="VET">Veterinario</option>
                            <option value="CLINIC_ADMIN">Admin. Clínica</option>
                            <option value="OWNER">Dueño</option>
                          </select>
                          <Button
                            size="sm"
                            disabled={isUpdatingRole}
                            onClick={() => handleRoleChange(member.userId)}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            {isUpdatingRole ? <Spinner size="sm" /> : 'Guardar'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingMemberId(null)}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className={`role-badge ${roleColors[member.role] ?? ''}`}>
                            {translateRole(member.role)}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingMemberId(member.userId);
                              setNewRoleSelection(member.role as any);
                            }}
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                          >
                            Cambiar Rol
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={removingMemberId === member.userId}
                            onClick={() => handleRemoveMember(member)}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.35rem 0.65rem',
                              color: '#dc2626',
                              borderColor: 'rgba(239,68,68,0.3)',
                            }}
                            title="Remover de la clínica"
                          >
                            {removingMemberId === member.userId ? (
                              <Spinner size="sm" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations Section */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail className="w-5 h-5 text-teal-600" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  Invitaciones Pendientes ({invitations.length})
                </h3>
              </div>
            </div>

            {invitations.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                No hay invitaciones pendientes por aceptar en este momento.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      padding: '0.875rem 1.25rem',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{inv.email}</span>
                        <span className={`role-badge ${roleColors[inv.role] ?? ''}`}>
                          {translateRole(inv.role)}
                        </span>
                      </div>
                      <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Enviada el {formatDateString(inv.createdAt).split(' ')[0]} · Expira el{' '}
                        {formatDateString(inv.expiresAt).split(' ')[0]}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyInviteLink(inv.token)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}
                      >
                        {copiedToken === inv.token ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copiar Enlace
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelInvite(inv.id, inv.email)}
                        style={{ color: '#dc2626', borderColor: 'rgba(239,68,68,0.3)', fontSize: '0.75rem' }}
                        title="Revocar invitación"
                      >
                        Revocar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: CONFIGURACIÓN DE LA CLÍNICA (SETTINGS TAB)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="glass-card animate-fade-in" style={{ padding: '1.75rem', maxWidth: '720px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <Sliders className="w-5 h-5 text-teal-600" />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                Datos Generales de la Clínica
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Información de contacto que verán los clientes y miembros del equipo.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-field">
              <label className="form-label" htmlFor="clinic-name">
                Nombre de la Clínica
              </label>
              <Input
                id="clinic-name"
                value={currentSettings.name}
                onChange={(e) => setSettingsForm({ ...currentSettings, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-field">
                <label className="form-label" htmlFor="clinic-phone">
                  Teléfono de Contacto
                </label>
                <Input
                  id="clinic-phone"
                  value={currentSettings.phone}
                  placeholder="+56 2 2345 6789"
                  onChange={(e) => setSettingsForm({ ...currentSettings, phone: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="clinic-email">
                  Email de Notificaciones
                </label>
                <Input
                  id="clinic-email"
                  type="email"
                  value={currentSettings.email}
                  placeholder="contacto@vetcare.com"
                  onChange={(e) => setSettingsForm({ ...currentSettings, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="clinic-address">
                Dirección Física
              </label>
              <Input
                id="clinic-address"
                value={currentSettings.address}
                placeholder="Av. Providencia 1234, Santiago"
                onChange={(e) => setSettingsForm({ ...currentSettings, address: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-field">
                <label className="form-label" htmlFor="clinic-currency">
                  Moneda
                </label>
                <select
                  id="clinic-currency"
                  className="form-input"
                  value={currentSettings.currency}
                  onChange={(e) => setSettingsForm({ ...currentSettings, currency: e.target.value })}
                >
                  <option value="CLP">CLP ($)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="MXN">MXN ($)</option>
                  <option value="ARS">ARS ($)</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="clinic-timezone">
                  Zona Horaria
                </label>
                <select
                  id="clinic-timezone"
                  className="form-input"
                  value={currentSettings.timezone}
                  onChange={(e) => setSettingsForm({ ...currentSettings, timezone: e.target.value })}
                >
                  <option value="America/Santiago">America/Santiago (Chile)</option>
                  <option value="America/Buenos_Aires">America/Buenos_Aires (Argentina)</option>
                  <option value="America/Bogota">America/Bogota (Colombia)</option>
                  <option value="America/Mexico_City">America/Mexico_City (México)</option>
                  <option value="Europe/Madrid">Europe/Madrid (España)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button type="submit" disabled={isSavingSettings}>
                {isSavingSettings ? (
                  <>
                    <Spinner size="sm" /> Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: INVITAR MIEMBRO
          ───────────────────────────────────────────────────────────── */}
      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus className="w-5 h-5 text-teal-600" /> Invitar a la Clínica
              </h3>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
              <div className="form-field">
                <label className="form-label" htmlFor="modal-invite-email">
                  Correo Electrónico
                </label>
                <Input
                  id="modal-invite-email"
                  type="email"
                  placeholder="veterinario@clinica.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="modal-invite-role">
                  Rol en la Clínica
                </label>
                <select
                  id="modal-invite-role"
                  className="form-input"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                >
                  <option value="VET">Veterinario (Tratamientos, semáforo, evolución)</option>
                  <option value="CLINIC_ADMIN">Administrador de Clínica (Gestión y estadísticas)</option>
                  <option value="OWNER">Dueño de Mascota (Portal del cliente)</option>
                </select>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(0, 168, 132, 0.06)',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span>
                  El usuario recibirá un correo con el token de acceso. Si el servicio de correo está en modo dry-run, podrás copiar el enlace directamente desde la sección de invitaciones pendientes.
                </span>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isInviting}>
                  {isInviting ? (
                    <>
                      <Spinner size="sm" /> Enviando...
                    </>
                  ) : (
                    'Enviar Invitación'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
