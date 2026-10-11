'use client';

import React from 'react';
import {
  Printer,
  ShieldCheck,
  AlertTriangle,
  Phone,
  Pill,
  Heart,
  Activity,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { translateProcedureType, formatDateString } from '@/lib/utils';
import type { Treatment, PostOpProtocol, DischargeSheet } from '@/lib/utils';

interface HomeCarePlanProps {
  treatment: Treatment;
  protocol?: PostOpProtocol | null;
  dischargeSheet?: DischargeSheet | null;
  petName: string;
  species?: string;
  breed?: string;
  ownerName?: string;
  isVetView?: boolean;
  onEditProtocol?: () => void;
  onEditDischarge?: () => void;
}

export function HomeCarePlan({
  treatment,
  protocol,
  dischargeSheet,
  petName,
  species,
  breed,
  ownerName,
  isVetView = false,
  onEditProtocol,
  onEditDischarge,
}: HomeCarePlanProps) {
  const handlePrint = () => {
    window.print();
  };

  // Helper para extraer o deducir texto clave de reposo
  const getRestInstruction = (): string => {
    if (dischargeSheet?.restrictions && dischargeSheet.restrictions.trim()) {
      return dischargeSheet.restrictions;
    }
    if (protocol?.restrictions && protocol.restrictions.length > 0) {
      // Buscar la restricción de reposo o devolver la primera
      const rest = protocol.restrictions.find(r =>
        r.toLowerCase().includes('reposo') || r.toLowerCase().includes('saltar') || r.toLowerCase().includes('correr')
      );
      if (rest) return rest;
      return protocol.restrictions.join('. ');
    }
    return `Evitar que ${petName} salte, corra o realice movimientos bruscos durante los próximos 7 días para proteger la sutura.`;
  };

  // Helper para extraer o deducir indicación de protección (collar isabelino / body)
  const getProtectionInstruction = (): string => {
    if (protocol?.restrictions) {
      const prot = protocol.restrictions.find(r =>
        r.toLowerCase().includes('collar') || r.toLowerCase().includes('isabelino') || r.toLowerCase().includes('body')
      );
      if (prot) return prot;
    }
    return 'Uso obligatorio de collar isabelino o body quirúrgico las 24 horas del día para evitar el lamido o mordedura de la herida.';
  };

  // Helper para medicamentos
  const getMedicationsList = () => {
    if (dischargeSheet?.medications && Array.isArray(dischargeSheet.medications) && dischargeSheet.medications.length > 0) {
      return dischargeSheet.medications.map(m => ({
        name: m.name,
        dosage: m.dosage,
        schedule: m.schedule,
        duration: m.duration,
      }));
    }
    if (treatment.rules && treatment.rules.length > 0) {
      return treatment.rules.map(r => ({
        name: r.medicineName,
        dosage: r.dosage,
        schedule: `Cada ${r.frequencyHours} horas`,
        duration: 'Según pauta médica',
      }));
    }
    return [];
  };

  // Helper para alimentación
  const getFeedingInstruction = (): string => {
    if (dischargeSheet?.feedingNotes && dischargeSheet.feedingNotes.trim()) {
      return dischargeSheet.feedingNotes;
    }
    if (protocol?.specialCare) {
      const feed = protocol.specialCare.find(c =>
        c.toLowerCase().includes('comida') || c.toLowerCase().includes('alimento') || c.toLowerCase().includes('agua')
      );
      if (feed) return feed;
    }
    return 'Ofrecer agua fresca a libre disposición y comida blanda o humedecida en porciones pequeñas durante las primeras 48 horas.';
  };

  // Helper para curaciones o cuidados especiales
  const getSpecialCareInstruction = (): string => {
    if (protocol?.specialCare && protocol.specialCare.length > 0) {
      const care = protocol.specialCare.find(c =>
        !c.toLowerCase().includes('comida') && !c.toLowerCase().includes('alimento')
      );
      if (care) return care;
      return protocol.specialCare.join('. ');
    }
    return 'Mantener la herida quirúrgica limpia y seca. Limpieza diaria suave con gasa y suero fisiológico. No bañar hasta retirar puntos.';
  };

  const emergencyPhone = protocol?.emergencyCall || '+56 9 8765 4321';
  const medications = getMedicationsList();
  const restText = getRestInstruction();
  const protectionText = getProtectionInstruction();
  const feedingText = getFeedingInstruction();
  const specialCareText = getSpecialCareInstruction();

  return (
    <div className="home-care-plan-container">
      {/* Botón de Imprimir y Encabezado de la Tarjeta en Pantalla */}
      <div
        className="glass-card"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Encabezado Superior */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3
                style={{
                  fontSize: '1.35rem',
                  fontWeight: '800',
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Plan de Cuidados en Casa
              </h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px', marginLeft: '44px' }}>
              Indicaciones esenciales emitidas por el médico veterinario para la recuperación de <strong>{petName}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: '#cbd5e1',
                color: '#334155',
                fontWeight: '600',
              }}
              id="btn-print-care-plan"
            >
              <Printer className="w-4 h-4" />
              Imprimir Récipe / Guardar PDF
            </Button>
            {isVetView && (
              <div style={{ display: 'flex', gap: '6px' }}>
                {onEditProtocol && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onEditProtocol}
                    style={{ color: '#0d9488', borderColor: '#99f6e4' }}
                  >
                    Editar Protocolo
                  </Button>
                )}
                {onEditDischarge && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={onEditDischarge}
                    style={{ background: '#10b981', color: '#ffffff' }}
                  >
                    Editar Récipe / Alta
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resumen Clínico / Diagnóstico */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '0.85rem' }}>
            <span style={{ color: '#64748b' }}>Diagnóstico / Procedimiento: </span>
            <strong style={{ color: '#0f172a' }}>{treatment.diagnosis}</strong>
            <span
              style={{
                marginLeft: '8px',
                background: '#e2e8f0',
                color: '#334155',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
              }}
            >
              {translateProcedureType(treatment.procedureType)}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Fecha de inicio: <strong>{formatDateString(treatment.startDate)}</strong>
          </div>
        </div>

        {/* ======================================================== */}
        {/* LISTA DE INDICACIONES CLAVE (ESTÉTICA IDÉNTICA A LA IMAGEN) */}
        {/* ======================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          {/* Viñeta 1: Reposo absoluto */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.95rem', lineHeight: '1.5' }}>
            <span style={{ color: '#0f172a', fontSize: '1.2rem', lineHeight: '1' }}>•</span>
            <div>
              <strong style={{ color: '#0f172a' }}>Reposo absoluto: </strong>
              <span style={{ color: '#334155' }}>{restText}</span>
            </div>
          </div>

          {/* Viñeta 2: Protección */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.95rem', lineHeight: '1.5' }}>
            <span style={{ color: '#0f172a', fontSize: '1.2rem', lineHeight: '1' }}>•</span>
            <div>
              <strong style={{ color: '#0f172a' }}>Protección: </strong>
              <span style={{ color: '#334155' }}>{protectionText}</span>
            </div>
          </div>

          {/* Viñeta 3: Medicamento */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.95rem', lineHeight: '1.5' }}>
            <span style={{ color: '#0f172a', fontSize: '1.2rem', lineHeight: '1' }}>•</span>
            <div style={{ width: '100%' }}>
              <strong style={{ color: '#0f172a' }}>Medicamento: </strong>
              <span style={{ color: '#334155' }}>
                Administrar la medicación recetada según los horarios indicados, idealmente acompañada con alimento para evitar molestias gástricas.
              </span>

              {/* Tabla / Tarjeta de Medicinas Recetadas si existen */}
              {medications.length > 0 && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginTop: '10px',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#166534', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Pill className="w-4 h-4 text-emerald-600" />
                    Medicamentos Recetados en el Récipe:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {medications.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          background: '#ffffff',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #dcfce7',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div>
                          <strong style={{ color: '#14532d' }}>{m.name}</strong>
                          <span style={{ color: '#475569', marginLeft: '6px', fontSize: '0.8rem' }}>({m.dosage})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: '#15803d', fontWeight: '600' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock className="w-3.5 h-3.5" /> {m.schedule}
                          </span>
                          {m.duration && (
                            <span style={{ background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                              {m.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Viñeta 4: Alimentación */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.95rem', lineHeight: '1.5' }}>
            <span style={{ color: '#0f172a', fontSize: '1.2rem', lineHeight: '1' }}>•</span>
            <div>
              <strong style={{ color: '#0f172a' }}>Alimentación: </strong>
              <span style={{ color: '#334155' }}>{feedingText}</span>
            </div>
          </div>

          {/* Viñeta 5: Curaciones y Cuidados Especiales */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.95rem', lineHeight: '1.5' }}>
            <span style={{ color: '#0f172a', fontSize: '1.2rem', lineHeight: '1' }}>•</span>
            <div>
              <strong style={{ color: '#0f172a' }}>Cuidados de la herida: </strong>
              <span style={{ color: '#334155' }}>{specialCareText}</span>
            </div>
          </div>
        </div>

        {/* Sección de Signos de Alarma y Contacto de Urgencias */}
        <div
          style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9f1239', fontWeight: 'bold', fontSize: '0.9rem' }}>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Signos de Alarma — Acude a la clínica de inmediato si notas:
            </div>
            {emergencyPhone && (
              <a
                href={`tel:${emergencyPhone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#e11d48',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                }}
              >
                <Phone className="w-3.5 h-3.5" />
                Llamar Urgencias: {emergencyPhone}
              </a>
            )}
          </div>

          <div style={{ fontSize: '0.8rem', color: '#881337', paddingLeft: '24px' }}>
            {protocol?.alarmSigns && protocol.alarmSigns.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'disc', paddingLeft: '14px' }}>
                {protocol.alarmSigns.map((s, idx) => (
                  <li key={idx} style={{ marginBottom: '3px' }}>
                    <strong>{s.sign}:</strong> {s.description || 'Consultar con la veterinaria inmediatamente.'}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0 }}>
                Sangrado continuo o secreción con mal olor en la incisión, fiebre alta, vómitos repetidos, dificultad respiratoria o decaimiento extremo que le impida ponerse en pie.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA LIMPIA PARA IMPRESIÓN (PRINT ONLY STYLES) */}
      {/* ======================================================== */}
      <div className="print-only" style={{ display: 'none' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .home-care-plan-container,
            .print-only,
            .print-only * {
              visibility: visible !important;
            }
            .print-only {
              display: block !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 24px 32px;
              color: #000000;
              background: #ffffff;
              font-family: Arial, sans-serif;
            }
            .glass-card {
              display: none !important;
            }
          }
        ` }} />

        {/* Membrete Oficial del Récipe */}
        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#0f172a' }}>VetCare SaaS — Clínica Veterinaria</h1>
            <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>Atención Veterinaria Especializada y Seguimiento Post-Operatorio</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#0d9488' }}>RÉCIPE E INDICACIONES</h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Fecha: {new Date().toLocaleDateString('es-ES')}</p>
          </div>
        </div>

        {/* Ficha Paciente y Tutor */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '20px', fontSize: '13px' }}>
          <div>
            <p style={{ margin: '2px 0' }}><strong>Paciente:</strong> {petName}</p>
            {species && <p style={{ margin: '2px 0' }}><strong>Especie / Raza:</strong> {species} {breed ? `• ${breed}` : ''}</p>}
          </div>
          <div>
            {ownerName && <p style={{ margin: '2px 0' }}><strong>Tutor / Dueño:</strong> {ownerName}</p>}
            <p style={{ margin: '2px 0' }}><strong>Procedimiento:</strong> {translateProcedureType(treatment.procedureType)}</p>
          </div>
        </div>

        {/* Prescripción Médica (Rp.) */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #94a3b8', paddingBottom: '4px', marginBottom: '12px' }}>
            Rp. Medicamentos y Posología
          </h3>
          {medications.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Medicamento</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Dosis</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Frecuencia / Horario</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Duración</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((m, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{m.name}</td>
                    <td style={{ padding: '6px 8px' }}>{m.dosage}</td>
                    <td style={{ padding: '6px 8px' }}>{m.schedule}</td>
                    <td style={{ padding: '6px 8px' }}>{m.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Sin medicamentos adicionales prescritos.</p>
          )}
        </div>

        {/* Plan de Cuidados en Casa */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #94a3b8', paddingBottom: '4px', marginBottom: '12px' }}>
            Plan de Cuidados en Casa
          </h3>
          <ul style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, paddingLeft: '18px' }}>
            <li style={{ marginBottom: '6px' }}><strong>Reposo absoluto:</strong> {restText}</li>
            <li style={{ marginBottom: '6px' }}><strong>Protección:</strong> {protectionText}</li>
            <li style={{ marginBottom: '6px' }}><strong>Medicamento:</strong> Administrar con alimento según la pauta arriba indicada.</li>
            <li style={{ marginBottom: '6px' }}><strong>Alimentación:</strong> {feedingText}</li>
            <li style={{ marginBottom: '6px' }}><strong>Cuidados de herida:</strong> {specialCareText}</li>
          </ul>
        </div>

        {/* Alerta de urgencias */}
        <div style={{ border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', marginBottom: '40px' }}>
          <strong>Signos de alarma y urgencias:</strong> Ante sangrado activo, fiebre, vómitos o decaimiento severo, comunicarse de inmediato al teléfono <strong>{emergencyPhone}</strong>.
        </div>

        {/* Firma del Veterinario */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
          <div style={{ textAlign: 'center', width: '220px', borderTop: '1px solid #000000', paddingTop: '8px' }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 2px 0' }}>Médico Veterinario</p>
            <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>Firma y Sello Profesional</p>
          </div>
        </div>
      </div>
    </div>
  );
}
