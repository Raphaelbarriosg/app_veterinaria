'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Stethoscope,
  Pill,
  ClipboardList,
  Camera,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowLeft,
  PawPrint,
  Dog,
  Cat,
  Bird,
  User,
  Phone,
  Scale,
  Plus,
  Printer,
  FileText,
  MessageSquarePlus,
  Clock,
} from 'lucide-react';
import { usePetById } from '@/hooks/use-pets';
import { useDailyLogs } from '@/hooks/use-daily-logs';
import { translateSpecies, formatDateString } from '@/lib/utils';
import type { Treatment, DailyLog } from '@/lib/utils';
import { api, ApiError } from '@/lib/api-client';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';

// ============================================
// Treatment Schema
// ============================================
const treatmentRuleSchema = z.object({
  medicineName: z.string().min(1, 'Requerido'),
  dosage: z.string().min(1, 'Requerido'),
  frequencyHours: z.coerce.number().min(1, 'Mínimo 1'),
  requirePhoto: z.boolean().default(false),
});

const treatmentSchema = z.object({
  diagnosis: z.string().min(1, 'El diagnóstico es requerido'),
  startDate: z.string().min(1, 'Requerido'),
  endDate: z.string().optional().or(z.literal('')),
  rules: z.array(treatmentRuleSchema).optional(),
});

type TreatmentForm = z.infer<typeof treatmentSchema>;

function SpeciesIcon({ species, className = 'w-6 h-6 text-teal-600' }: { species: string; className?: string }) {
  switch (species) {
    case 'DOG':
      return <Dog className={className} />;
    case 'CAT':
      return <Cat className={className} />;
    case 'BIRD':
      return <Bird className={className} />;
    default:
      return <PawPrint className={className} />;
  }
}

