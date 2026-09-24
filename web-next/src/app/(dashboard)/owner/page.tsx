'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dog,
  Cat,
  Bird,
  PawPrint,
  Edit3,
  Trash2,
  Plus,
  ShieldAlert,
  CheckCircle2,
  X,
  ArrowRight,
  Scale,
  Heart,
} from 'lucide-react';
import { usePets } from '@/hooks/use-pets';
import { useAuthStore } from '@/stores/auth-store';
import { translateSpecies } from '@/lib/utils';
import { api, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { EmergencyModal } from '@/components/emergency-modal';

// ============================================
// Pet Form Schema
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

// Helper species icon
function SpeciesIcon({ species, className = 'w-6 h-6 text-teal-400' }: { species: string; className?: string }) {
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
// Create Pet Modal
// ============================================
function CreatePetModal({
  onSuccess,
  onClose,
}: {
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
      species: 'DOG',
    },
  });

  const onSubmit = async (data: PetForm) => {
    try {
      await api.post('/pets', data);
      setToast({ message: 'Mascota registrada correctamente', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al registrar la mascota';
      setToast({ message: msg, type: 'error' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PawPrint className="w-5 h-5 text-teal-400" /> Registrar Mascota
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
              <option value="DOG">Perro (DOG)</option>
              <option value="CAT">Gato (CAT)</option>
              <option value="BIRD">Ave (BIRD)</option>
              <option value="RODENT">Roedor (RODENT)</option>
              <option value="REPTILE">Reptil (REPTILE)</option>
              <option value="OTHER">Otro (OTHER)</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="pet-breed">Raza (Opcional)</label>
            <input
              id="pet-breed"
              type="text"
              placeholder="Ej: Golden Retriever"
              className="form-input"
              {...register('breed')}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="pet-weight">Peso en kg (Opcional)</label>
            <input
              id="pet-weight"
              type="number"
              step="0.1"
              placeholder="Ej: 12.5"
              className="form-input"
              {...register('weight')}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="pet-microchip">Número de Microchip (Opcional)</label>
            <input
              id="pet-microchip"
              type="text"
              placeholder="Ej: 900215000123456"
              className="form-input"
              {...register('microchip')}
            />
          </div>

          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner size="sm" /> Guardando...</> : 'Registrar Mascota'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Edit Pet Modal
// ============================================
function EditPetModal({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      name: pet.name || '',
      species: pet.species || 'DOG',
      breed: pet.breed || '',
      weight: pet.weight ?? undefined,
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
            <label className="form-label" htmlFor="edit-pet-name">Nombre *</label>
            <input
              id="edit-pet-name"
              type="text"
              className="form-input"
              {...register('name')}
            />
            {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name.message}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="edit-pet-species">Especie *</label>
            <select
              id="edit-pet-species"
              className="form-input"
              {...register('species')}
            >
              <option value="DOG">Perro (DOG)</option>
              <option value="CAT">Gato (CAT)</option>
              <option value="BIRD">Ave (BIRD)</option>
              <option value="RODENT">Roedor (RODENT)</option>
              <option value="REPTILE">Reptil (REPTILE)</option>
              <option value="OTHER">Otro (OTHER)</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="edit-pet-breed">Raza (Opcional)</label>
            <input
              id="edit-pet-breed"
              type="text"
              className="form-input"
              {...register('breed')}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="edit-pet-weight">Peso en kg (Opcional)</label>
            <input
              id="edit-pet-weight"
              type="number"
              step="0.1"
              className="form-input"
              {...register('weight')}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="edit-pet-microchip">Número de Microchip (Opcional)</label>
            <input
              id="edit-pet-microchip"
              type="text"
              className="form-input"
              {...register('microchip')}
            />
          </div>

          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner size="sm" /> Guardando...</> : 'Actualizar Datos'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PetCardSkeleton() {
  return (
    <div className="owner-pet-card skeleton">
      <div className="skeleton-avatar large" />
      <div style={{ flex: 1 }}>
        <div className="skeleton-line w-32 h-5 mb-2" />
        <div className="skeleton-line w-24 h-3 mb-1" />
        <div className="skeleton-line w-16 h-3" />
      </div>
    </div>
  );
}

// ============================================
// Main OWNER Dashboard Component
// ============================================
export default function OwnerDashboardPage() {
  const { user } = useAuthStore();
  const { pets, isLoading, isError, refreshPets } = usePets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingPet, setEditingPet] = useState<any | null>(null);
  const [pageToast, setPageToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const activePets = pets.filter((p) => p.isActive);
  const inactivePets = pets.filter((p) => !p.isActive);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDeletePet = async (pet: any) => {
    if (confirm(`¿Estás seguro de que deseas eliminar a "${pet.name}"? Esta acción no se puede deshacer.`)) {
      try {
        await api.delete(`/pets/${pet.id}`);
        setPageToast({ message: 'Mascota eliminada correctamente', type: 'success' });
        refreshPets();
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Error al eliminar la mascota';
        setPageToast({ message: msg, type: 'error' });
      }
    }
  };

  return (
    <div className="page animate-fade-in">
      {pageToast && <Toast message={pageToast.message} type={pageToast.type} onClose={() => setPageToast(null)} />}
      
      {showCreateModal && (
        <CreatePetModal 
          onSuccess={refreshPets}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showEmergencyModal && (
        <EmergencyModal
          pets={pets}
          onClose={() => setShowEmergencyModal(false)}
        />
      )}

      {editingPet && (
        <EditPetModal
          pet={editingPet}
          onSuccess={refreshPets}
          onClose={() => setEditingPet(null)}
        />
      )}
      
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Heart className="w-7 h-7 text-teal-400" /> Hola, {user?.name?.split(' ')[0]}
          </h1>
          <p className="page-subtitle">
            Panel de monitoreo y seguimiento de tus mascotas
          </p>
        </div>
        <div className="stats-summary" style={{ gap: '1rem', display: 'flex', alignItems: 'center' }}>
          {pets.length > 0 && (
            <Button
              onClick={() => setShowEmergencyModal(true)}
              style={{ backgroundColor: 'var(--color-status-red)', borderColor: 'var(--color-status-red)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ShieldAlert className="w-4 h-4" /> Reportar Emergencia
            </Button>
          )}
          <div className="stat-pill">
            <span className="stat-pill-value">{activePets.length}</span>
            <span className="stat-pill-label">mascotas activas</span>
          </div>
          <Button onClick={() => setShowCreateModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus className="w-4 h-4" /> Registrar Mascota
          </Button>
        </div>
      </div>

      {isError && (
        <div className="error-banner">
          ⚠️ No se pudo cargar tus mascotas. Verifica tu conexión.
        </div>
      )}

      {isLoading ? (
        <div className="owner-pet-list">
          {[1, 2, 3].map((i) => <PetCardSkeleton key={i} />)}
        </div>
      ) : pets.length === 0 ? (
        <div className="empty-state large">
          <PawPrint className="w-12 h-12 text-slate-500 mb-3" />
          <h2 className="empty-state-title">Aún no tienes mascotas registradas</h2>
          <p className="empty-state-text">
            Puedes registrar tu mascota usando el botón de arriba, o contactar a tu veterinario.
          </p>
        </div>
      ) : (
        <>
          <h2 className="section-title">Mascotas activas</h2>
          <div className="owner-pet-list">
            {activePets.map((pet) => (
              <div key={pet.id} className="owner-pet-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link href={`/owner/pets/${pet.id}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, textDecoration: 'none', color: 'inherit' }}>
                  <div className="owner-pet-emoji-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,184,166,0.1)', padding: '12px', borderRadius: '12px' }}>
                    <SpeciesIcon species={pet.species} className="w-7 h-7 text-teal-400" />
                  </div>
                  <div className="owner-pet-info">
                    <h3 className="owner-pet-name">{pet.name}</h3>
                    <p className="owner-pet-species">{translateSpecies(pet.species)}</p>
                    {pet.breed && <p className="owner-pet-breed">{pet.breed}</p>}
                    {pet.weight && (
                      <p className="owner-pet-weight" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Scale className="w-3.5 h-3.5 text-slate-400" /> {pet.weight} kg
                      </p>
                    )}
                  </div>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingPet(pet);
                    }}
                    title="Editar mascota"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeletePet(pet);
                    }}
                    title="Eliminar mascota"
                    style={{ color: 'var(--color-status-red)', borderColor: 'var(--color-status-red)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </Button>
                  <Link href={`/owner/pets/${pet.id}`} className="owner-pet-arrow" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {inactivePets.length > 0 && (
            <>
              <h2 className="section-title mt-6" style={{ opacity: 0.6 }}>Mascotas inactivas</h2>
              <div className="owner-pet-list">
                {inactivePets.map((pet) => (
                  <div key={pet.id} className="owner-pet-card inactive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link href={`/owner/pets/${pet.id}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, textDecoration: 'none', color: 'inherit' }}>
                      <div className="owner-pet-emoji-wrap">
                        <SpeciesIcon species={pet.species} className="w-6 h-6 text-slate-500" />
                      </div>
                      <div className="owner-pet-info">
                        <h3 className="owner-pet-name">{pet.name}</h3>
                        <p className="owner-pet-species">{translateSpecies(pet.species)}</p>
                      </div>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
                      <span className="status-badge status-inactive">Inactivo</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingPet(pet);
                        }}
                        title="Editar mascota"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeletePet(pet);
                        }}
                        title="Eliminar mascota"
                        style={{ color: 'var(--color-status-red)', borderColor: 'var(--color-status-red)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
