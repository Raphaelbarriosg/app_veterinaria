'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Search,
  Activity,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ClipboardList,
  Pill,
  Phone,
  User,
  PawPrint,
  X,
  Plus,
  Filter,
  Check,
  RotateCw,
  Camera,
  HeartPulse,
} from 'lucide-react';
import { useDashboard } from '@/hooks/use-treatments';
import { usePets, usePetSearch } from '@/hooks/use-pets';
import { useDailyLogs } from '@/hooks/use-daily-logs';
import { useAuthStore } from '@/stores/auth-store';
import type { DashboardItem, DailyLog } from '@/lib/utils';
import { translateSpecies, formatDateString, translateProcedureType } from '@/lib/utils';

import { api, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { EmergencyModal } from '@/components/emergency-modal';

// ============================================
// Skeleton loader
// ============================================
function TreatmentSkeleton() {
  return (
    <div className="treatment-card skeleton">
      <div className="skeleton-line w-40 h-4 mb-2" />
      <div className="skeleton-line w-24 h-3 mb-3" />
      <div className="skeleton-line w-full h-3 mb-1" />
      <div className="skeleton-line w-3/4 h-3" />
    </div>
  );
}

// ============================================
// Create Treatment Modal (con Reglas Dinámicas)
// ============================================
function CreateTreatmentModal({
  pet,
  onSuccess,
  onClose,
}: {
  pet: { id: string; name: string; species: string; breed?: string };
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [diagnosis, setDiagnosis] = useState('');
  const [procedureType, setProcedureType] = useState('OTHER');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [rules, setRules] = useState<
    { id: string; medicineName: string; dosage: string; frequencyHours: number; requirePhoto: boolean }[]
  >([
    { id: '1', medicineName: '', dosage: '', frequencyHours: 8, requirePhoto: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { id: Date.now().toString(), medicineName: '', dosage: '', frequencyHours: 8, requirePhoto: false },
    ]);
  };

  const removeRule = (id: string) => {
    if (rules.length === 1) return;
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateRule = (id: string, field: string, value: any) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setToast({ message: 'El diagnóstico es requerido', type: 'error' });
      return;
    }

    const validRules = rules
      .filter((r) => r.medicineName.trim() && r.dosage.trim())
      .map(({ medicineName, dosage, frequencyHours, requirePhoto }) => ({
        medicineName,
        dosage,
        frequencyHours: Number(frequencyHours),
        requirePhoto,
      }));

    setIsSubmitting(true);
    try {
      await api.post('/treatments', {
        petId: pet.id,
        diagnosis,
        procedureType,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        rules: validRules,
      });
      setToast({ message: 'Tratamiento prescrito correctamente', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al prescribir tratamiento';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Stethoscope className="w-5 h-5 text-teal-400" /> Prescribir Tratamiento Post-Operatorio
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div style={{ padding: '0.75rem 1rem', background: 'var(--color-surface)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PawPrint className="w-4 h-4 text-teal-400" />
          <span style={{ fontSize: '0.9rem' }}>
            Paciente: <strong>{pet.name}</strong> ({translateSpecies(pet.species)}{pet.breed ? ` · ${pet.breed}` : ''})
          </span>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
            <div className="form-field">
              <label className="form-label" htmlFor="tx-diagnosis">Diagnóstico Quirúrgico *</label>
              <input
                id="tx-diagnosis"
                type="text"
                required
                placeholder="Ej. Fractura distal de fémur izq"
                className="form-input"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="tx-procedure-type">Tipo de Procedimiento</label>
              <select
                id="tx-procedure-type"
                className="form-input"
                value={procedureType}
                onChange={(e) => setProcedureType(e.target.value)}
              >
                <option value="CASTRATION_MALE">Castración (Macho)</option>
                <option value="OVARIOHYSTERECTOMY">Ovariohisterectomía (OVH)</option>
                <option value="ORTHOPEDIC_FRACTURE">Ortopedia / Fractura</option>
                <option value="TUMOR_RESECTION">Resección de Tumor</option>
                <option value="DENTAL">Cirugía Dental</option>
                <option value="GASTROENTEROLOGY">Cirugía Gastrointestinal</option>
                <option value="OPHTHALMOLOGY">Cirugía Ocular</option>
                <option value="DERMATOLOGY">Cirugía de Piel / Heridas</option>
                <option value="GENERAL_SURGERY">Cirugía General</option>
                <option value="MEDICAL_TREATMENT">Tratamiento Médico</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
            <div className="form-field">
              <label className="form-label" htmlFor="tx-start-date">Fecha de Inicio *</label>
              <input
                id="tx-start-date"
                type="date"
                required
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="tx-end-date">Fecha Fin (Opcional)</label>

              <input
                id="tx-end-date"
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Pill className="w-4 h-4 text-teal-400" /> Reglas de Medicación
              </h4>
              <Button type="button" size="sm" variant="outline" onClick={addRule} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus className="w-3.5 h-3.5" /> Agregar Regla
              </Button>
            </div>

            {rules.map((rule) => (
              <div key={rule.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Medicamento"
                  className="form-input"
                  value={rule.medicineName}
                  onChange={(e) => updateRule(rule.id, 'medicineName', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Dosis"
                  className="form-input"
                  value={rule.dosage}
                  onChange={(e) => updateRule(rule.id, 'dosage', e.target.value)}
                />
                <select
                  className="form-input"
                  value={rule.frequencyHours}
                  onChange={(e) => updateRule(rule.id, 'frequencyHours', Number(e.target.value))}
                >
                  <option value={4}>C/4h</option>
                  <option value={6}>C/6h</option>
                  <option value={8}>C/8h</option>
                  <option value={12}>C/12h</option>
                  <option value={24}>C/24h</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rule.requirePhoto}
                    onChange={(e) => updateRule(rule.id, 'requirePhoto', e.target.checked)}
                  />
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                </label>
                {rules.length > 1 && (
                  <Button type="button" size="sm" variant="outline" onClick={() => removeRule(rule.id)} style={{ color: 'var(--color-status-red)', padding: '4px 8px' }}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner size="sm" /> Prescribiendo...</> : 'Crear Tratamiento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Logs History Modal
// ============================================
function LogsHistoryModal({
  treatmentId,
  petName,
  diagnosis,
  onClose,
}: {
  treatmentId: string;
  petName: string;
  diagnosis: string;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const { logs, meta, isLoading } = useDailyLogs(treatmentId, page);

  const painColor = (v: number) =>
    v >= 7 ? 'var(--color-status-red)' : v >= 4 ? 'var(--color-status-yellow)' : 'var(--color-status-green)';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card wide-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList className="w-5 h-5 text-teal-400" /> Historial de Evolución
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Paciente: <strong>{petName}</strong> — <em>{diagnosis}</em>
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '0 0.25rem' }}>
          {isLoading ? (
            <div className="flex justify-center p-8"><Spinner size="lg" /></div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <ClipboardList className="w-10 h-10 text-slate-500 mb-2" />
              <p className="empty-state-text">Sin reportes de evolución registrados aún</p>
            </div>
          ) : (
            <div className="logs-list">
              {logs.map((log: DailyLog) => (
                <div key={log.id} className="log-card" style={{
                  borderLeft: log.alarmSigns ? '3px solid var(--color-status-red)' : '3px solid var(--color-status-green)',
                }}>
                  <div className="log-card-header">
                    <span className="log-date">{formatDateString(log.registeredAt)}</span>
                    <span className={`log-medicine ${log.medicineTaken ? 'medicine-yes' : 'medicine-no'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {log.medicineTaken ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Tomó medicamento
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5 text-rose-400" /> No tomó
                        </>
                      )}
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
                        <span className="log-level-value" style={{ color: painColor(log.painLevel) }}>{log.painLevel}/10</span>
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
                      <AlertTriangle className="w-4 h-4 text-rose-400" /> {log.alarmSigns}
                    </div>
                  )}
                  {log.observations && <p className="log-observations">{log.observations}</p>}
                  {log.vetNotes && (
                    <div className="log-vet-notes">
                      <span className="log-vet-notes-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Stethoscope className="w-3.5 h-3.5 text-teal-400" /> Notas del veterinario:
                      </span>
                      <p>{log.vetNotes}</p>
                    </div>
                  )}
                  {log.imageUrl && (
                    <a href={log.imageUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '0.5rem', textDecoration: 'none' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={log.imageUrl}
                        alt="Foto de evolución"
                        style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                      />
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Camera className="w-3.5 h-3.5" /> Ver foto completa
                      </p>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {meta.totalPages > 1 && (
          <div className="pagination" style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
            <button className="pagination-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              ← Anterior
            </button>
            <span className="pagination-info">{page} / {meta.totalPages}</span>
            <button className="pagination-btn" onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Treatment Card Component
// ============================================
function TreatmentCard({
  item,
  onViewLogs,
  onFinalize,
}: {
  item: DashboardItem;
  onViewLogs: (item: DashboardItem) => void;
  onFinalize: (treatmentId: string) => void;
}) {
  const priorityConfig = {
    RED: { label: 'Crítico', bg: 'priority-red', badgeCls: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    YELLOW: { label: 'En seguimiento', bg: 'priority-yellow', badgeCls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    GREEN: { label: 'Estable', bg: 'priority-green', badgeCls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  };
  const cfg = priorityConfig[item.priority];

  return (
    <div className={`treatment-card ${cfg.bg}`}>
      <Link href={`/vet/pets/${item.pet.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="treatment-card-header">
          <div className="treatment-card-pet" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity className="w-4 h-4 text-teal-400" />
            <span className="treatment-pet-name">{item.pet.name}</span>
            <span className="treatment-pet-species">
              {translateSpecies(item.pet.species)}
            </span>
          </div>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${cfg.badgeCls}`}>
            {cfg.label}
          </span>
        </div>

        <p className="treatment-diagnosis">{item.diagnosis}</p>

        {item.pet.owner && (
          <p className="treatment-owner" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            <User className="w-3.5 h-3.5" /> {item.pet.owner.name}
            {item.pet.owner.phone && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                · <Phone className="w-3.5 h-3.5" /> {item.pet.owner.phone}
              </span>
            )}
          </p>
        )}

        <div className="treatment-stats">
          <div className="stat-item">
            <span className="stat-label">Dosis (24h)</span>
            <span className="stat-value">
              {item.stats.actualDoses}/{item.stats.expectedDoses}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Reportes (24h)</span>
            <span className="stat-value">{item.stats.logsCount24h}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Alarmas</span>
            <span className="stat-value" style={{ color: item.stats.hasAlarmSigns ? 'var(--color-status-red)' : 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {item.stats.hasAlarmSigns ? <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> : <Check className="w-3.5 h-3.5 text-emerald-400" />}
              {item.stats.hasAlarmSigns ? 'Sí' : 'No'}
            </span>
          </div>
        </div>

        {item.recentLogs?.[0] && (
          <p className="treatment-last-log" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Último log: {formatDateString(item.recentLogs[0].registeredAt)}
          </p>
        )}
      </Link>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          className="btn-secondary"
          style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'transparent', color: 'var(--color-text)' }}
          onClick={() => onViewLogs(item)}
        >
          <ClipboardList className="w-3.5 h-3.5 text-teal-400" /> Ver Evolución
        </button>
        <button
          className="btn-secondary"
          style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer', border: '1px solid var(--color-status-green)', borderRadius: '8px', background: 'transparent', color: 'var(--color-status-green)' }}
          onClick={() => onFinalize(item.treatmentId)}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Finalizar
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main VET Dashboard Component
// ============================================
export default function VetDashboardPage() {
  const { user } = useAuthStore();
  const { items, isLoading, isError, refresh } = useDashboard();
  const { pets, isLoading: petsLoading } = usePets();

  const [searchQuery, setSearchQuery] = useState('');
  const { results: searchResults, isLoading: searchingPets } = usePetSearch(searchQuery);

  const [selectedItem, setSelectedItem] = useState<DashboardItem | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [prescribingPet, setPrescribingPet] = useState<any | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'RED' | 'YELLOW' | 'GREEN'>('ALL');

  const totalRed = items.filter((i) => i.priority === 'RED').length;
  const totalYellow = items.filter((i) => i.priority === 'YELLOW').length;
  const totalGreen = items.filter((i) => i.priority === 'GREEN').length;

  const filteredItems = items.filter((i) => {
    if (priorityFilter === 'ALL') return true;
    return i.priority === priorityFilter;
  });

  const handleFinalize = async (treatmentId: string) => {
    if (confirm('¿Estás seguro de marcar este tratamiento como COMPLETADO? Esta acción cerrará el monitoreo activo.')) {
      try {
        await api.patch(`/treatments/${treatmentId}`, { status: 'COMPLETED' });
        refresh();
      } catch {
        alert('Error al finalizar el tratamiento');
      }
    }
  };

  return (
    <div className="page animate-fade-in">
      {selectedItem && (
        <LogsHistoryModal
          treatmentId={selectedItem.treatmentId}
          petName={selectedItem.pet.name}
          diagnosis={selectedItem.diagnosis}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {prescribingPet && (
        <CreateTreatmentModal
          pet={prescribingPet}
          onSuccess={() => {
            refresh();
            setSearchQuery('');
          }}
          onClose={() => setPrescribingPet(null)}
        />
      )}

      {showEmergencyModal && (
        <EmergencyModal
          pets={pets}
          onClose={() => setShowEmergencyModal(false)}
        />
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Stethoscope className="w-7 h-7 text-teal-400" /> bienvenido, {user?.name?.split(' ')[0]}
          </h1>
          <p className="page-subtitle">Panel de tratamientos activos — Semáforo de prioridades clínicas</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button
            onClick={() => setShowEmergencyModal(true)}
            style={{ backgroundColor: 'var(--color-status-red)', borderColor: 'var(--color-status-red)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ShieldAlert className="w-4 h-4" /> Reportar Emergencia
          </Button>
          <Link href="/vet/pets" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Search className="w-4 h-4" /> Ver pacientes
          </Link>
        </div>
      </div>

      {/* Live Pet Search & Prescribe Bar */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Search className="w-5 h-5 text-teal-400" />
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Buscador Rápido de Pacientes:</span>
          <input
            type="text"
            placeholder="Escribe el nombre del paciente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ flex: 1, minWidth: '220px', padding: '0.4rem 0.75rem' }}
          />
          {searchQuery && (
            <Button size="sm" variant="outline" onClick={() => setSearchQuery('')}>Limpiar</Button>
          )}
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
            {searchingPets ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <Spinner size="sm" /> Buscando pacientes...
              </div>
            ) : searchResults.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                No se encontraron pacientes con ese nombre.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {searchResults.map((pet) => (
                  <div
                    key={pet.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>{pet.name}</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                        {translateSpecies(pet.species)}{pet.breed ? ` · ${pet.breed}` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setPrescribingPet(pet)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Stethoscope className="w-3.5 h-3.5" /> Prescribir
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Overview Grid */}
      {!isLoading && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card stat-card-red" onClick={() => setPriorityFilter('RED')} style={{ cursor: 'pointer' }}>
            <ShieldAlert className="stat-card-icon text-rose-400" />
            <div>
              <p className="stat-card-value">{totalRed}</p>
              <p className="stat-card-label">Críticos</p>
            </div>
          </div>
          <div className="stat-card stat-card-yellow" onClick={() => setPriorityFilter('YELLOW')} style={{ cursor: 'pointer' }}>
            <AlertTriangle className="stat-card-icon text-amber-400" />
            <div>
              <p className="stat-card-value">{totalYellow}</p>
              <p className="stat-card-label">En seguimiento</p>
            </div>
          </div>
          <div className="stat-card stat-card-green" onClick={() => setPriorityFilter('GREEN')} style={{ cursor: 'pointer' }}>
            <CheckCircle2 className="stat-card-icon text-emerald-400" />
            <div>
              <p className="stat-card-value">{totalGreen}</p>
              <p className="stat-card-label">Estables</p>
            </div>
          </div>
          <div className="stat-card stat-card-neutral">
            <PawPrint className="stat-card-icon text-teal-400" />
            <div>
              <p className="stat-card-value">{petsLoading ? '...' : pets.length}</p>
              <p className="stat-card-label">Pacientes</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        <Filter className="w-4 h-4 text-slate-400" />
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginRight: '0.5rem' }}>
          Filtrar prioridad:
        </span>
        {(['ALL', 'RED', 'YELLOW', 'GREEN'] as const).map((pf) => (
          <button
            key={pf}
            onClick={() => setPriorityFilter(pf)}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: priorityFilter === pf ? 'bold' : 'normal',
              cursor: 'pointer',
              border: '1px solid var(--color-border)',
              background: priorityFilter === pf ? 'var(--color-accent)' : 'transparent',
              color: priorityFilter === pf ? '#fff' : 'var(--color-text)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {pf === 'ALL' && 'Todos'}
            {pf === 'RED' && <><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Críticos</>}
            {pf === 'YELLOW' && <><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> En seguimiento</>}
            {pf === 'GREEN' && <><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Estables</>}
          </button>
        ))}
      </div>

      {isError && (
        <div className="error-banner">
          ⚠️ No se pudo cargar el dashboard. Verifica que el backend esté activo.
        </div>
      )}

      {isLoading ? (
        <div className="treatment-grid">
          {[1, 2, 3, 4].map((i) => <TreatmentSkeleton key={i} />)}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <Stethoscope className="w-10 h-10 text-slate-500 mb-2" />
          <p className="empty-state-text">No hay tratamientos en la categoría seleccionada</p>
        </div>
      ) : (
        <div className="treatment-grid">
          {filteredItems.map((item) => (
            <TreatmentCard key={item.treatmentId} item={item} onViewLogs={setSelectedItem} onFinalize={handleFinalize} />
          ))}
        </div>
      )}
    </div>
  );
}
