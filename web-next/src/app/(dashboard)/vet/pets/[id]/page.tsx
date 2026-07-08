'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { usePetById } from '@/hooks/use-pets';
import { useTreatmentsByPet } from '@/hooks/use-treatments';
import { useDailyLogs } from '@/hooks/use-daily-logs';
import { translateSpecies, formatDateString } from '@/lib/utils';
import type { Treatment, DailyLog } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

// ============================================
// Daily Log Card
// ============================================
function DailyLogCard({ log }: { log: DailyLog }) {
  const painColor = (log.painLevel ?? 0) >= 7 ? 'text-red' : (log.painLevel ?? 0) >= 4 ? 'text-yellow' : 'text-green';

  return (
    <div className="log-card animate-fade-in">
      <div className="log-card-header">
        <span className="log-date">{formatDateString(log.registeredAt)}</span>
        <span className={`log-medicine ${log.medicineTaken ? 'medicine-yes' : 'medicine-no'}`}>
          {log.medicineTaken ? '💊 Tomó medicamento' : '❌ No tomó medicamento'}
        </span>
      </div>

      <div className="log-levels">
        <div className="log-level-item">
          <span className="log-level-label">Apetito</span>
          <div className="log-level-bar">
            <div className="log-level-fill" style={{ width: `${(log.appetiteLevel / 10) * 100}%` }} />
          </div>
          <span className="log-level-value">{log.appetiteLevel}/10</span>
        </div>
        <div className="log-level-item">
          <span className="log-level-label">Energía</span>
          <div className="log-level-bar">
            <div className="log-level-fill" style={{ width: `${(log.energyLevel / 10) * 100}%` }} />
          </div>
          <span className="log-level-value">{log.energyLevel}/10</span>
        </div>
        {log.painLevel !== undefined && log.painLevel !== null && (
          <div className="log-level-item">
            <span className="log-level-label">Dolor</span>
            <div className="log-level-bar">
              <div className="log-level-fill pain-fill" style={{ width: `${(log.painLevel / 10) * 100}%` }} />
            </div>
            <span className={`log-level-value ${painColor}`}>{log.painLevel}/10</span>
          </div>
        )}
        {log.temperature && (
          <div className="log-level-item">
            <span className="log-level-label">Temperatura</span>
            <span className="log-level-value">{log.temperature}°C</span>
          </div>
        )}
      </div>

      {log.alarmSigns && (
        <div className="log-alarm">⚠️ {log.alarmSigns}</div>
      )}
      {log.observations && (
        <p className="log-observations">{log.observations}</p>
      )}
      {log.vetNotes && (
        <div className="log-vet-notes">
          <span className="log-vet-notes-label">🩺 Notas del veterinario:</span>
          <p>{log.vetNotes}</p>
        </div>
      )}
      {log.imageUrl && (
        <img src={log.imageUrl} alt="Foto del log" className="log-image" />
      )}
    </div>
  );
}

// ============================================
// Treatment Panel
// ============================================
function TreatmentPanel({ treatment }: { treatment: Treatment }) {
  const [page, setPage] = useState(1);
  const { logs, meta, isLoading } = useDailyLogs(treatment.id, page);

  const statusConfig: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: 'Activo', cls: 'status-active' },
    COMPLETED: { label: 'Completado', cls: 'status-inactive' },
    CANCELLED: { label: 'Cancelado', cls: 'status-error' },
    PAUSED: { label: 'Pausado', cls: 'status-warning' },
  };
  const sc = statusConfig[treatment.status] ?? statusConfig.ACTIVE;

  return (
    <div className="treatment-panel glass-card">
      <div className="treatment-panel-header">
        <div>
          <h3 className="treatment-panel-diagnosis">{treatment.diagnosis}</h3>
          <p className="treatment-panel-date">
            Inicio: {formatDateString(treatment.startDate)}
            {treatment.endDate && ` → ${formatDateString(treatment.endDate)}`}
          </p>
        </div>
        <span className={`status-badge ${sc.cls}`}>{sc.label}</span>
      </div>

      {/* Medication rules */}
      {treatment.rules && treatment.rules.length > 0 && (
        <div className="medication-rules">
          <h4 className="medication-rules-title">💊 Reglas de medicación</h4>
          <div className="medication-rules-list">
            {treatment.rules.map((rule) => (
              <div key={rule.id} className="medication-rule-item">
                <strong>{rule.medicineName}</strong>
                <span>{rule.dosage}</span>
                <span>Cada {rule.frequencyHours}h</span>
                {rule.requirePhoto && <span className="rule-photo-req">📷 Foto requerida</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily logs */}
      <div className="daily-logs-section">
        <div className="daily-logs-header">
          <h4 className="daily-logs-title">📋 Historial de logs</h4>
          <span className="daily-logs-count">{meta.total} registros</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-4"><Spinner /></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📋</span>
            <p className="empty-state-text">Sin logs registrados aún</p>
          </div>
        ) : (
          <>
            <div className="logs-list">
              {logs.map((log) => <DailyLogCard key={log.id} log={log} />)}
            </div>
            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Anterior
                </button>
                <span className="pagination-info">
                  {page} / {meta.totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// Main page
// ============================================
export default function VetPetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { pet, isLoading: petLoading, isError: petError } = usePetById(id);
  const { treatments, isLoading: treatmentsLoading } = useTreatmentsByPet(id);

  const speciesEmoji: Record<string, string> = {
    DOG: '🐕', CAT: '🐈', BIRD: '🦜', RODENT: '🐭', REPTILE: '🦎', OTHER: '🐾',
  };

  if (petLoading) {
    return (
      <div className="page">
        <div className="flex items-center gap-3 mb-6">
          <Spinner />
          <p className="text-text-secondary">Cargando paciente...</p>
        </div>
      </div>
    );
  }

  if (petError || !pet) {
    return (
      <div className="page">
        <div className="error-banner">Paciente no encontrado.</div>
        <Link href="/vet/pets" className="btn-secondary mt-4">← Volver a pacientes</Link>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/vet" className="breadcrumb-link">Dashboard</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href="/vet/pets" className="breadcrumb-link">Pacientes</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{pet.name}</span>
      </div>

      {/* Pet header */}
      <div className="pet-detail-header glass-card">
        <div className="pet-detail-avatar">
          <span className="pet-detail-emoji">{speciesEmoji[pet.species] ?? '🐾'}</span>
        </div>
        <div className="pet-detail-info">
          <h1 className="pet-detail-name">{pet.name}</h1>
          <div className="pet-detail-meta">
            <span>{translateSpecies(pet.species)}</span>
            {pet.breed && <span>· {pet.breed}</span>}
            {pet.weight && <span>· {pet.weight} kg</span>}
            {pet.birthDate && (
              <span>· Nació: {formatDateString(pet.birthDate)}</span>
            )}
            {pet.microchip && <span>· Microchip: {pet.microchip}</span>}
          </div>
          <span className={`pet-detail-status ${pet.isActive ? 'status-active' : 'status-inactive'}`}>
            {pet.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Treatments */}
      <div className="treatments-section">
        <h2 className="section-title">
          Tratamientos
          {!treatmentsLoading && (
            <span className="section-title-count">{treatments.length}</span>
          )}
        </h2>

        {treatmentsLoading ? (
          <div className="flex justify-center p-8"><Spinner size="lg" /></div>
        ) : treatments.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🩺</span>
            <p className="empty-state-text">Sin tratamientos registrados</p>
          </div>
        ) : (
          <div className="treatments-list">
            {treatments.map((t) => (
              <TreatmentPanel key={t.id} treatment={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
