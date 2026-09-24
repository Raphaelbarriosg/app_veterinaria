'use client';

import { use, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePetById } from '@/hooks/use-pets';
import {
  useTreatmentsByPet,
  useMedicationLogs,
  useControlVisits,
  usePostOpProtocol,
  useDischargeSheet,
} from '@/hooks/use-treatments';
import { useDailyLogs } from '@/hooks/use-daily-logs';
import {
  translateSpecies,
  formatDateString,
  translateProcedureType,
  translateControlVisitType,
  translateControlVisitStatus,
} from '@/lib/utils';
import { api, ApiError } from '@/lib/api-client';
import type { DailyLog, Treatment, MedicationLog, ControlVisit } from '@/lib/utils';

import {
  Edit3,
  Trash2,
  ClipboardList,
  Upload,
  Camera,
  CheckCircle2,
  X,
  ArrowLeft,
  Pill,
  AlertTriangle,
  Stethoscope,
  Scale,
  ShieldAlert,
  PawPrint,
  Check,
} from 'lucide-react';
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
// Pet Form Schema & Edit Modal
// ============================================
const petSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  species: z.enum(['DOG', 'CAT', 'BIRD', 'RODENT', 'REPTILE', 'OTHER']),
  breed: z.string().optional(),
  weight: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().min(0, 'El peso no puede ser negativo').optional(),
  ),
  microchip: z.string().optional(),
});

type PetForm = z.infer<typeof petSchema>;

