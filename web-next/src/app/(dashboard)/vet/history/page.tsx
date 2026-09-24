'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Stethoscope,
  Printer,
  Calendar,
  User,
  PawPrint,
  FileText,
  Filter,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { formatDateString, translateSpecies } from '@/lib/utils';
import type { Treatment } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

interface HistoryResponse {
  data: Treatment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function VetHistoryPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  if (search.trim()) queryParams.set('q', search);
  if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
  queryParams.set('page', page.toString());
  queryParams.set('limit', '10');

  const { data, isLoading } = useSWR<HistoryResponse>(
    `/treatments/history?${queryParams.toString()}`,
    (url: string) => api.get<HistoryResponse>(url)
  );

  const treatments = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  return (
    <div className="page animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock className="w-6 h-6 text-teal-600" /> Historial Clínico de Tratamientos
          </h1>
          <p className="page-subtitle">
            Consulta permanente de todos los tratamientos completados, archivados o pausados.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Printer className="w-4 h-4" /> Exportar / Imprimir Todo
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ background: '#ffffff', border: '1px solid var(--color-border)', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '260px' }}>
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por diagnóstico o nombre de paciente..."
              className="search-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter className="w-4 h-4 text-slate-500" />
            {[
              { id: 'ALL', label: 'Todos los estados' },
              { id: 'COMPLETED', label: 'Completados' },
              { id: 'CANCELLED', label: 'Cancelados' },
              { id: 'PAUSED', label: 'Pausados' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setStatusFilter(st.id);
                  setPage(1);
                }}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: statusFilter === st.id ? 'bold' : 'normal',
                  border: statusFilter === st.id ? '1px solid var(--color-accent)' : '1px solid #e2e8f0',
                  background: statusFilter === st.id ? 'rgba(0,168,132,0.1)' : '#ffffff',
                  color: statusFilter === st.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center p-12"><Spinner size="lg" /></div>
      ) : treatments.length === 0 ? (
        <div className="empty-state large" style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '3rem 1rem' }}>
          <Clock className="w-12 h-12 text-slate-400 mb-3" />
          <h3 className="empty-state-title" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            No se encontraron tratamientos en el historial
          </h3>
          <p className="empty-state-text">
            Intenta cambiar los filtros de búsqueda o el estado seleccionado.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {treatments.map((treatment) => {
            const statusConfig: Record<string, { label: string; cls: string; icon: any }> = {
              COMPLETED: { label: 'Completado', cls: 'status-active', icon: CheckCircle2 },
              CANCELLED: { label: 'Cancelado', cls: 'status-error', icon: XCircle },
              PAUSED: { label: 'Pausado', cls: 'status-warning', icon: PauseCircle },
              ACTIVE: { label: 'En proceso', cls: 'status-active', icon: Stethoscope },
            };
            const sc = statusConfig[treatment.status] ?? statusConfig.COMPLETED;
            const StatusIcon = sc.icon;

            return (
              <div
                key={treatment.id}
                className="glass-card"
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--color-border)',
                  padding: '1.25rem',
                  borderRadius: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <StatusIcon className="w-4 h-4 text-teal-600" />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: 0 }}>{treatment.diagnosis}</h3>
                      <span className={`status-badge ${sc.cls}`}>{sc.label}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Inicio: {formatDateString(treatment.startDate)}
                      {treatment.endDate && ` — Fin: ${formatDateString(treatment.endDate)}`}
                    </p>
                  </div>

                  {treatment.pet && (
                    <Link
                      href={`/vet/pets/${treatment.pet.id}`}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '4px 10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <PawPrint className="w-3.5 h-3.5 text-teal-600" /> Ver Ficha Paciente
                    </Link>
                  )}
                </div>

                {/* Patient & Owner Info */}
                {treatment.pet && (
                  <div style={{ display: 'flex', gap: '1.5rem', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.825rem' }}>
                    <span>
                      Paciente: <strong>{treatment.pet.name}</strong> ({translateSpecies(treatment.pet.species)})
                    </span>
                    {treatment.pet.owner && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <User className="w-3.5 h-3.5 text-slate-400" /> Dueño: <strong>{treatment.pet.owner.name}</strong>
                      </span>
                    )}
                    <span>
                      Registros de evolución: <strong>{treatment.dailyLogs?.length || 0} logs</strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '1rem' }}>
              <button className="pagination-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                ← Anterior
              </button>
              <span className="pagination-info">
                Página {page} de {meta.totalPages} ({meta.total} totales)
              </span>
              <button className="pagination-btn" onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
