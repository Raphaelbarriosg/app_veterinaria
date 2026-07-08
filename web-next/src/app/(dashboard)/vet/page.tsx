'use client';

import { useDashboard } from '@/hooks/use-treatments';
import { usePets } from '@/hooks/use-pets';
import { useAuthStore } from '@/stores/auth-store';
import type { DashboardItem } from '@/lib/utils';
import { translateSpecies, formatDateString } from '@/lib/utils';
import Link from 'next/link';

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
// Treatment Card
// ============================================
function TreatmentCard({ item }: { item: DashboardItem }) {
  const priorityConfig = {
    RED: { label: 'Crítico', bg: 'priority-red', dot: 'dot-red' },
    YELLOW: { label: 'En seguimiento', bg: 'priority-yellow', dot: 'dot-yellow' },
    GREEN: { label: 'Estable', bg: 'priority-green', dot: 'dot-green' },
  };
  const cfg = priorityConfig[item.priority];

  return (
    <Link href={`/vet/pets/${item.pet.id}`} className={`treatment-card ${cfg.bg}`}>
      <div className="treatment-card-header">
        <div className="treatment-card-pet">
          <span className={`priority-dot ${cfg.dot}`} />
          <span className="treatment-pet-name">{item.pet.name}</span>
          <span className="treatment-pet-species">
            {translateSpecies(item.pet.species)}
          </span>
        </div>
        <span className={`priority-badge priority-badge-${item.priority.toLowerCase()}`}>
          {cfg.label}
        </span>
      </div>

      <p className="treatment-diagnosis">{item.diagnosis}</p>

      {item.pet.owner && (
        <p className="treatment-owner">
          👤 {item.pet.owner.name}
          {item.pet.owner.phone && (
            <span className="treatment-owner-phone"> · {item.pet.owner.phone}</span>
          )}
        </p>
      )}

      <div className="treatment-stats">
        <div className="stat-item">
          <span className="stat-label">Dosis registradas</span>
          <span className="stat-value">
            {item.stats.actualDoses}/{item.stats.expectedDoses}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Logs 24h</span>
          <span className="stat-value">{item.stats.logsCount24h}</span>
        </div>
        {item.stats.hasAlarmSigns && (
          <div className="stat-alarm">⚠️ Signos de alarma</div>
        )}
      </div>

      {item.recentLogs?.[0] && (
        <p className="treatment-last-log">
          Último log: {formatDateString(item.recentLogs[0].registeredAt)}
        </p>
      )}
    </Link>
  );
}

// ============================================
// Section
// ============================================
function TreatmentSection({
  title,
  items,
  priority,
  icon,
}: {
  title: string;
  items: DashboardItem[];
  priority: 'RED' | 'YELLOW' | 'GREEN';
  icon: string;
}) {
  const filtered = items.filter((i) => i.priority === priority);
  return (
    <div className={`traffic-section section-${priority.toLowerCase()}`}>
      <div className="traffic-section-header">
        <span className="traffic-section-icon">{icon}</span>
        <h2 className="traffic-section-title">{title}</h2>
        <span className="traffic-section-count">{filtered.length}</span>
      </div>
      {filtered.length === 0 ? (
        <div className="traffic-section-empty">Sin tratamientos en esta categoría</div>
      ) : (
        <div className="treatment-grid">
          {filtered.map((item) => (
            <TreatmentCard key={item.treatmentId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// VET Dashboard
// ============================================
export default function VetDashboardPage() {
  const { user } = useAuthStore();
  const { items, isLoading, isError } = useDashboard();
  const { pets, isLoading: petsLoading } = usePets();

  const totalRed = items.filter((i) => i.priority === 'RED').length;
  const totalYellow = items.filter((i) => i.priority === 'YELLOW').length;
  const totalGreen = items.filter((i) => i.priority === 'GREEN').length;

  return (
    <div className="page animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Bienvenido, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle">
            Panel de tratamientos activos — Semáforo de prioridades
          </p>
        </div>
        <Link href="/vet/pets" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Ver pacientes
        </Link>
      </div>

      {/* Summary stats */}
      {!isLoading && (
        <div className="stats-grid">
          <div className="stat-card stat-card-red">
            <span className="stat-card-icon">🔴</span>
            <div>
              <p className="stat-card-value">{totalRed}</p>
              <p className="stat-card-label">Críticos</p>
            </div>
          </div>
          <div className="stat-card stat-card-yellow">
            <span className="stat-card-icon">🟡</span>
            <div>
              <p className="stat-card-value">{totalYellow}</p>
              <p className="stat-card-label">En seguimiento</p>
            </div>
          </div>
          <div className="stat-card stat-card-green">
            <span className="stat-card-icon">🟢</span>
            <div>
              <p className="stat-card-value">{totalGreen}</p>
              <p className="stat-card-label">Estables</p>
            </div>
          </div>
          <div className="stat-card stat-card-neutral">
            <span className="stat-card-icon">🐾</span>
            <div>
              <p className="stat-card-value">{petsLoading ? '...' : pets.length}</p>
              <p className="stat-card-label">Pacientes</p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="error-banner">
          ⚠️ No se pudo cargar el dashboard. Verifica que el backend esté activo.
        </div>
      )}

      {/* Traffic light */}
      {isLoading ? (
        <div className="treatment-grid">
          {[1, 2, 3, 4].map((i) => <TreatmentSkeleton key={i} />)}
        </div>
      ) : (
        <div className="traffic-light-container">
          <TreatmentSection
            title="Críticos"
            items={items}
            priority="RED"
            icon="🔴"
          />
          <TreatmentSection
            title="En seguimiento"
            items={items}
            priority="YELLOW"
            icon="🟡"
          />
          <TreatmentSection
            title="Estables"
            items={items}
            priority="GREEN"
            icon="🟢"
          />
        </div>
      )}
    </div>
  );
}
