import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../config/theme/app_theme.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../bloc/treatments_bloc.dart';
import '../bloc/treatments_event.dart';
import '../bloc/treatments_state.dart';

class TreatmentDetailPage extends StatefulWidget {
  final String treatmentId;

  const TreatmentDetailPage({super.key, required this.treatmentId});

  @override
  State<TreatmentDetailPage> createState() => _TreatmentDetailPageState();
}

class _TreatmentDetailPageState extends State<TreatmentDetailPage> {
  @override
  void initState() {
    super.initState();
    context.read<TreatmentsBloc>().add(LoadTreatmentDetail(widget.treatmentId));
  }

  void _confirmFinishTreatment() {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          title: const Text('¿Finalizar Tratamiento?'),
          content: const Text(
            'Esta acción marcará el tratamiento como completado. El dueño ya no podrá registrar reportes diarios.',
          ),
          actions: [
            TextButton(
              child: const Text('Cancelar', style: TextStyle(color: AppTheme.textMuted)),
              onPressed: () => Navigator.of(dialogContext).pop(),
            ),
            TextButton(
              child: const Text('Confirmar', style: TextStyle(color: AppTheme.alertGreen)),
              onPressed: () {
                Navigator.of(dialogContext).pop();
                context.read<TreatmentsBloc>().add(
                  UpdateTreatmentRequested(
                    id: widget.treatmentId,
                    status: 'COMPLETED',
                    endDate: DateTime.now(),
                  ),
                );
              },
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Verificar si el usuario es veterinario para mostrar controles
    final authState = context.read<AuthBloc>().state;
    final isVet = authState is Authenticated && authState.user.role == 'VET';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalle de Tratamiento', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: BlocConsumer<TreatmentsBloc, TreatmentsState>(
        listener: (context, state) {
          if (state is TreatmentOperationSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppTheme.alertGreen),
            );
            context.read<TreatmentsBloc>().add(LoadTreatmentDetail(widget.treatmentId));
          } else if (state is TreatmentsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppTheme.alertRed),
            );
          }
        },
        builder: (context, state) {
          if (state is TreatmentsLoading) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.primaryMint));
          } else if (state is TreatmentDetailLoaded) {
            final t = state.treatment;
            final isCompleted = t.status == 'COMPLETED';

            return SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Diagnóstico Cabecera
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  t.pet?.name ?? 'Mascota',
                                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontSize: 24),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Diagnóstico: ${t.diagnosis}',
                                  style: const TextStyle(color: AppTheme.textLight, fontSize: 15, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Inicio: ${_formatDate(t.startDate)} ${t.endDate != null ? "• Fin: ${_formatDate(t.endDate!)}" : ""}',
                                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: isCompleted
                                  ? AppTheme.alertGreen.withOpacity(0.15)
                                  : AppTheme.primaryMint.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isCompleted ? AppTheme.alertGreen : AppTheme.primaryMint,
                                width: 1,
                              ),
                            ),
                            child: Text(
                              isCompleted ? 'Finalizado' : 'Activo',
                              style: TextStyle(
                                color: isCompleted ? AppTheme.alertGreen : AppTheme.primaryMint,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Reglas de Dosificación
                  const Text(
                    'Reglas de Dosificación',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textLight),
                  ),
                  const SizedBox(height: 12),
                  ...t.rules.map((rule) {
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      color: AppTheme.darkMetallic.withOpacity(0.3),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          children: [
                            const Icon(Icons.medication_rounded, color: AppTheme.primaryMint),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    rule.medicineName,
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textLight),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Dosis: ${rule.dosage} • Frecuencia: cada ${rule.frequencyHours} horas',
                                    style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                            if (rule.requirePhoto)
                              const Tooltip(
                                message: 'Requiere foto de confirmación',
                                child: Icon(Icons.camera_alt_outlined, color: AppTheme.primaryMint, size: 20),
                              ),
                          ],
                        ),
                      ),
                    );
                  }),
                  
                  const SizedBox(height: 32),

                  // Botón Finalizar Tratamiento (solo VET y si está activo)
                  if (isVet && !isCompleted) ...[
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.alertGreen,
                        foregroundColor: AppTheme.backgroundCharcoal,
                        minimumSize: const Size.fromHeight(50),
                      ),
                      onPressed: _confirmFinishTreatment,
                      icon: const Icon(Icons.check_circle_rounded),
                      label: const Text('Finalizar Tratamiento'),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Acciones del dueño
                  if (!isVet) ...[
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppTheme.primaryMint),
                        foregroundColor: AppTheme.primaryMint,
                        minimumSize: const Size.fromHeight(50),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        Navigator.of(context).pushNamed(
                          '/daily-logs-history',
                          arguments: t.id,
                        );
                      },
                      icon: const Icon(Icons.history_rounded),
                      label: const Text('Ver Historial de Evolución'),
                    ),
                  ] else ...[
                    // El veterinario también puede ver el historial de evolución
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppTheme.primaryMint),
                        foregroundColor: AppTheme.primaryMint,
                        minimumSize: const Size.fromHeight(50),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        Navigator.of(context).pushNamed(
                          '/daily-logs-history',
                          arguments: t.id,
                        );
                      },
                      icon: const Icon(Icons.analytics_outlined),
                      label: const Text('Ver Evolución del Paciente'),
                    ),
                  ],
                ],
              ),
            );
          } else if (state is TreatmentsError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline_rounded, color: AppTheme.alertRed, size: 48),
                  const SizedBox(height: 16),
                  Text(state.message, style: const TextStyle(color: AppTheme.textLight)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.read<TreatmentsBloc>().add(LoadTreatmentDetail(widget.treatmentId)),
                    child: const Text('Reintentar'),
                  ),
                ],
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
