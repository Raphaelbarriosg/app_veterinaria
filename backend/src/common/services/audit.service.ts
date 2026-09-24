// ============================================
// Audit Actions — Enum de acciones auditables
// ============================================

export enum AuditAction {
  USER_REGISTER = 'USER_REGISTER',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  TREATMENT_CREATED = 'TREATMENT_CREATED',
  TREATMENT_UPDATED = 'TREATMENT_UPDATED',
  TREATMENT_COMPLETED = 'TREATMENT_COMPLETED',
  DAILY_LOG_CREATED = 'DAILY_LOG_CREATED',
  DAILY_LOG_UPDATED = 'DAILY_LOG_UPDATED',
  DAILY_LOG_ALARM = 'DAILY_LOG_ALARM',
  PET_CREATED = 'PET_CREATED',
  CLINIC_CREATED = 'CLINIC_CREATED',
  CLINIC_UPDATED = 'CLINIC_UPDATED',
  MEMBER_INVITED = 'MEMBER_INVITED',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',
  USER_LOGOUT = 'USER_LOGOUT',
}


// ============================================
// Audit Log Interface
// ============================================

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ip?: string;
}

// ============================================
// Audit Service — Logging asíncrono de acciones
// ============================================

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  /**
   * Registra una acción de auditoría de forma asíncrona (non-blocking).
   * En producción, esto debería escribir a una tabla de audit_logs
   * o enviar a un servicio externo (ELK, Datadog, etc.)
   */
  async logAsync(entry: AuditLogEntry): Promise<void> {
    // Non-blocking: no esperamos la resolución
    this.log(entry);
  }

  /**
   * Registra una acción de auditoría de forma síncrona.
   */
  log(entry: AuditLogEntry): void {
    const { action, userId, resourceType, resourceId, details } = entry;

    this.logger.log(
      `${action} | user=${userId || 'anonymous'} | ` +
      `${resourceType || ''}:${resourceId || ''} | ` +
      `${details ? JSON.stringify(details) : ''}`,
    );

    // TODO: En producción, persistir en tabla AuditLog o enviar a servicio externo
  }
}
