'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePets, usePetSearch } from '@/hooks/use-pets';
import { translateSpecies } from '@/lib/utils';

function PetCardSkeleton() {
  return (
    <div className="pet-card skeleton">
      <div className="skeleton-avatar" />
      <div className="skeleton-line w-32 h-4 mb-2" />
      <div className="skeleton-line w-20 h-3" />
    </div>
  );
}

function PetCard({ pet }: { pet: { id: string; name: string; species: string; breed?: string; isActive: boolean } }) {
  const speciesEmoji: Record<string, string> = {
    DOG: '🐕',
    CAT: '🐈',
    BIRD: '🦜',
    RODENT: '🐭',
    REPTILE: '🦎',
    OTHER: '🐾',
  };

  return (
    <Link href={`/vet/pets/${pet.id}`} className="pet-card">
      <div className="pet-card-avatar">
        <span className="pet-card-emoji">{speciesEmoji[pet.species] ?? '🐾'}</span>
      </div>
      <h3 className="pet-card-name">{pet.name}</h3>
      <p className="pet-card-species">{translateSpecies(pet.species)}</p>
      {pet.breed && <p className="pet-card-breed">{pet.breed}</p>}
      <span className={`pet-card-status ${pet.isActive ? 'status-active' : 'status-inactive'}`}>
        {pet.isActive ? 'Activo' : 'Inactivo'}
      </span>
    </Link>
  );
}

export default function VetPetsPage() {
  const [query, setQuery] = useState('');
  const { pets, isLoading } = usePets();
  const { results: searchResults, isLoading: searching } = usePetSearch(query);

  const displayPets = query.length >= 2 ? searchResults : pets;
  const loading = query.length >= 2 ? searching : isLoading;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-subtitle">Gestión de mascotas registradas en la clínica</p>
        </div>
        <div className="page-header-count">
          <span className="count-badge">{pets.length} pacientes</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="pets-search"
            type="text"
            placeholder="Buscar paciente por nombre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          {query && (
            <button
              className="search-clear"
              onClick={() => setQuery('')}
            >
              ✕
            </button>
          )}
        </div>
        {query.length >= 2 && !searching && (
          <p className="search-results-hint">
            {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para &quot;{query}&quot;
          </p>
        )}
      </div>

      {/* Pet grid */}
      {loading ? (
        <div className="pet-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => <PetCardSkeleton key={i} />)}
        </div>
      ) : displayPets.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔍</span>
          <p className="empty-state-text">
            {query ? 'No se encontraron pacientes con ese nombre' : 'No hay pacientes registrados'}
          </p>
        </div>
      ) : (
        <div className="pet-grid">
          {displayPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </div>
  );
}
