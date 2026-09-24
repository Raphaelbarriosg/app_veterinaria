import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`MailService configurado con servidor SMTP: ${host}:${port}`);
    } else {
      this.logger.log('SMTP no configurado. MailService operará en modo Dry-Run (registro en consola).');
    }
  }

  async sendClinicInvitation(email: string, clinicName: string, inviteToken: string): Promise<boolean> {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const inviteUrl = `${appUrl}/accept-invitation?token=${inviteToken}`;
    const subject = `Invitación para unirte a la clínica ${clinicName} — VetCare`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0d9488;">VetCare SaaS</h2>
        <h3>Invitación a Clínica Veterinaria</h3>
        <p>Has sido invitado(a) a formar parte del equipo de <strong>${clinicName}</strong>.</p>
        <p>Haz clic en el siguiente botón para aceptar la invitación:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Aceptar Invitación</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
        <p style="color: #64748b; font-size: 12px; word-break: break-all;">${inviteUrl}</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"VetCare SaaS" <noreply@vetcare.app>',
          to: email,
          subject,
          html: htmlContent,
        });
        this.logger.log(`Correo de invitación enviado exitosamente a ${email}`);
        return true;
      } catch (error) {
        this.logger.error(`Error enviando correo a ${email}:`, error);
        return false;
      }
    } else {
      this.logger.log(`[DRY-RUN MAIL] Destinatario: ${email} | Asunto: ${subject}`);
      this.logger.log(`[DRY-RUN MAIL] URL Invitación: ${inviteUrl}`);
      return true;
    }
  }

  async sendControlVisitReminder(email: string, ownerName: string, petName: string, visitType: string, scheduledAt: Date): Promise<boolean> {
    const subject = `Recordatorio de Cita de Control para ${petName} — VetCare`;
    const dateFormatted = new Date(scheduledAt).toLocaleString('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0d9488;">VetCare SaaS</h2>
        <h3>Recordatorio de Control Médico</h3>
        <p>Hola <strong>${ownerName}</strong>,</p>
        <p>Te recordamos que tu mascota <strong>${petName}</strong> tiene una cita de control post-operatoria programada.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #0d9488; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Tipo de Control:</strong> ${visitType}</p>
          <p style="margin: 5px 0;"><strong>Fecha y Hora:</strong> ${dateFormatted}</p>
        </div>
        <p>Por favor, asiste puntualmente. Si necesitas reprogramar, comunícate con la clínica.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"VetCare SaaS" <noreply@vetcare.app>',
          to: email,
          subject,
          html: htmlContent,
        });
        return true;
      } catch (error) {
        this.logger.error(`Error enviando recordatorio de control a ${email}:`, error);
        return false;
      }
    } else {
      this.logger.log(`[DRY-RUN MAIL] Recordatorio de control a ${email} para ${petName} el ${dateFormatted}`);
      return true;
    }
  }

  async sendAlertToVet(vetEmail: string, vetName: string, petName: string, ownerName: string, alarmSigns: string, treatmentId: string): Promise<boolean> {
    const subject = `[ALERTA DE ALARMA CRÍTICA] ${petName} — VetCare`;
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const detailUrl = `${appUrl}/vet/pets/${treatmentId}`; // O el dashboard de veterinario

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ef4444; border-radius: 8px;">
        <h2 style="color: #ef4444;">🚨 ALERTA CRÍTICA POST-OPERATORIA</h2>
        <p>Hola Dr(a). <strong>${vetName}</strong>,</p>
        <p>Se ha registrado un reporte con **Signos de Alarma** para el paciente <strong>${petName}</strong>, de su propietario <strong>${ownerName}</strong>.</p>
        <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
          <p style="margin: 5px 0; color: #ef4444;"><strong>Signos de Alarma Reportados:</strong></p>
          <p style="margin: 5px 0; font-style: italic;">"${alarmSigns}"</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${detailUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Revisar Ficha Médica</a>
        </div>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"VetCare SaaS" <noreply@vetcare.app>',
          to: vetEmail,
          subject,
          html: htmlContent,
        });
        return true;
      } catch (error) {
        this.logger.error(`Error enviando email de alerta al VET ${vetEmail}:`, error);
        return false;
      }
    } else {
      this.logger.log(`[DRY-RUN MAIL] Alerta de alarma al vet ${vetEmail} para ${petName}. Signos: ${alarmSigns}`);
      return true;
    }
  }
}

