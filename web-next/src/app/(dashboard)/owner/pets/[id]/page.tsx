'use client';

import { use, useState, useRef } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePetById } from '@/hooks/use-pets';
import { useTreatmentsByPet } from '@/hooks/use-treatments';
import { useDailyLogs } from '@/hooks/use-daily-logs';
import { translateSpecies, formatDateString } from '@/lib/utils';
import { api, ApiError } from '@/lib/api-client';
import type { DailyLog, Treatment } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';

// ============================================
// Daily Log Form Schema
// ============================================
const dailyLogSchema = z.object({
  medicineTaken: z.boolean(),
  appetiteLevel: z.coerce.number().min(0).max(10),
  energyLevel: z.coerce.number().min(0).max(10),
  painLevel: z.coerce.number().min(0).max(10).optional(),
  temperature: z
    .coerce
    .number()
    .min(35)
    .max(42)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
  alarmSigns: z.string().optional(),
  observations: z.string().optional(),
});

type DailyLogForm = z.infer<typeof dailyLogSchema>;

// ============================================
// Range Slider
// ============================================
function RangeSlider({
  label,
  name,
  min = 0,
  max = 10,
  value,
  onChange,
  colorMap,
}: {
  label: string;
  name: string;
  min?: number;
  max?: number;
  value: number;
  onChange: (v: number) => void;
  colorMap?: (v: number) => string;
}) {
  const color = colorMap ? colorMap(value) : 'var(--color-accent)';
  return (
    <div className="range-slider-group">
      <div className="range-slider-header">
        <label className="range-slider-label">{label}</label>
        <span className="range-slider-value" style={{ color }}>
          {value}/{max}
        </span>
      </div>
      <input
        type="range"
        id={name}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-slider"
        style={{ accentColor: color }}
      />
      <div className="range-slider-ticks">
        <span>0</span>
        <span>{Math.round(max / 2)}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// ============================================
// Image Upload Component
// ============================================
type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

function ImageUploadField({
  onUrlReady,
}: {
  onUrlReady: (url: string | null) => void;
}) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mostrar preview local inmediatamente
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setStatus('uploading');
    setErrorMsg('');
    onUrlReady(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error al subir' }));
        throw new Error(err.message || 'Error al subir la imagen');
      }

      const { url } = await res.json();
      onUrlReady(url);
      setStatus('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setErrorMsg(msg);
      setStatus('error');
      onUrlReady(null);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setStatus('idle');
    setErrorMsg('');
    onUrlReady(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="form-field">
      <label className="form-label">📸 Foto del progreso — opcional</label>

      {/* Zona de carga */}
      {!preview ? (
        <label
          htmlFor="log-image-upload"
          className="image-upload-zone"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '24px',
            border: '2px dashed var(--color-border)',
            borderRadius: '12px',
            cursor: 'pointer',
            background: 'var(--color-surface)',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = 'var(--color-accent)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = 'var(--color-border)')
          }
        >
          <span style={{ fontSize: '2rem' }}>📷</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Haz clic para seleccionar una foto
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', opacity: 0.7 }}>
            JPG, PNG, WEBP — máx. 10 MB
          </span>
          <input
            ref={fileInputRef}
            id="log-image-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
      ) : (
        <div
          style={{
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '2px solid var(--color-border)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vista previa"
            style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
          />
          {/* Overlay de estado */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: '#fff' }}>
              {status === 'uploading' && <><Spinner size="sm" /> &nbsp;Subiendo imagen...</>}
              {status === 'done' && '✅ Imagen lista'}
              {status === 'error' && `❌ ${errorMsg}`}
            </span>
            <button
              type="button"
              onClick={handleRemove}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                padding: '4px 10px',
                fontSize: '0.75rem',
              }}
            >
              Quitar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Daily Log Form Modal
// ============================================
function DailyLogFormModal({
  treatmentId,
  onSuccess,
  onClose,
}: {
  treatmentId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [appetite, setAppetite] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [pain, setPain] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: {
      medicineTaken: false,
      appetiteLevel: 5,
      energyLevel: 5,
      painLevel: 0,
    },
  });

  const onSubmit = async (data: DailyLogForm) => {
    try {
      await api.post('/daily-logs', {
        ...data,
        treatmentId,
        appetiteLevel: appetite,
        energyLevel: energy,
        painLevel: pain,
        imageUrl: imageUrl ?? undefined,
      });
      setToast({ message: '✅ Log registrado correctamente', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al guardar el log';
      setToast({ message: msg, type: 'error' });
    }
  };

  const painColor = (v: number) =>
    v >= 7
      ? 'var(--color-status-red)'
      : v >= 4
      ? 'var(--color-status-yellow)'
      : 'var(--color-status-green)';

  return (
    <div className="modal-overlay" onClick={onClose}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">📋 Registrar Daily Log</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          {/* Medicine taken */}
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="medicineTaken"
              {...register('medicineTaken')}
              className="checkbox-input"
            />
            <label htmlFor="medicineTaken" className="checkbox-label">
              💊 El animal tomó su medicamento
            </label>
          </div>

          {/* Sliders */}
          <RangeSlider label="Nivel de apetito" name="appetite" value={appetite} onChange={setAppetite} />
          <RangeSlider label="Nivel de energía" name="energy" value={energy} onChange={setEnergy} />
          <RangeSlider
            label="Nivel de dolor"
            name="pain"
            value={pain}
            onChange={setPain}
            colorMap={painColor}
          />

          {/* Temperature */}
          <div className="form-field">
            <label className="form-label" htmlFor="log-temperature">
              Temperatura (°C) — opcional
            </label>
            <input
              id="log-temperature"
              type="number"
              step="0.1"
              min="35"
              max="42"
              placeholder="38.5"
              className="form-input"
              {...register('temperature')}
            />
          </div>

          {/* Alarm signs */}
          <div className="form-field">
            <label className="form-label" htmlFor="log-alarm">
              Signos de alarma — opcional
            </label>
            <input
              id="log-alarm"
              type="text"
              placeholder="Ej: vómito, dificultad al respirar..."
              className="form-input"
              {...register('alarmSigns')}
            />
          </div>

          {/* Observations */}
          <div className="form-field">
            <label className="form-label" htmlFor="log-observations">
              Observaciones
            </label>
            <textarea
              id="log-observations"
              rows={3}
              placeholder="Describe cómo estuvo el animal hoy..."
              className="form-textarea"
              {...register('observations')}
            />
          </div>

          {/* Photo upload */}
          <ImageUploadField onUrlReady={setImageUrl} />

          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" /> Guardando...
                </>
              ) : (
                'Guardar log'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Log photo viewer
// ============================================
function LogPhoto({ url }: { url: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        style={{
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          display: 'block',
          width: '100%',
          marginTop: '8px',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
        title="Ver foto completa"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Foto del progreso"
          style={{
            width: '100%',
            maxHeight: '160px',
            objectFit: 'cover',
            display: 'block',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
          }}
        />
        <p
          style={{
            fontSize: '0.72rem',
            color: 'var(--color-text-muted)',
            margin: '4px 0 0',
            textAlign: 'center',
          }}
        >
          📸 Ver foto completa
        </p>
      </button>

      {/* Lightbox */}
      {expanded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setExpanded(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Foto del progreso (ampliada)"
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              borderRadius: '12px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
            }}
          />
          <button
            type="button"
            onClick={() => setExpanded(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '1.2rem',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

// ============================================
// Treatment section for owner
// ============================================
function OwnerTreatmentCard({ treatment }: { treatment: Treatment }) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [page, setPage] = useState(1);
  const { logs, meta, isLoading, refresh } = useDailyLogs(treatment.id, page);

  const statusConfig: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: 'Activo', cls: 'status-active' },
    COMPLETED: { label: 'Completado', cls: 'status-inactive' },
    CANCELLED: { label: 'Cancelado', cls: 'status-error' },
    PAUSED: { label: 'Pausado', cls: 'status-warning' },
  };
  const sc = statusConfig[treatment.status] ?? statusConfig.ACTIVE;

  return (
    <>
      {showLogForm && (
        <DailyLogFormModal
          treatmentId={treatment.id}
          onSuccess={refresh}
          onClose={() => setShowLogForm(false)}
        />
      )}

      <div className="treatment-panel glass-card">
        <div className="treatment-panel-header">
          <div>
            <h3 className="treatment-panel-diagnosis">{treatment.diagnosis}</h3>
            <p className="treatment-panel-date">Desde: {formatDateString(treatment.startDate)}</p>
          </div>
          <div className="treatment-panel-actions">
            <span className={`status-badge ${sc.cls}`}>{sc.label}</span>
            {treatment.status === 'ACTIVE' && (
              <Button
                size="sm"
                onClick={() => setShowLogForm(true)}
                id={`add-log-${treatment.id}`}
              >
                + Registrar log
              </Button>
            )}
          </div>
        </div>

        {/* Medication rules */}
        {treatment.rules && treatment.rules.length > 0 && (
          <div className="medication-rules">
            <h4 className="medication-rules-title">💊 Medicamentos</h4>
            <div className="medication-rules-list">
              {treatment.rules.map((rule) => (
                <div key={rule.id} className="medication-rule-item">
                  <strong>{rule.medicineName}</strong>
                  <span>{rule.dosage}</span>
                  <span>Cada {rule.frequencyHours}h</span>
                  {rule.requirePhoto && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: 'rgba(99,179,237,0.15)',
                        color: 'var(--color-accent)',
                      }}
                    >
                      📸 requiere foto
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent logs */}
        <div className="daily-logs-section">
          <div className="daily-logs-header">
            <h4 className="daily-logs-title">📋 Mis registros</h4>
            <span className="daily-logs-count">{meta.total} registros</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-4">
              <Spinner />
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">Aún no hay logs. ¡Registra el primero!</p>
            </div>
          ) : (
            <>
              {logs.map((log: DailyLog) => (
                <div key={log.id} className="log-card">
                  <div className="log-card-header">
                    <span className="log-date">{formatDateString(log.registeredAt)}</span>
                    <span className={`log-medicine ${log.medicineTaken ? 'medicine-yes' : 'medicine-no'}`}>
                      {log.medicineTaken ? '💊 Tomó' : '❌ No tomó'}
                    </span>
                  </div>
                  <div className="log-mini-stats">
                    <span>🍽️ Apetito: {log.appetiteLevel}/10</span>
                    <span>⚡ Energía: {log.energyLevel}/10</span>
                    {log.painLevel !== undefined && log.painLevel !== null && (
                      <span>😣 Dolor: {log.painLevel}/10</span>
                    )}
                    {log.temperature && <span>🌡️ {log.temperature}°C</span>}
                  </div>
                  {log.observations && <p className="log-observations">{log.observations}</p>}
                  {log.alarmSigns && <div className="log-alarm">⚠️ {log.alarmSigns}</div>}
                  {/* ——— FOTO DEL PROGRESO ——— */}
                  {log.imageUrl && <LogPhoto url={log.imageUrl} />}
                </div>
              ))}
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
    </>
  );
}

// ============================================
// Main page
// ============================================
export default function OwnerPetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { pet, isLoading, isError } = usePetById(id);
  const { treatments, isLoading: treatmentsLoading } = useTreatmentsByPet(id);

  const speciesEmoji: Record<string, string> = {
    DOG: '🐕',
    CAT: '🐈',
    BIRD: '🦜',
    RODENT: '🐭',
    REPTILE: '🦎',
    OTHER: '🐾',
  };

  if (isLoading) {
    return (
      <div className="page flex justify-center pt-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !pet) {
    return (
      <div className="page">
        <div className="error-banner">Mascota no encontrada.</div>
        <Link href="/owner" className="btn-secondary mt-4">
          ← Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      <div className="breadcrumb">
        <Link href="/owner" className="breadcrumb-link">
          Mis mascotas
        </Link>
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
          </div>
        </div>
      </div>

      {/* Treatments */}
      <div className="treatments-section">
        <h2 className="section-title">Tratamientos activos</h2>

        {treatmentsLoading ? (
          <div className="flex justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : treatments.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🩺</span>
            <p className="empty-state-text">
              No hay tratamientos registrados para {pet.name}
            </p>
          </div>
        ) : (
          <div className="treatments-list">
            {treatments.map((t) => (
              <OwnerTreatmentCard key={t.id} treatment={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
