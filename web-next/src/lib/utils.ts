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
  owner?: { id: string; name: string; email: string; phone?: string };
}

export interface Treatment {
  id: string;
  diagnosis: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';
  procedureType: string;
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
  logType: 'OWNER' | 'CLINICAL' | 'TECH';
  registeredById: string;
  registeredAt: string;
  medicineTaken?: boolean;
  appetiteLevel: number;
  energyLevel: number;
  painLevel?: number;
  temperature?: number;
  alarmSigns?: string;
  observations?: string;
  imageUrl?: string;
  vetNotes?: string;
  editHistory?: any;
  editedAt?: string;
  editedById?: string;
  registeredBy?: { id: string; name: string; role: string };
}

export interface MedicationLog {
  id: string;
  treatmentId: string;
  ruleId: string;
  registeredById: string;
  scheduledAt: string;
  givenAt?: string;
  status: 'PENDING' | 'GIVEN' | 'SKIPPED' | 'LATE';
  skippedReason?: string;
  photoUrl?: string;
  notes?: string;
  rule?: TreatmentRule;
  registeredBy?: { id: string; name: string; role: string };
}

export interface ControlVisit {
  id: string;
  treatmentId: string;
  vetId?: string;
  type: 'HOURS_48' | 'STITCH_REMOVAL' | 'BANDAGE_CHANGE' | 'ULTRASOUND' | 'BLOOD_TEST' | 'GENERAL_CONTROL' | 'FINAL_DISCHARGE' | 'OTHER';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  scheduledAt: string;
  completedAt?: string;
  notes?: string;
  clinicalFindings?: string;
  vet?: { id: string; name: string; phone?: string };
}

export interface PostOpProtocol {
  id: string;
  treatmentId: string;
  createdById: string;
  procedureType: string;
  alarmSigns: { sign: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'; description?: string }[];
  restrictions: string[];
  specialCare: string[];
  emergencyCall?: string;
}

export interface DischargeSheet {
  id: string;
  treatmentId: string;
  createdById: string;
  summary: string;
  nextSteps?: string;
  returnSigns?: string;
  restrictions?: string;
  medications?: { name: string; dosage: string; schedule: string; duration: string }[];
  feedingNotes?: string;
}

export interface DashboardItem {
  treatmentId: string;
  pet: Pet & { owner?: { id: string; name: string; phone: string } };
  diagnosis: string;
  procedureType: string;
  startDate: string;
  priority: 'RED' | 'YELLOW' | 'GREEN';
  stats: {
    expectedDoses: number;
    actualDoses: number;
    hasAlarmSigns: boolean;
    hasFever: boolean;
    logsCount24h: number;
    medLogsCount24h: number;
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

export interface ClinicMemberItem {
  id: string;
  clinicId: string;
  userId: string;
  role: 'VET' | 'OWNER' | 'CLINIC_ADMIN' | 'SUPER_ADMIN';
  joinedAt: string;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface ClinicInvitationItem {
  id: string;
  clinicId: string;
  email: string;
  role: 'VET' | 'OWNER' | 'CLINIC_ADMIN';
  token: string;
  invitedBy: string;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
}

export interface ClinicStats {
  clinic: {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone?: string;
    address?: string;
    status: string;
    timezone: string;
    currency: string;
  };
  totalPets: number;
  activeTreatments: number;
  completedTreatments: number;
  criticalAlerts: number;
  vetsCount: number;
  adminsCount: number;
  ownersCount: number;
  totalMembers: number;
  pendingInvitations: number;
  speciesDistribution: Array<{ species: string; count: number }>;
  capacity: {
    currentVets: number;
    maxVets: number;
    currentPets: number;
    maxPets: number;
    pctVets: number;
    pctPets: number;
  };
  subscription: {
    planType: string;
    status: string;
    daysRemaining: number;
    currentPeriodEnd?: string;
  } | null;
  recentActivity: Array<{
    id: string;
    treatmentId: string;
    petName: string;
    petSpecies: string;
    diagnosis: string;
    registeredByName: string;
    registeredByRole: string;
    registeredAt: string;
    logType: string;
    alarmSigns?: string;
  }>;
}

// ============================================
// Traductores clínicos adicionales
// ============================================

export function translateProcedureType(type: string): string {
  const map: Record<string, string> = {
    CASTRATION_MALE: 'Castración (Macho)',
    OVARIOHYSTERECTOMY: 'Ovariohisterectomía (OVH)',
    ORTHOPEDIC_FRACTURE: 'Cirugía Ortopédica / Fractura',
    TUMOR_RESECTION: 'Resección de Tumor',
    DENTAL: 'Profilaxis / Cirugía Dental',
    GASTROENTEROLOGY: 'Cirugía Gastrointestinal',
    OPHTHALMOLOGY: 'Cirugía Ocular',
    DERMATOLOGY: 'Cirugía de Piel / Heridas',
    GENERAL_SURGERY: 'Cirugía General',
    MEDICAL_TREATMENT: 'Tratamiento Médico',
    OTHER: 'Otro Procedimiento',
  };
  return map[type] || type;
}

export function translateControlVisitType(type: string): string {
  const map: Record<string, string> = {
    HOURS_48: 'Control 48 Horas',
    STITCH_REMOVAL: 'Retiro de Puntos',
    BANDAGE_CHANGE: 'Cambio de Vendaje',
    ULTRASOUND: 'Ecografía de Control',
    BLOOD_TEST: 'Examen de Sangre de Control',
    GENERAL_CONTROL: 'Control General',
    FINAL_DISCHARGE: 'Alta Médica Definitiva',
    OTHER: 'Otro Control',
  };
  return map[type] || type;
}

export function translateControlVisitStatus(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'Programada',
    COMPLETED: 'Realizada',
    CANCELLED: 'Cancelada',
    RESCHEDULED: 'Reprogramada',
  };
  return map[status] || status;
}