function EditPetModal({
  pet,
  onSuccess,
  onClose,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pet: any;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<PetForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(petSchema) as any,
    defaultValues: {
      name: pet.name,
      species: pet.species as any,
      breed: pet.breed || '',
      weight: pet.weight || undefined,
      microchip: pet.microchip || '',
    },
  });

  const onSubmit = async (data: PetForm) => {
    try {
      await api.patch(`/pets/${pet.id}`, data);
      setToast({ message: 'Mascota actualizada correctamente', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al actualizar la mascota';
      setToast({ message: msg, type: 'error' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 className="w-5 h-5 text-teal-400" /> Editar Mascota
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="form-field">
            <label className="form-label" htmlFor="pet-name">Nombre *</label>
            <input
              id="pet-name"
              type="text"
              placeholder="Ej: Max"
              className="form-input"
              {...register('name')}
            />
            {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name.message}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="pet-species">Especie *</label>
            <select
              id="pet-species"
              className="form-input"
              {...register('species')}
            >
              <option value="DOG">Perro</option>
              <option value="CAT">Gato</option>
              <option value="BIRD">Ave</option>
              <option value="RODENT">Roedor</option>
              <option value="REPTILE">Reptil</option>
              <option value="OTHER">Otro</option>
            </select>
            {errors.species && <span className="text-red-500 text-sm mt-1">{errors.species.message}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="pet-breed">Raza — opcional</label>
            <input
              id="pet-breed"
              type="text"
              placeholder="Ej: Golden Retriever"
              className="form-input"
              {...register('breed')}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="pet-weight">Peso (kg) — opcional</label>
            <input
              id="pet-weight"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 15.5"
              className="form-input"
              {...register('weight')}
            />
            {errors.weight && <span className="text-red-500 text-sm mt-1">{errors.weight.message}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="pet-microchip">Microchip — opcional</label>
            <input
              id="pet-microchip"
              type="text"
              placeholder="Ej: 900215000..."
              className="form-input"
              {...register('microchip')}
            />
          </div>

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
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  editingLog,
  onSuccess,
  onClose,
}: {
  treatmentId: string;
  editingLog?: DailyLog;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [appetite, setAppetite] = useState(editingLog ? editingLog.appetiteLevel : 5);
  const [energy, setEnergy] = useState(editingLog ? editingLog.energyLevel : 5);
  const [pain, setPain] = useState(editingLog ? editingLog.painLevel ?? 0 : 0);
  const [imageUrl, setImageUrl] = useState<string | null>(editingLog ? editingLog.imageUrl ?? null : null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<DailyLogForm>({
    resolver: zodResolver(dailyLogSchema) as any,
    defaultValues: {
      medicineTaken: editingLog ? editingLog.medicineTaken ?? false : false,
      appetiteLevel: editingLog ? editingLog.appetiteLevel : 5,
      energyLevel: editingLog ? editingLog.energyLevel : 5,
      painLevel: editingLog ? editingLog.painLevel ?? 0 : 0,
      temperature: editingLog ? editingLog.temperature ?? undefined : undefined,
      alarmSigns: editingLog ? editingLog.alarmSigns ?? '' : '',
      observations: editingLog ? editingLog.observations ?? '' : '',
    },
  });

  const onSubmit = async (data: DailyLogForm) => {
    try {
      if (editingLog) {
        // Mode: Edit (PATCH)
        await api.patch(`/daily-logs/${editingLog.id}`, {
          ...data,
          treatmentId,
          appetiteLevel: appetite,
          energyLevel: energy,
          painLevel: pain,
          imageUrl: imageUrl ?? undefined,
        });
        setToast({ message: '✅ Registro actualizado correctamente', type: 'success' });
      } else {
        // Mode: Create (POST)
        await api.post('/daily-logs', {
          ...data,
          treatmentId,
          appetiteLevel: appetite,
          energyLevel: energy,
          painLevel: pain,
          imageUrl: imageUrl ?? undefined,
        });
        setToast({ message: '✅ Registro guardado correctamente', type: 'success' });
      }
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al guardar el registro';
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
          <h3 className="modal-title">{editingLog ? '📝 Editar Daily Log' : '📋 Registrar Daily Log'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          {/* Medicine taken */}
          <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <input
              type="checkbox"
              id="medicineTaken"
              {...register('medicineTaken')}
              className="checkbox-input"
            />
            <label htmlFor="medicineTaken" className="checkbox-label" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
              💊 El animal tomó su medicamento (general)
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
              {isSubmitting ? <><Spinner size="sm" /> Guardando...</> : 'Guardar log'}
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
// ============================================
// Record Medication Modal (for owner to check off doses)
// ============================================
function RecordMedicationModal({
  log,
  onSuccess,
  onClose,
}: {
  log: MedicationLog;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<'GIVEN' | 'SKIPPED'>('GIVEN');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'SKIPPED' && !reason.trim()) {
      setToast({ message: 'Debe ingresar el motivo de omisión', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/medication-logs', {
        treatmentId: log.treatmentId,
        ruleId: log.ruleId,
        scheduledAt: log.scheduledAt,
        givenAt: status === 'GIVEN' ? new Date().toISOString() : undefined,
        status,
        skippedReason: status === 'SKIPPED' ? reason : undefined,
        photoUrl: photoUrl ?? undefined,
        notes,
      });
      setToast({ message: 'Toma registrada correctamente', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al registrar toma';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Registrar Toma de Medicamento</h3>
          <button className="modal-close" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Medicamento: <strong>{log.rule?.medicineName}</strong>
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Dosis: {log.rule?.dosage} · Horario: {formatDateString(log.scheduledAt)}
            </p>
          </div>

          <div className="form-field">
            <label className="form-label">Estado de la Toma</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="radio" name="med-status" checked={status === 'GIVEN'} onChange={() => setStatus('GIVEN')} />
                Tomado con éxito
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="radio" name="med-status" checked={status === 'SKIPPED'} onChange={() => setStatus('SKIPPED')} />
                Dosis omitida
              </label>
            </div>
          </div>

          {status === 'SKIPPED' ? (
            <div className="form-field">
              <label className="form-label" htmlFor="skipped-reason">Motivo de la Omisión *</label>
              <select
                id="skipped-reason"
                className="form-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">-- Seleccione un motivo --</option>
                <option value="Rechazo / Escupió la pastilla">Rechazo / Escupió la pastilla</option>
                <option value="Vómitos inmediatos">Vómitos inmediatos</option>
                <option value="Dificultad de administración">Dificultad de administración</option>
                <option value="Olvido / Fuera de horario">Olvido / Fuera de horario</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          ) : (
            <div className="form-field">
              <label className="form-label" htmlFor="med-notes">Notas / Observaciones (Opcional)</label>
              <input
                id="med-notes"
                type="text"
                placeholder="Ej. Tomado con paté de carne"
                className="form-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}

          {/* Carga de foto si la regla lo requiere */}
          {log.rule?.requirePhoto && status === 'GIVEN' && (
            <div style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                📸 Se requiere foto de la toma
              </span>
              <ImageUploadField onUrlReady={setPhotoUrl} />
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || (log.rule?.requirePhoto && status === 'GIVEN' && !photoUrl)}>
              Confirmar Registro
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Treatment section for owner
// ============================================
function OwnerTreatmentCard({ treatment }: { treatment: Treatment }) {
  const [activePanelTab, setActivePanelTab] = useState<'EVOLUCION' | 'MEDICACION' | 'PROTOCOLO' | 'CONTROLES' | 'ALTA'>('EVOLUCION');
  const [showLogForm, setShowLogForm] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | undefined>(undefined);
  const [recordingMedLog, setRecordingMedLog] = useState<MedicationLog | null>(null);
  const [page, setPage] = useState(1);
  
  const { logs, meta, isLoading, refresh } = useDailyLogs(treatment.id, page);

  // Cargar hooks clínicos
  const { logsData, isLoading: medLoading, refreshMedLogs } = useMedicationLogs(treatment.id);
  const { visits } = useControlVisits(treatment.id);
  const { protocol } = usePostOpProtocol(treatment.id);
  const { dischargeSheet } = useDischargeSheet(treatment.id);

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
          editingLog={editingLog}
          onSuccess={() => {
            refresh();
            setEditingLog(undefined);
          }}
          onClose={() => {
            setShowLogForm(false);
            setEditingLog(undefined);
          }}
        />
      )}

      {recordingMedLog && (
        <RecordMedicationModal
          log={recordingMedLog}
          onSuccess={() => refreshMedLogs()}
          onClose={() => setRecordingMedLog(null)}
        />
      )}

      <div className="treatment-panel glass-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div className="treatment-panel-header" style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="treatment-panel-diagnosis" style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#1e293b' }}>{treatment.diagnosis}</h3>
              <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', color: '#475569' }}>
                {translateProcedureType(treatment.procedureType)}
              </span>
            </div>
            <p className="treatment-panel-date" style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem', marginTop: '2px' }}>
              Desde: {formatDateString(treatment.startDate)}
            </p>
          </div>
          <div className="treatment-panel-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`status-badge ${sc.cls}`}>{sc.label}</span>
            {treatment.status === 'ACTIVE' && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingLog(undefined);
                  setShowLogForm(true);
                }}
                id={`add-log-${treatment.id}`}
              >
                + Registrar daily log
              </Button>
            )}
          </div>
        </div>

        {/* Tabs selector */}
        <div style={{ display: 'flex', background: '#fafbfc', borderBottom: '1px solid #f1f5f9', padding: '0 1rem' }}>
          {(['EVOLUCION', 'MEDICACION', 'PROTOCOLO', 'CONTROLES', 'ALTA'] as const).map((t) => {
            const active = activePanelTab === t;
            const labels = {
              EVOLUCION: 'Evolución Diaria',
              MEDICACION: 'Tomas de Medicación',
              PROTOCOLO: 'Cuidados Post-Op',
              CONTROLES: 'Próximos Controles',
              ALTA: 'Alta e Indicaciones',
            };
            return (
              <button
                key={t}
                onClick={() => setActivePanelTab(t)}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: active ? '3px solid var(--color-accent)' : '3px solid transparent',
                  color: active ? 'var(--color-accent)' : '#64748b',
                  fontWeight: active ? 'bold' : 'normal',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '1.25rem' }}>

          {/* TAB: EVOLUCION */}
          {activePanelTab === 'EVOLUCION' && (
            <div className="daily-logs-section">
              <div className="daily-logs-header">
                <h4 className="daily-logs-title">📋 Historial de reportes diarios</h4>
                <span className="daily-logs-count">{meta.total} registros</span>
              </div>

              {isLoading ? (
                <div className="flex justify-center p-4"><Spinner /></div>
              ) : logs.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <p className="empty-state-text" style={{ fontSize: '0.85rem' }}>Aún no hay logs registrados en este tratamiento. ¡Registra el primero!</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {logs.map((log: DailyLog) => {
                      // Verificar si fue creado hace menos de 24 horas para mostrar botón editar
                      const canEdit = (Date.now() - new Date(log.registeredAt).getTime()) < 24 * 60 * 60 * 1000;
                      return (
                        <div key={log.id} className="log-card" style={{ borderLeft: log.alarmSigns ? '4px solid var(--color-status-red)' : '4px solid var(--color-status-green)' }}>
                          <div className="log-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="log-date">{formatDateString(log.registeredAt)}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {canEdit && treatment.status === 'ACTIVE' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingLog(log);
                                    setShowLogForm(true);
                                  }}
                                  style={{ padding: '2px 8px', fontSize: '0.75rem', height: '24px' }}
                                >
                                  Editar (24h)
                                </Button>
                              )}
                              <span className={`log-medicine ${log.medicineTaken ? 'medicine-yes' : 'medicine-no'}`}>
                                {log.medicineTaken ? '💊 Tomó' : '❌ No tomó'}
                              </span>
                            </div>
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
                          {log.alarmSigns && <div className="log-alarm" style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#b91c1c', marginTop: '6px', fontWeight: 'bold' }}>⚠️ {log.alarmSigns}</div>}
                          {log.imageUrl && <LogPhoto url={log.imageUrl} />}
                        </div>
                      );
                    })}
                  </div>
                  {meta.totalPages > 1 && (
                    <div className="pagination">
                      <button className="pagination-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Anterior</button>
                      <span className="pagination-info">{page} / {meta.totalPages}</span>
                      <button className="pagination-btn" onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>Siguiente →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB: MEDICACION */}
          {activePanelTab === 'MEDICACION' && (
            <div>
              {medLoading ? (
                <div className="flex justify-center p-4"><Spinner /></div>
              ) : !logsData ? (
                <p>Sin datos de medicinas.</p>
              ) : (
                <div>
                  <h4 style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.5rem' }}>Próximas Tomas Programadas</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                    {logsData.logs.filter(l => l.status === 'PENDING').length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: '#64748b' }}>No tienes tomas pendientes programadas para hoy.</p>
                    ) : (
                      logsData.logs.filter(l => l.status === 'PENDING').map(log => (
                        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div>
                            <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{log.rule?.medicineName}</span>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0' }}>Dosis: {log.rule?.dosage} · Horario: {formatDateString(log.scheduledAt)}</p>
                          </div>
                          {treatment.status === 'ACTIVE' && (
                            <Button size="sm" onClick={() => setRecordingMedLog(log)}>Registrar Toma</Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <h4 style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.5rem' }}>Historial de Medicamentos Dadas</h4>
                  {logsData.logs.filter(l => l.status !== 'PENDING').length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Aún no has registrado ninguna dosis.</p>
                  ) : (
                    <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '8px 12px' }}>Medicina</th>
                            <th style={{ padding: '8px 12px' }}>Horario</th>
                            <th style={{ padding: '8px 12px' }}>Estado</th>
                            <th style={{ padding: '8px 12px' }}>Detalles / Notas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logsData.logs.filter(l => l.status !== 'PENDING').map(log => {
                            const statusLabels = {
                              PENDING: { text: 'Pendiente', cls: 'bg-slate-100 text-slate-700' },
                              GIVEN: { text: 'Administrada', cls: 'bg-emerald-100 text-emerald-800' },
                              LATE: { text: 'Tardía', cls: 'bg-amber-100 text-amber-800' },
                              SKIPPED: { text: 'Omitida', cls: 'bg-rose-100 text-rose-800' },
                            };
                            const label = statusLabels[log.status] || statusLabels.PENDING;
                            return (
                              <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>{log.rule?.medicineName}</td>
                                <td style={{ padding: '8px 12px' }}>{formatDateString(log.givenAt || log.scheduledAt)}</td>
                                <td style={{ padding: '8px 12px' }}>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${label.cls}`}>
                                    {label.text}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 12px', color: '#64748b' }}>
                                  {log.status === 'SKIPPED' ? `Motivo: ${log.skippedReason || '—'}` : log.notes || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: PROTOCOLO */}
          {activePanelTab === 'PROTOCOLO' && (
            <div>
              {!protocol ? (
                <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>Tu clínica aún no ha definido el protocolo de cuidados post-operatorio.</p>
              ) : (
                <div>
                  <h4 style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#b91c1c', marginBottom: '0.5rem' }}>🚨 SIGNOS DE ALARMA DE EMERGENCIA</h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>Si tu mascota presenta alguno de estos síntomas, sigue las instrucciones o contacta inmediatamente a urgencias.</p>
                  
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px', borderRadius: '10px', marginBottom: '1.25rem' }}>
                    {Array.isArray(protocol.alarmSigns) && protocol.alarmSigns.map((s, idx) => (
                      <div key={idx} style={{ padding: '8px 0', borderBottom: idx < protocol.alarmSigns.length - 1 ? '1px solid #fee2e2' : 'none', fontSize: '0.8rem' }}>
                        <strong style={{ color: '#b91c1c' }}>🚨 {s.sign} ({s.severity})</strong>
                        <p style={{ margin: '2px 0 0 16px', color: '#7f1d1d' }}>{s.description}</p>
                      </div>
                    ))}
                  </div>

                  <h4 style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.5rem' }}>Restricciones de Actividad</h4>
                  <ul style={{ fontSize: '0.8rem', margin: '4px 0 1rem 16px', padding: 0 }}>
                    {Array.isArray(protocol.restrictions) && protocol.restrictions.map((r, i) => <li key={i} style={{ marginBottom: '2px' }}>{r}</li>)}
                  </ul>

                  <h4 style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.5rem' }}>Cuidados Especiales</h4>
                  <ul style={{ fontSize: '0.8rem', margin: '4px 0 1rem 16px', padding: 0 }}>
                    {Array.isArray(protocol.specialCare) && protocol.specialCare.map((c, i) => <li key={i} style={{ marginBottom: '2px' }}>{c}</li>)}
                  </ul>

                  {protocol.emergencyCall && (
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b' }}>
                      📞 Teléfono de Urgencias: <span style={{ color: 'var(--color-accent)' }}>{protocol.emergencyCall}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: CONTROLES */}
          {activePanelTab === 'CONTROLES' && (
            <div>
              <h4 style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.5rem' }}>Próximas Citas Médicas</h4>
              {visits.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>No tienes citas de control agendadas.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {visits.map(v => (
                    <div key={v.id} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{translateControlVisitType(v.type)}</span>
                          <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: v.status === 'COMPLETED' ? '#d1fae5' : '#f1f5f9', color: v.status === 'COMPLETED' ? '#065f46' : '#475569' }}>
                            {translateControlVisitStatus(v.status)}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0' }}>Fecha: {formatDateString(v.scheduledAt)}</p>
                        {v.notes && <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>Indicaciones: {v.notes}</p>}
                        {v.clinicalFindings && (
                          <div style={{ marginTop: '6px', background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                            <strong>Reporte del Veterinario:</strong> {v.clinicalFindings}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: ALTA */}
          {activePanelTab === 'ALTA' && (
            <div>
              {!dischargeSheet ? (
                <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>Su mascota aún está en proceso de recuperación. El veterinario generará el alta clínica al finalizar.</p>
              ) : (
                <div>
                  <h4 style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#065f46', marginBottom: '0.5rem' }}>Indicaciones de Alta Médica</h4>
                  <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.85rem', marginBottom: '10px' }}>
                      <strong>Resumen de Alta:</strong>
                      <p style={{ color: '#15803d', margin: '2px 0' }}>{dischargeSheet.summary}</p>
                    </div>
                    {dischargeSheet.medications && Array.isArray(dischargeSheet.medications) && (
                      <div style={{ fontSize: '0.85rem', marginBottom: '10px' }}>
                        <strong>Indicación de Medicación para Casa:</strong>
                        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: '8px', overflow: 'hidden', marginTop: '4px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ background: '#e6fbf1', borderBottom: '1px solid #d1fae5' }}>
                                <th style={{ padding: '6px 10px' }}>Medicina</th>
                                <th style={{ padding: '6px 10px' }}>Dosis</th>
                                <th style={{ padding: '6px 10px' }}>Frecuencia</th>
                                <th style={{ padding: '6px 10px' }}>Duración</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dischargeSheet.medications.map((m: any, idx: number) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #e6fbf1' }}>
                                  <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>{m.name}</td>
                                  <td style={{ padding: '6px 10px' }}>{m.dosage}</td>
                                  <td style={{ padding: '6px 10px' }}>{m.schedule}</td>
                                  <td style={{ padding: '6px 10px' }}>{m.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.8rem' }}>
                      {dischargeSheet.restrictions && (
                        <div>
                          <strong>Restricciones:</strong>
                          <p style={{ margin: '2px 0', color: '#15803d' }}>{dischargeSheet.restrictions}</p>
                        </div>
                      )}
                      {dischargeSheet.feedingNotes && (
                        <div>
                          <strong>Alimentación:</strong>
                          <p style={{ margin: '2px 0', color: '#15803d' }}>{dischargeSheet.feedingNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
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
  const { pet, isLoading, isError, refreshPet } = usePetById(id);
  const { treatments, isLoading: treatmentsLoading } = useTreatmentsByPet(id);
  const [showEditModal, setShowEditModal] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar esta mascota? Esta acción no se puede deshacer.')) {
      try {
        await api.delete(`/pets/${id}`);
        router.push('/owner');
      } catch (err) {
        alert('Error al eliminar la mascota');
      }
    }
  };

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
      {showEditModal && pet && (
        <EditPetModal 
          pet={pet}
          onSuccess={refreshPet}
          onClose={() => setShowEditModal(false)}
        />
      )}
      <div className="breadcrumb">
        <Link href="/owner" className="breadcrumb-link">
          Mis mascotas
        </Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{pet.name}</span>
      </div>

      {/* Pet header */}
      <div className="pet-detail-header glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
            ✏️ Editar
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} style={{ color: 'var(--color-status-red)', borderColor: 'var(--color-status-red)' }}>
            🗑️ Eliminar
          </Button>
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
