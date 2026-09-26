import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/theme/app_theme.dart';
import '../bloc/pets_bloc.dart';
import '../bloc/pets_event.dart';
import '../bloc/pets_state.dart';

class PetDetailPage extends StatefulWidget {
  final String petId;

  const PetDetailPage({super.key, required this.petId});

  @override
  State<PetDetailPage> createState() => _PetDetailPageState();
}


class _PetDetailPageState extends State<PetDetailPage> {
  @override
  void initState() {
    super.initState();
    context.read<PetsBloc>().add(LoadPetDetail(widget.petId));
  }

  void _confirmDelete() {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          title: const Text('¿Eliminar Mascota?'),
          content: const Text(
            'Esta acción no se puede deshacer. Se eliminarán permanentemente todos los registros y tratamientos asociados.',
          ),
          actions: [
            TextButton(
              child: const Text('Cancelar', style: TextStyle(color: AppTheme.textMuted)),
              onPressed: () => Navigator.of(dialogContext).pop(),
            ),
            TextButton(
              child: const Text('Eliminar', style: TextStyle(color: AppTheme.alertRed)),
              onPressed: () {
                Navigator.of(dialogContext).pop();
                context.read<PetsBloc>().add(DeletePetRequested(widget.petId));
              },
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: AppTheme.primaryMint),
            onPressed: () {
              final state = context.read<PetsBloc>().state;
              if (state is PetDetailLoaded) {
                Navigator.of(context).pushNamed(
                  '/pet-form',
                  arguments: state.pet,
                ).then((_) {
                  if (!context.mounted) return;
                  context.read<PetsBloc>().add(LoadPetDetail(widget.petId));
                });
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded, color: AppTheme.alertRed),
            onPressed: _confirmDelete,
          ),
        ],
      ),
      body: BlocConsumer<PetsBloc, PetsState>(
        listener: (context, state) {
          if (state is PetsOperationSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppTheme.alertGreen),
            );
            Navigator.of(context).pop();
          } else if (state is PetsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppTheme.alertRed),
            );
          }
        },
        builder: (context, state) {
          if (state is PetsLoading) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.primaryMint));
          } else if (state is PetDetailLoaded) {
            final pet = state.pet;
            final treatments = pet.treatments ?? [];
            final activeTreatment = treatments.firstWhere(
              (t) => t['status'] == 'ACTIVE',
              orElse: () => null,
            );

            return SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Encabezado Ficha Mascota
                  Center(
                    child: Column(
                      children: [
                        Container(
                          width: 90,
                          height: 90,
                          decoration: BoxDecoration(
                            color: AppTheme.primaryMint.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.primaryMint.withValues(alpha: 0.3), width: 2),
                          ),
                          child: Center(
                            child: Text(
                              pet.name[0].toUpperCase(),
                              style: const TextStyle(
                                color: AppTheme.primaryMint,
                                fontSize: 36,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(pet.name, style: Theme.of(context).textTheme.headlineLarge),
                        const SizedBox(height: 4),
                        Text(
                          '${pet.speciesDisplay} ${pet.breed != null ? "• ${pet.breed}" : ""}',
                          style: const TextStyle(color: AppTheme.textMuted, fontSize: 16),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Ficha de Datos Técnicos
                  const Text(
                    'Información General',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textLight),
                  ),
                  const SizedBox(height: 12),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          _buildInfoRow(Icons.calendar_today_outlined, 'Edad', pet.ageString),
                          const Divider(color: AppTheme.darkMetallic, height: 24),
                          _buildInfoRow(
                            Icons.monitor_weight_outlined,
                            'Peso',
                            pet.weight != null ? '${pet.weight} kg' : 'No registrado',
                          ),
                          if (pet.birthDate != null) ...[
                            const Divider(color: AppTheme.darkMetallic, height: 24),
                            _buildInfoRow(
                              Icons.cake_outlined,
                              'Fecha de Nacimiento',
                              '${pet.birthDate!.day}/${pet.birthDate!.month}/${pet.birthDate!.year}',
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Sección de Tratamiento
                  const Text(
                    'Tratamiento Activo',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textLight),
                  ),
                  const SizedBox(height: 12),

                  if (activeTreatment != null) ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.healing_rounded, color: AppTheme.alertYellow),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    activeTreatment['diagnosis']?.toString() ?? 'Tratamiento Activo',
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Iniciado el: ${_formatIsoDate(activeTreatment['startDate']?.toString())}',
                              style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryMint,
                                minimumSize: const Size.fromHeight(50),
                              ),
                              onPressed: () {
                                Navigator.of(context).pushNamed(
                                  '/daily-log-form',
                                  arguments: activeTreatment['id']?.toString() ?? '',
                                ).then((_) {
                                  if (!context.mounted) return;
                                  context.read<PetsBloc>().add(LoadPetDetail(widget.petId));
                                });
                              },
                              icon: const Icon(Icons.add_task_rounded),
                              label: const Text('Registrar Evolución Diaria'),
                            ),
                            const SizedBox(height: 12),
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
                                  arguments: activeTreatment['id']?.toString() ?? '',
                                );
                              },
                              icon: const Icon(Icons.history_rounded),
                              label: const Text('Ver Historial de Reportes'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ] else ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Center(
                          child: Column(
                            children: [
                              Icon(
                                Icons.favorite_border_rounded,
                                size: 40,
                                color: AppTheme.textMuted.withValues(alpha: 0.5),
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                'Sin tratamiento activo',
                                style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Tu veterinario asignará tratamientos aquí en caso de cirugías.',
                                style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          } else if (state is PetsError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline_rounded, color: AppTheme.alertRed, size: 48),
                  const SizedBox(height: 16),
                  Text(state.message, style: const TextStyle(color: AppTheme.textLight)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.read<PetsBloc>().add(LoadPetDetail(widget.petId)),
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

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.textMuted, size: 20),
        const SizedBox(width: 12),
        Text(label, style: const TextStyle(color: AppTheme.textMuted)),
        const Spacer(),
        Text(
          value,
          style: const TextStyle(color: AppTheme.textLight, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  String _formatIsoDate(String? isoString) {
    if (isoString == null || isoString.isEmpty) return 'N/A';
    final parsed = DateTime.tryParse(isoString);
    if (parsed == null) return 'N/A';
    return '${parsed.day.toString().padLeft(2, '0')}/${parsed.month.toString().padLeft(2, '0')}/${parsed.year}';
  }
}
