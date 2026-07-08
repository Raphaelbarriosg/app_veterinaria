// ============================================
// Traducciones y formateo
// ============================================

export function translateSpecies(species: string): string {
  const map: Record<string, string> = {
    DOG: 'Perro',
    CAT: 'Gato',
    BIRD: 'Ave',
    RODENT: 'Roedor',
    REPTILE: 'Reptil',
    OTHER: 'Otro',
  };
  return map[species] || species;
}

export function translateRole(role: string): string {
  const map: Record<string, string> = {
    VET: 'Veterinario',
    OWNER: 'Dueño',
    CLINIC_ADMIN: 'Admin. Clínica',
    SUPER_ADMIN: 'Super Admin',
  };
  return map[role] || role;
}

export function formatDateString(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d
    .getHours()
    .toString()
    .padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================
// Tipos compartidos
// ============================================

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  weight?: number;
  birthDate?: string;
  microchip?: string;
  isActive: boolean;
  ownerId: string;
  clinicId: string;
}

export interface Treatment {
  id: string;
  diagnosis: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';
  vetId: string;
  petId: string;
  clinicId: string;
  rules?: TreatmentRule[];
  dailyLogs?: DailyLog[];
  pet?: Pet;
  vet?: { id: string; name: string; email: string };
}

export interface TreatmentRule {
  id: string;
  medicineName: string;
  dosage: string;
  frequencyHours: number;
  requirePhoto: boolean;
  isActive: boolean;
}

export interface DailyLog {
  id: string;
  treatmentId: string;
  registeredAt: string;
  medicineTaken: boolean;
  appetiteLevel: number;
  energyLevel: number;
  painLevel?: number;
  temperature?: number;
  alarmSigns?: string;
  observations?: string;
  imageUrl?: string;
  vetNotes?: string;
}

export interface DashboardItem {
  treatmentId: string;
  pet: Pet & { owner?: { id: string; name: string; phone: string } };
  diagnosis: string;
  startDate: string;
  priority: 'RED' | 'YELLOW' | 'GREEN';
  stats: {
    expectedDoses: number;
    actualDoses: number;
    hasAlarmSigns: boolean;
    hasLowLevels: boolean;
    logsCount24h: number;
  };
  recentLogs: DailyLog[];
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  maxVets: number;
  maxPets: number;
  subscription?: {
    planType: string;
    status: string;
  };
  _count?: {
    members: number;
    pets: number;
  };
}