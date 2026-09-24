import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import type { Clinic, ClinicStats, ClinicMemberItem, ClinicInvitationItem } from '@/lib/utils';

export function useClinicAdmin(initialClinicId?: string) {
  const [activeClinicId, setActiveClinicId] = useState<string | null>(initialClinicId || null);

  // 1. Obtener clínicas del usuario
  const {
    data: userClinicsData,
    isLoading: clinicsLoading,
    error: clinicsError,
    mutate: mutateClinics,
  } = useSWR<any[]>('/clinics', (url: string) => api.get<any[]>(url));

  const clinics: Clinic[] = (userClinicsData || []).map((item) => item.clinic);

  // Si no hay clínica seleccionada y ya cargaron las clínicas, seleccionar la primera
  const currentClinicId =
    activeClinicId || (clinics.length > 0 ? clinics[0].id : null);

  // 2. Estadísticas en tiempo real
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    mutate: mutateStats,
  } = useSWR<ClinicStats>(
    currentClinicId ? `/clinics/${currentClinicId}/stats` : null,
    (url: string) => api.get<ClinicStats>(url),
    { refreshInterval: 15000 } // Refresco automático cada 15 segundos
  );

  // 3. Miembros del equipo
  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
    mutate: mutateMembers,
  } = useSWR<ClinicMemberItem[]>(
    currentClinicId ? `/clinics/${currentClinicId}/members` : null,
    (url: string) => api.get<ClinicMemberItem[]>(url)
  );

  // 4. Invitaciones pendientes
  const {
    data: invitations,
    isLoading: invitationsLoading,
    error: invitationsError,
    mutate: mutateInvitations,
  } = useSWR<ClinicInvitationItem[]>(
    currentClinicId ? `/clinics/${currentClinicId}/invitations` : null,
    (url: string) => api.get<ClinicInvitationItem[]>(url)
  );

  // ── Mutaciones ──

  const inviteMember = useCallback(
    async (data: { email: string; role: 'VET' | 'OWNER' | 'CLINIC_ADMIN' }) => {
      if (!currentClinicId) throw new Error('No hay clínica seleccionada');
      const res = await api.post(`/clinics/${currentClinicId}/members/invite`, data);
      await Promise.all([mutateInvitations(), mutateStats(), mutateMembers()]);
      return res;
    },
    [currentClinicId, mutateInvitations, mutateStats, mutateMembers]
  );

  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      if (!currentClinicId) throw new Error('No hay clínica seleccionada');
      const res = await api.delete(`/clinics/${currentClinicId}/invitations/${invitationId}`);
      await Promise.all([mutateInvitations(), mutateStats()]);
      return res;
    },
    [currentClinicId, mutateInvitations, mutateStats]
  );

  const updateMemberRole = useCallback(
    async (memberUserId: string, role: 'VET' | 'OWNER' | 'CLINIC_ADMIN') => {
      if (!currentClinicId) throw new Error('No hay clínica seleccionada');
      const res = await api.patch(`/clinics/${currentClinicId}/members/${memberUserId}/role`, { role });
      await Promise.all([mutateMembers(), mutateStats()]);
      return res;
    },
    [currentClinicId, mutateMembers, mutateStats]
  );

  const removeMember = useCallback(
    async (memberUserId: string) => {
      if (!currentClinicId) throw new Error('No hay clínica seleccionada');
      const res = await api.patch(`/clinics/${currentClinicId}/members/${memberUserId}/remove`, {});
      await Promise.all([mutateMembers(), mutateStats()]);
      return res;
    },
    [currentClinicId, mutateMembers, mutateStats]
  );

  const updateClinic = useCallback(
    async (data: Partial<Clinic>) => {
      if (!currentClinicId) throw new Error('No hay clínica seleccionada');
      const res = await api.patch(`/clinics/${currentClinicId}`, data);
      await Promise.all([mutateClinics(), mutateStats()]);
      return res;
    },
    [currentClinicId, mutateClinics, mutateStats]
  );

  const refreshAll = useCallback(() => {
    return Promise.all([mutateClinics(), mutateStats(), mutateMembers(), mutateInvitations()]);
  }, [mutateClinics, mutateStats, mutateMembers, mutateInvitations]);

  return {
    currentClinicId,
    setActiveClinicId,
    clinics,
    currentClinic: clinics.find((c) => c.id === currentClinicId) || null,
    stats,
    members: members || [],
    invitations: invitations || [],
    isLoading: clinicsLoading || (!!currentClinicId && statsLoading && membersLoading),
    statsLoading,
    membersLoading,
    invitationsLoading,
    error: clinicsError || statsError || membersError,
    // Acciones
    inviteMember,
    cancelInvitation,
    updateMemberRole,
    removeMember,
    updateClinic,
    refreshAll,
  };
}
