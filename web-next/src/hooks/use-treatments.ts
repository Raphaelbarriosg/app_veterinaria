import useSWR from 'swr';
import { api } from '@/lib/api-client';
import type { DashboardItem, Treatment } from '@/lib/utils';

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<DashboardItem[]>(
    '/treatments/dashboard',
    (url: string) => api.get<DashboardItem[]>(url)
  );

  return {
    items: data ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

export function useTreatmentsByPet(petId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Treatment[]>(
    petId ? `/treatments/by-pet/${petId}` : null,
    (url: string) => api.get<Treatment[]>(url)
  );

  return {
    treatments: data ?? [],
    isLoading,
    isError: !!error,
    refreshTreatments: mutate,
  };
}

export function useTreatmentById(id: string | null) {
  const { data, error, isLoading } = useSWR<Treatment>(
    id ? `/treatments/${id}` : null,
    (url: string) => api.get<Treatment>(url)
  );

  return {
    treatment: data,
    isLoading,
    isError: !!error,
  };
}

import type { MedicationLog, ControlVisit, PostOpProtocol, DischargeSheet } from '@/lib/utils';

interface MedicationLogsResponse {
  logs: MedicationLog[];
  compliance: {
    ruleId: string;
    medicineName: string;
    dosage: string;
    frequencyHours: number;
    complianceRate: number | null;
    given: number;
    late: number;
    skipped: number;
    total: number;
  }[];
}

export function useMedicationLogs(treatmentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<MedicationLogsResponse>(
    treatmentId ? `/medication-logs/treatment/${treatmentId}` : null,
    (url: string) => api.get<MedicationLogsResponse>(url)
  );

  return {
    logsData: data,
    isLoading,
    isError: !!error,
    refreshMedLogs: mutate,
  };
}

export function useControlVisits(treatmentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ControlVisit[]>(
    treatmentId ? `/control-visits/treatment/${treatmentId}` : null,
    (url: string) => api.get<ControlVisit[]>(url)
  );

  return {
    visits: data ?? [],
    isLoading,
    isError: !!error,
    refreshVisits: mutate,
  };
}

export function usePostOpProtocol(treatmentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<PostOpProtocol>(
    treatmentId ? `/post-op-protocols/treatment/${treatmentId}` : null,
    (url: string) => api.get<PostOpProtocol>(url).catch(() => null as any)
  );

  return {
    protocol: data,
    isLoading,
    isError: !!error && !error.message?.includes('no definido'),
    refreshProtocol: mutate,
  };
}

export function useDischargeSheet(treatmentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<DischargeSheet>(
    treatmentId ? `/discharge-sheets/treatment/${treatmentId}` : null,
    (url: string) => api.get<DischargeSheet>(url).catch(() => null as any)
  );

  return {
    dischargeSheet: data,
    isLoading,
    isError: !!error && !error.message?.includes('no generada'),
    refreshDischargeSheet: mutate,
  };
}