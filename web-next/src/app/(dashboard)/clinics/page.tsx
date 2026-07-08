'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import type { Clinic } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

function ClinicCardSkeleton() {
  return (
    <div className="clinic-card skeleton">
      <div className="skeleton-line w-48 h-5 mb-3" />
      <div className="skeleton-line w-32 h-3 mb-2" />
      <div className="skeleton-line w-full h-3 mb-1" />
      <div className="skeleton-line w-3/4 h-3" />
    </div>
  );
}

export default function ClinicsPage() {
  const { data: clinics, isLoading, error } = useSWR<Clinic[]>(
    '/clinics',
    (url: string) => api.get<any[]>(url).then((res) => res.map((item) => item.clinic))
  );

  const planLabels: Record<string, string> = {
    FREE: 'Gratuito',
    BASIC: 'Básico',
    PROFESSIONAL: 'Profesional',
    ENTERPRISE: 'Empresarial',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Activa',
    SUSPENDED: 'Suspendida',
    TRIAL: 'En prueba',
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏥 Mis Clínicas</h1>
          <p className="page-subtitle">Gestión de clínicas y equipos</p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ No se pudo cargar la información de clínicas.
        </div>
      )}

      {isLoading ? (
        <div className="clinic-grid">
          {[1, 2].map((i) => <ClinicCardSkeleton key={i} />)}
        </div>
      ) : !clinics || clinics.length === 0 ? (
        <div className="empty-state large">
          <span className="empty-state-icon">🏥</span>
          <h2 className="empty-state-title">No estás asociado a ninguna clínica</h2>
          <p className="empty-state-text">
            Contacta con un administrador para ser agregado a una clínica.
          </p>
        </div>
      ) : (
        <div className="clinic-grid">
          {clinics.map((clinic) => (
            <Link key={clinic.id} href={`/clinics/${clinic.id}`} className="clinic-card">
              <div className="clinic-card-header">
                <div className="clinic-icon">🏥</div>
                <div>
                  <h3 className="clinic-name">{clinic.name}</h3>
                  <p className="clinic-slug">@{clinic.slug}</p>
                </div>
                <span className={`clinic-status ${clinic.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                  {statusLabels[clinic.status] ?? clinic.status}
                </span>
              </div>

              {clinic.address && <p className="clinic-address">📍 {clinic.address}</p>}
              {clinic.email && <p className="clinic-email">✉️ {clinic.email}</p>}

              <div className="clinic-stats">
                {clinic._count && (
                  <>
                    <div className="clinic-stat">
                      <span className="clinic-stat-value">{clinic._count.members}</span>
                      <span className="clinic-stat-label">Miembros</span>
                    </div>
                    <div className="clinic-stat">
                      <span className="clinic-stat-value">{clinic._count.pets}</span>
                      <span className="clinic-stat-label">Pacientes</span>
                    </div>
                    <div className="clinic-stat">
                      <span className="clinic-stat-value">{clinic.maxVets}</span>
                      <span className="clinic-stat-label">Max VETs</span>
                    </div>
                  </>
                )}
              </div>

              {clinic.subscription && (
                <div className="clinic-plan">
                  <span className="clinic-plan-badge">
                    ⭐ Plan {planLabels[clinic.subscription.planType] ?? clinic.subscription.planType}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
