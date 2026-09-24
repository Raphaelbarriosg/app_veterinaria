'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldAlert, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';

const emergencySchema = z.object({
  petId: z.string().min(1, 'Selecciona una mascota'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  symptoms: z.string().min(3, 'Describe los síntomas o signos de alarma'),
  notes: z.string().optional(),
});

type EmergencyForm = z.infer<typeof emergencySchema>;

interface PetOption {
  id: string;
  name: string;
  species: string;
}

export function EmergencyModal({
  pets,
  defaultPetId,
  onClose,
}: {
  pets: PetOption[];
  defaultPetId?: string;
  onClose: () => void;
}) {
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<EmergencyForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(emergencySchema) as any,
    defaultValues: {
      petId: defaultPetId || (pets[0]?.id ?? ''),
      severity: 'HIGH',
      symptoms: '',
    },
  });

  const onSubmit = async (data: EmergencyForm) => {
    try {
      const res = await api.post<{ message?: string }>('/emergency/report', data);
      setResultMsg(res.message || 'Emergencia reportada correctamente.');
      setToast({ message: 'Alerta enviada a la clínica asignada', type: 'success' });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al reportar la emergencia';
      setToast({ message: msg, type: 'error' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ borderTop: '4px solid var(--color-status-red)' }}
      >
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: 'var(--color-status-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert className="w-5 h-5" /> Reportar Emergencia Veterinaria
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {resultMsg ? (
          <div style={{ padding: '1rem 0', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Alerta Enviada</h4>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{resultMsg}</p>
            <Button onClick={onClose} variant="outline">Cerrar</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
            <div className="form-field">
              <label className="form-label" htmlFor="emg-pet">Mascota Afectada *</label>
              <select id="emg-pet" className="form-input" {...register('petId')}>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
                ))}
              </select>
              {errors.petId && <span className="text-red-500 text-sm mt-1">{errors.petId.message}</span>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="emg-severity">Nivel de Severidad *</label>
              <select id="emg-severity" className="form-input" {...register('severity')}>
                <option value="CRITICAL">CRÍTICO — Riesgo vital inmediato</option>
                <option value="HIGH">ALTO — Síntomas graves o sangrado</option>
                <option value="MEDIUM">MEDIO — Malestar moderado o fiebre</option>
                <option value="LOW">BAJO — Consulta prioritaria</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="emg-symptoms">Síntomas / Signos de Alarma *</label>
              <textarea
                id="emg-symptoms"
                rows={3}
                placeholder="Ej: Dificultad para respirar, desmayo, convulsiones o sangrado en la herida..."
                className="form-textarea"
                {...register('symptoms')}
              />
              {errors.symptoms && <span className="text-red-500 text-sm mt-1">{errors.symptoms.message}</span>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="emg-notes">Notas adicionales (Opcional)</label>
              <input
                id="emg-notes"
                type="text"
                placeholder="Ej: Ocurrió hace 20 minutos tras ingerir un objeto"
                className="form-input"
                {...register('notes')}
              />
            </div>

            <div className="modal-actions">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: 'var(--color-status-red)', borderColor: 'var(--color-status-red)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" /> Enviando...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" /> Enviar Alerta Urgente
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