// ============================================
// Add Vet Note Modal
// ============================================
function AddVetNoteModal({
  logId,
  initialNote,
  onSuccess,
  onClose,
}: {
  logId: string;
  initialNote?: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState(initialNote || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.patch(`/daily-logs/${logId}/vet-notes`, { vetNotes: note });
      setToast({ message: 'Nota médica guardada correctamente', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al guardar nota médica';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Stethoscope className="w-5 h-5 text-teal-600" /> Nota Clínica del Veterinario
          </h3>
          <button className="modal-close" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label className="form-label">Indicaciones o Comentarios Médicos *</label>
            <textarea
              rows={4}
              required
              placeholder="Ej: Evolución favorable. Mantener la dosis de analgesia por 48 horas más."
              className="form-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner size="sm" /> Guardando...</> : 'Guardar Nota'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Create Treatment Modal
// ============================================
function CreateTreatmentModal({
  petId,
  onSuccess,
  onClose,
}: {
  petId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<TreatmentForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(treatmentSchema) as any,
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      rules: [{ medicineName: '', dosage: '', frequencyHours: 8, requirePhoto: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rules',
  });

  const onSubmit = async (data: TreatmentForm) => {
    try {
      await api.post('/treatments', {
        ...data,
        petId,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      });
      setToast({ message: 'Tratamiento creado correctamente', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al crear el tratamiento';
      setToast({ message: msg, type: 'error' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Stethoscope className="w-5 h-5 text-teal-600" /> Nuevo Tratamiento Post-Operatorio
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="form-field">
            <label className="form-label" htmlFor="diagnosis">Diagnóstico / Procedimiento *</label>
            <textarea
              id="diagnosis"
              placeholder="Ej: Orquiectomía. Monitorear heridas post-quirúrgicas."
              className="form-textarea"
              rows={3}
              {...register('diagnosis')}
            />
            {errors.diagnosis && <span className="text-red-500 text-sm mt-1">{errors.diagnosis.message}</span>}
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-field">
              <label className="form-label" htmlFor="startDate">Fecha de inicio *</label>
              <input id="startDate" type="date" className="form-input" {...register('startDate')} />
              {errors.startDate && <span className="text-red-500 text-sm mt-1">{errors.startDate.message}</span>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="endDate">Fecha de fin — opcional</label>
              <input id="endDate" type="date" className="form-input" {...register('endDate')} />
            </div>
          </div>

          <div className="rules-section" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <div className="rules-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 className="rules-title" style={{ fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Pill className="w-4 h-4 text-teal-600" /> Reglas de medicación
              </h4>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ medicineName: '', dosage: '', frequencyHours: 8, requirePhoto: false })}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus className="w-3.5 h-3.5" /> Agregar regla
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="rule-item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  placeholder="Medicamento"
                  className="form-input"
                  {...register(`rules.${index}.medicineName` as const)}
                />
                <input
                  placeholder="Dosis (ej: 1 pastilla)"
                  className="form-input"
                  {...register(`rules.${index}.dosage` as const)}
                />
                <select className="form-input" {...register(`rules.${index}.frequencyHours` as const)}>
                  <option value={4}>C/4h</option>
                  <option value={6}>C/6h</option>
                  <option value={8}>C/8h</option>
                  <option value={12}>C/12h</option>
                  <option value={24}>C/24h</option>
                </select>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" {...register(`rules.${index}.requirePhoto` as const)} />
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                </label>
                {fields.length > 1 && (
                  <Button type="button" size="sm" variant="outline" onClick={() => remove(index)} style={{ color: 'var(--color-status-red)', padding: '4px 8px' }}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner size="sm" /> Creando...</> : 'Crear Tratamiento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Daily Log Card Component (con opción de notas VET)
// ============================================
function DailyLogCard({ log, onAddNote }: { log: DailyLog; onAddNote: (log: DailyLog) => void }) {
  const painColor =
    (log.painLevel ?? 0) >= 7 ? 'text-red-500 font-bold' : (log.painLevel ?? 0) >= 4 ? 'text-amber-500' : 'text-emerald-600';

  return (
    <div className="log-card" style={{ borderLeft: log.alarmSigns ? '4px solid var(--color-status-red)' : '4px solid var(--color-status-green)' }}>
      <div className="log-card-header">
        <span className="log-date">{formatDateString(log.registeredAt)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`log-medicine ${log.medicineTaken ? 'medicine-yes' : 'medicine-no'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {log.medicineTaken ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tomó medicamento
              </>
            ) : (
              <>
                <X className="w-3.5 h-3.5 text-rose-500" /> No tomó
              </>
            )}
          </span>
          <Button size="sm" variant="outline" onClick={() => onAddNote(log)} style={{ padding: '2px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <MessageSquarePlus className="w-3 h-3 text-teal-600" /> Nota VET
          </Button>
        </div>
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
        <div className="log-alarm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle className="w-4 h-4 text-rose-500" /> <strong>Alarma:</strong> {log.alarmSigns}
        </div>
      )}
      {log.observations && (
        <p className="log-observations">{log.observations}</p>
      )}
      {log.vetNotes && (
        <div className="log-vet-notes" style={{ background: '#f0fdf4', borderLeft: '3px solid #10b981', padding: '8px 12px', borderRadius: '4px', marginTop: '8px' }}>
          <span className="log-vet-notes-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#047857', fontWeight: 'bold', fontSize: '0.8rem' }}>
            <Stethoscope className="w-3.5 h-3.5" /> Nota del veterinario:
          </span>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.825rem', color: '#15803d' }}>{log.vetNotes}</p>
        </div>
      )}
      {log.imageUrl && (
        <a href={log.imageUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '0.5rem', textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={log.imageUrl} alt="Foto del log" className="log-image" style={{ borderRadius: '8px', maxHeight: '200px', width: '100%', objectFit: 'cover' }} />
        </a>
      )}
    </div>
  );
}

// ============================================
// Treatment Panel Component
// ============================================
// ============================================
// MODALS AUXILIARES CLÍNICOS
// ============================================

function CreateProtocolModal({
  treatmentId,
  procedureType,
  onSuccess,
  onClose,
}: {
  treatmentId: string;
  procedureType: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [signs, setSigns] = useState<{ sign: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'; description: string }[]>([
    { sign: 'Sangrado en la herida', severity: 'HIGH', description: 'Goteo continuo de sangre en la sutura' },
    { sign: 'Fiebre (>39.5°C)', severity: 'CRITICAL', description: 'Temperatura corporal elevada' },
  ]);
  const [restrictions, setRestrictions] = useState('Reposo estricto. Evitar correr y saltar.\nCollar isabelino puesto las 24 horas.');
  const [specialCare, setSpecialCare] = useState('Limpieza diaria de la herida con suero fisiológico.\nOfrecer agua y comida blanda.');
  const [emergencyCall, setEmergencyCall] = useState('+56 2 2345 6789 (Urgencias)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`/post-op-protocols/treatment/${treatmentId}`, {
        procedureType,
        alarmSigns: signs.filter(s => s.sign.trim()),
        restrictions: restrictions.split('\n').filter(r => r.trim()),
        specialCare: specialCare.split('\n').filter(c => c.trim()),
        emergencyCall,
      });
      setToast({ message: 'Protocolo de cuidados definido correctamente', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al guardar protocolo';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Definir Protocolo de Cuidados</h3>
          <button className="modal-close" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label className="form-label">Signos de Alarma a Vigilar</label>
            {signs.map((s, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr auto', gap: '8px', marginBottom: '6px' }}>
                <input
                  className="form-input"
                  placeholder="Signo"
                  value={s.sign}
                  onChange={(e) => {
                    const next = [...signs];
                    next[idx].sign = e.target.value;
                    setSigns(next);
                  }}
                />
                <select
                  className="form-input"
                  value={s.severity}
                  onChange={(e) => {
                    const next = [...signs];
                    next[idx].severity = e.target.value as any;
                    setSigns(next);
                  }}
                >
                  <option value="MEDIUM">Medio</option>
                  <option value="HIGH">Alto</option>
                  <option value="CRITICAL">Crítico</option>
                </select>
                <input
                  className="form-input"
                  placeholder="Instrucción de acción"
                  value={s.description}
                  onChange={(e) => {
                    const next = [...signs];
                    next[idx].description = e.target.value;
                    setSigns(next);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  style={{ color: 'red' }}
                  onClick={() => setSigns(signs.filter((_, i) => i !== idx))}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSigns([...signs, { sign: '', severity: 'HIGH', description: '' }])}
            >
              + Agregar Signo
            </Button>
          </div>

          <div className="form-field">
            <label className="form-label">Restricciones (Una por línea)</label>
            <textarea
              rows={3}
              className="form-textarea"
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Cuidados Especiales (Uno por línea)</label>
            <textarea
              rows={3}
              className="form-textarea"
              value={specialCare}
              onChange={(e) => setSpecialCare(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Teléfono de Emergencias</label>
            <input
              type="text"
              className="form-input"
              value={emergencyCall}
              onChange={(e) => setEmergencyCall(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>Guardar Protocolo</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScheduleControlModal({
  treatmentId,
  onSuccess,
  onClose,
}: {
  treatmentId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [type, setType] = useState('HOURS_48');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) {
      setToast({ message: 'Seleccione fecha y hora', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/control-visits/treatment/${treatmentId}`, {
        type,
        scheduledAt: new Date(scheduledAt).toISOString(),
        notes,
      });
      setToast({ message: 'Cita programada y notificada por email', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al agendar cita';
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
          <h3 className="modal-title">Programar Cita de Control</h3>
          <button className="modal-close" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label className="form-label">Tipo de Control</label>
            <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="HOURS_48">Control 48 Horas</option>
              <option value="STITCH_REMOVAL">Retiro de Puntos</option>
              <option value="BANDAGE_CHANGE">Cambio de Vendaje</option>
              <option value="ULTRASOUND">Ecografía de Control</option>
              <option value="BLOOD_TEST">Análisis de Sangre</option>
              <option value="GENERAL_CONTROL">Control General</option>
              <option value="FINAL_DISCHARGE">Alta Definitiva</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Fecha y Hora</label>
            <input
              type="datetime-local"
              className="form-input"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Notas e Indicaciones</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Ej. Venir en ayunas si requiere ecografía"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>Agendar Control</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompleteControlModal({
  visitId,
  onSuccess,
  onClose,
}: {
  visitId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [findings, setFindings] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findings.trim()) {
      setToast({ message: 'Ingrese los hallazgos clínicos', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.patch(`/control-visits/${visitId}/complete`, {
        clinicalFindings: findings,
        notes,
      });
      setToast({ message: 'Control completado correctamente', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al guardar';
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
          <h3 className="modal-title">Completar Consulta de Control</h3>
          <button className="modal-close" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label className="form-label">Hallazgos Clínicos Quirúrgicos *</label>
            <textarea
              className="form-textarea"
              rows={4}
              required
              placeholder="Ej. Sutura limpia, sin secreciones. Cicatrización de 90%. Apoya miembro."
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Indicaciones adicionales</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Ej. Continuar collar isabelino 3 días más."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>Guardar y Completar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateDischargeModal({
  treatmentId,
  onSuccess,
  onClose,
}: {
  treatmentId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [summary, setSummary] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [returnSigns, setReturnSigns] = useState('');
  const [restrictions, setRestrictions] = useState('');
  const [feedingNotes, setFeedingNotes] = useState('');
  const [medications, setMedications] = useState<{ name: string; dosage: string; schedule: string; duration: string }[]>([
    { name: '', dosage: '', schedule: '', duration: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      setToast({ message: 'Ingrese el resumen clínico', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/discharge-sheets/treatment/${treatmentId}`, {
        summary,
        nextSteps,
        returnSigns,
        restrictions,
        feedingNotes,
        medications: medications.filter(m => m.name.trim()),
      });
      // Finalizar también el tratamiento al dar el alta médica
      await api.patch(`/treatments/${treatmentId}`, { status: 'COMPLETED' });
      setToast({ message: 'Hoja de alta emitida y paciente dado de alta', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al guardar alta';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Generar Alta Médica del Paciente</h3>
          <button className="modal-close" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label className="form-label">Resumen del Procedimiento Quirúrgico / Evolución *</label>
            <textarea
              className="form-textarea"
              rows={3}
              required
              placeholder="Ej. Paciente operado exitosamente. Retiro de puntos sin inconvenientes."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Medicamentos e Indicaciones Domiciliarias</label>
            {medications.map((m, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: '6px', marginBottom: '6px' }}>
                <input
                  className="form-input"
                  placeholder="Medicamento"
                  value={m.name}
                  onChange={(e) => {
                    const next = [...medications];
                    next[idx].name = e.target.value;
                    setMedications(next);
                  }}
                />
                <input
                  className="form-input"
                  placeholder="Dosis"
                  value={m.dosage}
                  onChange={(e) => {
                    const next = [...medications];
                    next[idx].dosage = e.target.value;
                    setMedications(next);
                  }}
                />
                <input
                  className="form-input"
                  placeholder="Horarios"
                  value={m.schedule}
                  onChange={(e) => {
                    const next = [...medications];
                    next[idx].schedule = e.target.value;
                    setMedications(next);
                  }}
                />
                <input
                  className="form-input"
                  placeholder="Días"
                  value={m.duration}
                  onChange={(e) => {
                    const next = [...medications];
                    next[idx].duration = e.target.value;
                    setMedications(next);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  style={{ color: 'red' }}
                  onClick={() => setMedications(medications.filter((_, i) => i !== idx))}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMedications([...medications, { name: '', dosage: '', schedule: '', duration: '' }])}
            >
              + Agregar Medicina
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="form-field">
              <label className="form-label">Cuidados y Restricciones</label>
              <textarea
                rows={2}
                className="form-textarea"
                placeholder="Ej. Reposo por 5 días más"
                value={restrictions}
                onChange={(e) => setRestrictions(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Alimentación</label>
              <textarea
                rows={2}
                className="form-textarea"
                placeholder="Ej. Volver a dieta regular"
                value={feedingNotes}
                onChange={(e) => setFeedingNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>Emitir Alta Médica</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Treatment Panel Component Refactorizado (Con Tabs)
// ============================================
import {
  useMedicationLogs,
  useControlVisits,
  usePostOpProtocol,
  useDischargeSheet,
} from '@/hooks/use-treatments';
import { translateProcedureType, translateControlVisitType, translateControlVisitStatus } from '@/lib/utils';

function TreatmentPanel({
  treatment,
  onAddNote,
}: {
  treatment: Treatment;
  onAddNote: (log: DailyLog) => void;
}) {
  const [activePanelTab, setActivePanelTab] = useState<'EVOLUCION' | 'MEDICACION' | 'CONTROLES' | 'PROTOCOLO' | 'ALTA'>('EVOLUCION');
  const [page, setPage] = useState(1);
  const { logs, meta, isLoading: logsLoading, refresh: refreshLogs } = useDailyLogs(treatment.id, page);

  // Cargar hooks de datos clínicos
  const { logsData, isLoading: medLoading, refreshMedLogs } = useMedicationLogs(treatment.id);
  const { visits, refreshVisits } = useControlVisits(treatment.id);
  const { protocol, refreshProtocol } = usePostOpProtocol(treatment.id);
  const { dischargeSheet, refreshDischargeSheet } = useDischargeSheet(treatment.id);

  // Estados para modals
  const [showScheduleControl, setShowScheduleControl] = useState(false);
  const [completingVisitId, setCompletingVisitId] = useState<string | null>(null);
  const [showCreateProtocol, setShowCreateProtocol] = useState(false);
  const [showCreateDischarge, setShowCreateDischarge] = useState(false);

  const statusConfig: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: 'Activo', cls: 'status-active' },
    COMPLETED: { label: 'Completado', cls: 'status-inactive' },
    CANCELLED: { label: 'Cancelado', cls: 'status-error' },
    PAUSED: { label: 'Pausado', cls: 'status-warning' },
  };
  const sc = statusConfig[treatment.status] ?? statusConfig.ACTIVE;

  const handleCancelVisit = async (visitId: string) => {
    if (confirm('¿Está seguro de cancelar esta cita de control?')) {
      try {
        await api.delete(`/control-visits/${visitId}`);
        refreshVisits();
      } catch (err) {
        alert('Error al cancelar la cita');
      }
    }
  };

  return (
    <div className="treatment-panel glass-card animate-fade-in" style={{ marginBottom: '1.5rem', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden' }}>
      {/* Modales locales */}
      {showScheduleControl && (
        <ScheduleControlModal
          treatmentId={treatment.id}
          onSuccess={() => refreshVisits()}
          onClose={() => setShowScheduleControl(false)}
        />
      )}

      {completingVisitId && (
        <CompleteControlModal
          visitId={completingVisitId}
          onSuccess={() => refreshVisits()}
          onClose={() => setCompletingVisitId(null)}
        />
      )}

      {showCreateProtocol && (
        <CreateProtocolModal
          treatmentId={treatment.id}
          procedureType={treatment.procedureType}
          onSuccess={() => refreshProtocol()}
          onClose={() => setShowCreateProtocol(false)}
        />
      )}

      {showCreateDischarge && (
        <CreateDischargeModal
          treatmentId={treatment.id}
          onSuccess={() => {
            refreshDischargeSheet();
            window.location.reload(); // Recargar para actualizar estado ACTIVE->COMPLETED
          }}
          onClose={() => setShowCreateDischarge(false)}
        />
      )}

      {/* Header */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
        <div className="treatment-panel-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="treatment-panel-diagnosis" style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#1e293b' }}>{treatment.diagnosis}</h3>
              <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', color: '#475569' }}>
                {translateProcedureType(treatment.procedureType)}
              </span>
            </div>
            <p className="treatment-panel-date" style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem', marginTop: '2px' }}>
              Inicio: {formatDateString(treatment.startDate)}
              {treatment.endDate && ` → ${formatDateString(treatment.endDate)}`}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`status-badge ${sc.cls}`}>{sc.label}</span>
            {treatment.status === 'ACTIVE' && (
              <Button
                size="sm"
                onClick={() => setShowCreateDischarge(true)}
                style={{ background: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Alta Médica
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Panel Tabs Menu */}
      <div style={{ display: 'flex', background: '#fafbfc', borderBottom: '1px solid #f1f5f9', padding: '0 1rem' }}>
        {(['EVOLUCION', 'MEDICACION', 'CONTROLES', 'PROTOCOLO', 'ALTA'] as const).map((t) => {
          const active = activePanelTab === t;
          const labels = {
            EVOLUCION: 'Evolución Diaria',
            MEDICACION: 'Medicamentos y Dosis',
            CONTROLES: 'Citas de Control',
            PROTOCOLO: 'Protocolo Post-Op',
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

      {/* Tab Contents */}
      <div style={{ padding: '1.25rem' }}>
        
        {/* PANEL: EVOLUCION */}
        {activePanelTab === 'EVOLUCION' && (
          <div className="daily-logs-section">
            <div className="daily-logs-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 className="daily-logs-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                <ClipboardList className="w-4 h-4 text-teal-600" /> Línea de Tiempo de Evolución
              </h4>
              <span className="daily-logs-count" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{meta.total} registros</span>
            </div>

            {logsLoading ? (
              <div className="flex justify-center p-4"><Spinner /></div>
            ) : logs.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <ClipboardList className="w-8 h-8 text-slate-400 mb-2" />
                <p className="empty-state-text" style={{ fontSize: '0.85rem' }}>Sin reportes de evolución registrados aún en este tratamiento</p>
              </div>
            ) : (
              <>
                <div className="logs-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {logs.map((log) => <DailyLogCard key={log.id} log={log} onAddNote={onAddNote} />)}
                </div>
                {meta.totalPages > 1 && (
                  <div className="pagination" style={{ marginTop: '1rem' }}>
                    <button className="pagination-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Anterior</button>
                    <span className="pagination-info">{page} / {meta.totalPages}</span>
                    <button className="pagination-btn" onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>Siguiente →</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* PANEL: MEDICACION */}
        {activePanelTab === 'MEDICACION' && (
          <div>
            {medLoading ? (
              <div className="flex justify-center p-4"><Spinner /></div>
            ) : !logsData ? (
              <p>Sin datos de medicación.</p>
            ) : (
              <div>
                <h4 style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.75rem' }}>Cumplimiento por Medicina</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
                  {logsData.compliance.map(c => (
                    <div key={c.ruleId} style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        <span>{c.medicineName}</span>
                        <span className={c.complianceRate !== null && c.complianceRate >= 80 ? 'text-emerald-600' : 'text-amber-500'}>
                          {c.complianceRate !== null ? `${c.complianceRate}%` : 'N/A'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 6px 0' }}>Dosis: {c.dosage} · Cada {c.frequencyHours}h</p>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
                        <span>Dadas: <strong>{c.given}</strong></span>
                        <span>Tardías: <strong>{c.late}</strong></span>
                        <span>Omitidas: <strong>{c.skipped}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>

                <h4 style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.5rem' }}>Historial Reciente de Dosis</h4>
                {logsData.logs.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Sin tomas registradas aún.</p>
                ) : (
                  <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '8px 12px' }}>Medicamento</th>
                          <th style={{ padding: '8px 12px' }}>Programada</th>
                          <th style={{ padding: '8px 12px' }}>Administrada</th>
                          <th style={{ padding: '8px 12px' }}>Estado</th>
                          <th style={{ padding: '8px 12px' }}>Notas / Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logsData.logs.map(log => {
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
                              <td style={{ padding: '8px 12px' }}>{formatDateString(log.scheduledAt)}</td>
                              <td style={{ padding: '8px 12px' }}>{log.givenAt ? formatDateString(log.givenAt) : '—'}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${label.cls}`}>
                                  {label.text}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', color: '#64748b' }}>
                                {log.status === 'SKIPPED' ? `Motivo: ${log.skippedReason || 'No especificado'}` : log.notes || '—'}
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

        {/* PANEL: CONTROLES */}
        {activePanelTab === 'CONTROLES' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b' }}>Calendario de Controles Post-Operatorios</h4>
              {treatment.status === 'ACTIVE' && (
                <Button size="sm" onClick={() => setShowScheduleControl(true)}>
                  + Programar Control
                </Button>
              )}
            </div>

            {visits.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>No hay citas de control agendadas para este tratamiento.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {visits.map(v => {
                  const labelColor = v.status === 'COMPLETED' ? 'border-emerald-500' : v.status === 'CANCELLED' ? 'border-rose-400' : 'border-blue-400';
                  return (
                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', borderLeft: '4px solid transparent', border: '1px solid #e2e8f0' }} className={labelColor}>
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
                            <strong>Hallazgos Clínicos:</strong> {v.clinicalFindings}
                          </div>
                        )}
                      </div>
                      {treatment.status === 'ACTIVE' && v.status === 'SCHEDULED' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button size="sm" onClick={() => setCompletingVisitId(v.id)}>Completar</Button>
                          <Button size="sm" variant="outline" style={{ color: 'red' }} onClick={() => handleCancelVisit(v.id)}>Cancelar</Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PANEL: PROTOCOLO */}
        {activePanelTab === 'PROTOCOLO' && (
          <div>
            {!protocol ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <AlertTriangle className="w-8 h-8 text-slate-400 mb-2 style-inline" style={{ display: 'block', margin: '0 auto' }} />
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>No se ha definido el protocolo de cuidados para esta cirugía.</p>
                {treatment.status === 'ACTIVE' && (
                  <Button size="sm" onClick={() => setShowCreateProtocol(true)}>Definir Protocolo de Cuidados</Button>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b' }}>Protocolo Clínico de Cuidados</h4>
                  {treatment.status === 'ACTIVE' && (
                    <Button size="sm" variant="outline" onClick={() => setShowCreateProtocol(true)}>Editar Protocolo</Button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                  <div>
                    <h5 style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#475569', marginBottom: '4px' }}>Señales de Alarma</h5>
                    <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {Array.isArray(protocol.alarmSigns) && protocol.alarmSigns.map((s, idx) => (
                        <div key={idx} style={{ padding: '6px 0', borderBottom: idx < protocol.alarmSigns.length - 1 ? '1px solid #e2e8f0' : 'none', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 'bold', color: s.severity === 'CRITICAL' ? 'red' : s.severity === 'HIGH' ? 'orange' : 'inherit' }}>
                            🚨 {s.sign} ({s.severity})
                          </span>
                          <p style={{ margin: '2px 0 0 16px', color: '#64748b' }}>{s.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#475569', marginBottom: '4px' }}>Restricciones y Cuidados</h5>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                      <strong>Restricciones:</strong>
                      <ul style={{ margin: '4px 0 10px 16px', padding: 0 }}>
                        {Array.isArray(protocol.restrictions) && protocol.restrictions.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                      <strong>Cuidados Especiales:</strong>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        {Array.isArray(protocol.specialCare) && protocol.specialCare.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                    {protocol.emergencyCall && (
                      <div style={{ marginTop: '8px', background: '#fef2f2', padding: '8px', borderRadius: '6px', border: '1px solid #fca5a5', fontSize: '0.75rem', color: '#991b1b', fontWeight: 'bold' }}>
                        📞 Emergencia: {protocol.emergencyCall}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PANEL: ALTA */}
        {activePanelTab === 'ALTA' && (
          <div>
            {!dischargeSheet ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <FileText className="w-8 h-8 text-slate-400 mb-2 style-inline" style={{ display: 'block', margin: '0 auto' }} />
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>Paciente aún en evolución. No se ha emitido hoja de alta definitiva.</p>
                {treatment.status === 'ACTIVE' && (
                  <Button size="sm" onClick={() => setShowCreateDischarge(true)}>Generar Alta Médica</Button>
                )}
              </div>
            ) : (
              <div>
                <h4 style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#065f46', marginBottom: '0.5rem' }}>Hoja de Alta Médica Oficial</h4>
                <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.85rem', marginBottom: '10px' }}>
                    <strong>Resumen del Tratamiento:</strong>
                    <p style={{ color: '#15803d', margin: '2px 0 0 0' }}>{dischargeSheet.summary}</p>
                  </div>
                  {dischargeSheet.medications && Array.isArray(dischargeSheet.medications) && dischargeSheet.medications.length > 0 && (
                    <div style={{ fontSize: '0.85rem', marginBottom: '10px' }}>
                      <strong>Medicamentos en Domicilio:</strong>
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
                        <strong>Cuidados Especiales:</strong>
                        <p style={{ margin: '2px 0 0 0', color: '#15803d' }}>{dischargeSheet.restrictions}</p>
                      </div>
                    )}
                    {dischargeSheet.feedingNotes && (
                      <div>
                        <strong>Alimentación:</strong>
                        <p style={{ margin: '2px 0 0 0', color: '#15803d' }}>{dischargeSheet.feedingNotes}</p>
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
  );
}


// ============================================
// Main Vet Pet Detail Page
// ============================================
export default function VetPetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [showCreateTreatment, setShowCreateTreatment] = useState(false);

  const { pet, isLoading: petLoading, isError: petError } = usePetById(id);

  // Fetch treatments by status filter
  const { data: treatmentsData, isLoading: treatmentsLoading, mutate: refreshTreatments } = useSWR<Treatment[]>(
    `/treatments/by-pet/${id}?status=${activeTab === 'ACTIVE' ? 'ACTIVE' : 'COMPLETED'}`,
    (url: string) => api.get<Treatment[]>(url)
  );

  const treatments = treatmentsData || [];

  if (petLoading) {
    return (
      <div className="page flex justify-center pt-16"><Spinner size="lg" /></div>
    );
  }

  if (petError || !pet) {
    return (
      <div className="page">
        <div className="error-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle className="w-4 h-4 text-rose-500" /> Paciente no encontrado o error al cargar datos.
        </div>
        <Link href="/vet/pets" className="btn-secondary mt-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
          <ArrowLeft className="w-4 h-4" /> Volver a Pacientes
        </Link>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      {showCreateTreatment && (
        <CreateTreatmentModal
          petId={pet.id}
          onSuccess={() => refreshTreatments()}
          onClose={() => setShowCreateTreatment(false)}
        />
      )}

      {editingLog && (
        <AddVetNoteModal
          logId={editingLog.id}
          initialNote={editingLog.vetNotes}
          onSuccess={() => refreshTreatments()}
          onClose={() => setEditingLog(null)}
        />
      )}

      {/* Breadcrumb */}
      <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
        <Link href="/vet/pets" className="breadcrumb-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Pacientes
        </Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{pet.name}</span>
      </div>

      {/* Pet header card */}
      <div className="pet-detail-card glass-card" style={{ background: '#ffffff', border: '1px solid var(--color-border)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="pet-detail-avatar" style={{ background: 'rgba(0,168,132,0.1)', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SpeciesIcon species={pet.species} className="w-8 h-8 text-teal-600" />
          </div>
          <div className="pet-detail-info" style={{ flex: 1 }}>
            <h1 className="pet-detail-name" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{pet.name}</h1>
            <p className="pet-detail-species" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{translateSpecies(pet.species)}</p>
            <div className="pet-detail-meta" style={{ display: 'flex', gap: '1rem', marginTop: '6px', fontSize: '0.85rem' }}>
              {pet.breed && <span>Raza: <strong>{pet.breed}</strong></span>}
              {pet.weight && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Scale className="w-3.5 h-3.5 text-slate-500" /> <strong>{pet.weight} kg</strong>
                </span>
              )}
              {pet.microchip && <span>Microchip: <strong>{pet.microchip}</strong></span>}
            </div>
            {pet.owner && (
              <p className="pet-detail-owner" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.85rem' }}>
                <User className="w-3.5 h-3.5 text-slate-500" /> Dueño: <strong>{pet.owner.name}</strong>
                {pet.owner.phone && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                    · <Phone className="w-3.5 h-3.5 text-slate-500" /> {pet.owner.phone}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="pet-detail-actions" style={{ display: 'flex', gap: '0.75rem' }}>
            <Button onClick={() => setShowCreateTreatment(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Stethoscope className="w-4 h-4" /> Nuevo Tratamiento
            </Button>
            <Button variant="outline" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Printer className="w-4 h-4" /> Imprimir Ficha
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Selector: Activos vs Historial Completado */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('ACTIVE')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'ACTIVE' ? 'var(--color-accent)' : 'transparent',
            color: activeTab === 'ACTIVE' ? '#ffffff' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'ACTIVE' ? 'bold' : 'normal',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.9rem',
          }}
        >
          <Stethoscope className="w-4 h-4" /> Tratamientos Activos
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'HISTORY' ? 'var(--color-accent)' : 'transparent',
            color: activeTab === 'HISTORY' ? '#ffffff' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'HISTORY' ? 'bold' : 'normal',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.9rem',
          }}
        >
          <Clock className="w-4 h-4" /> Historial de Tratamientos Completados
        </button>
      </div>

      {/* Treatments List */}
      {treatmentsLoading ? (
        <div className="flex justify-center p-8"><Spinner size="lg" /></div>
      ) : treatments.length === 0 ? (
        <div className="empty-state large" style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '3rem 1rem' }}>
          <ClipboardList className="w-12 h-12 text-slate-400 mb-3" />
          <h3 className="empty-state-title" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            {activeTab === 'ACTIVE' ? 'No hay tratamientos activos' : 'No hay tratamientos en el historial completado'}
          </h3>
          <p className="empty-state-text">
            {activeTab === 'ACTIVE'
              ? 'Prescribe el primer tratamiento post-operatorio para este paciente.'
              : 'Los tratamientos finalizados o archivados aparecerán aquí.'}
          </p>
          {activeTab === 'ACTIVE' && (
            <Button className="mt-4" onClick={() => setShowCreateTreatment(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Stethoscope className="w-4 h-4" /> Prescribir Tratamiento
            </Button>
          )}
        </div>
      ) : (
        <div className="treatments-stack">
          {treatments.map((treatment) => (
            <TreatmentPanel key={treatment.id} treatment={treatment} onAddNote={setEditingLog} />
          ))}
        </div>
      )}
    </div>
  );
}
