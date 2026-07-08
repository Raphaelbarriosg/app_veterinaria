'use client';

import Link from 'next/link';
import { usePets } from '@/hooks/use-pets';
import { useAuthStore } from '@/stores/auth-store';
import { translateSpecies } from '@/lib/utils';

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

export default function OwnerDashboardPage() {
  const { user } = useAuthStore();
  const { pets, isLoading, isError } = usePets();

  const speciesEmoji: Record<string, string> = {
    DOG: '🐕', CAT: '🐈', BIRD: '🦜', RODENT: '🐭', REPTILE: '🦎', OTHER: '🐾',
  };

  const activePets = pets.filter((p) => p.isActive);
  const inactivePets = pets.filter((p) => !p.isActive);

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Hola, {user?.name?.split(' ')[0]} 🐾
          </h1>
          <p className="page-subtitle">
            Panel de seguimiento de tus mascotas
          </p>
        </div>
        <div className="stats-summary">
          <div className="stat-pill">
            <span className="stat-pill-value">{activePets.length}</span>
            <span className="stat-pill-label">mascotas activas</span>
          </div>
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
          <span className="empty-state-icon">🐾</span>
          <h2 className="empty-state-title">Aún no tienes mascotas registradas</h2>
          <p className="empty-state-text">
            Contacta con tu veterinario para que registre a tu mascota en el sistema.
          </p>
        </div>
      ) : (
        <>
          <h2 className="section-title">Mascotas activas</h2>
          <div className="owner-pet-list">
            {activePets.map((pet) => (
              <Link key={pet.id} href={`/owner/pets/${pet.id}`} className="owner-pet-card">
                <div className="owner-pet-emoji-wrap">
                  <span className="owner-pet-emoji">{speciesEmoji[pet.species] ?? '🐾'}</span>
                </div>
                <div className="owner-pet-info">
                  <h3 className="owner-pet-name">{pet.name}</h3>
                  <p className="owner-pet-species">{translateSpecies(pet.species)}</p>
                  {pet.breed && <p className="owner-pet-breed">{pet.breed}</p>}
                  {pet.weight && <p className="owner-pet-weight">⚖️ {pet.weight} kg</p>}
                </div>
                <div className="owner-pet-arrow">→</div>
              </Link>
            ))}
          </div>

          {inactivePets.length > 0 && (
            <>
              <h2 className="section-title mt-6" style={{ opacity: 0.6 }}>Mascotas inactivas</h2>
              <div className="owner-pet-list">
                {inactivePets.map((pet) => (
                  <Link key={pet.id} href={`/owner/pets/${pet.id}`} className="owner-pet-card inactive">
                    <div className="owner-pet-emoji-wrap">
                      <span className="owner-pet-emoji">{speciesEmoji[pet.species] ?? '🐾'}</span>
                    </div>
                    <div className="owner-pet-info">
                      <h3 className="owner-pet-name">{pet.name}</h3>
                      <p className="owner-pet-species">{translateSpecies(pet.species)}</p>
                    </div>
                    <span className="status-badge status-inactive">Inactivo</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
