import 'package:flutter/material.dart';
import '../../../config/theme/app_theme.dart';
import '../data/repositories/treatments_repository.dart';
import 'semaphore_indicator.dart';

class TreatmentCard extends StatelessWidget {
  final DashboardItemModel item;
  final VoidCallback onTap;

  const TreatmentCard({
    super.key,
    required this.item,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final pet = item.pet;
    final stats = item.stats;
    
    Color cardBorderColor;
    switch (item.priority) {
      case 'RED':
        cardBorderColor = AppTheme.alertRed.withOpacity(0.3);
        break;
      case 'YELLOW':
        cardBorderColor = AppTheme.alertYellow.withOpacity(0.3);
        break;
      case 'GREEN':
      default:
        cardBorderColor = AppTheme.alertGreen.withOpacity(0.3);
        break;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: cardBorderColor, width: 1.5),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Fila superior: Mascota y Semáforo
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryMint.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        pet.name[0].toUpperCase(),
                        style: const TextStyle(
                          color: AppTheme.primaryMint,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          pet.name,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textLight,
                          ),
                        ),
                        Text(
                          '${pet.species} ${pet.breed != null ? "• ${pet.breed}" : ""}',
                          style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  SemaphoreIndicator(priority: item.priority, size: 16),
                ],
              ),
              const Divider(color: AppTheme.darkMetallic, height: 24),
              // Diagnóstico
              const Text(
                'Diagnóstico:',
                style: TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 2),
              Text(
                item.diagnosis,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.textLight,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 16),
              // Estadísticas rápidas
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Dosis cumplidas
                  Row(
                    children: [
                      const Icon(Icons.medication_liquid_outlined, size: 16, color: AppTheme.textMuted),
                      const SizedBox(width: 4),
                      Text(
                        'Dosis: ${stats.actualDoses}/${stats.expectedDoses}',
                        style: const TextStyle(fontSize: 12, color: AppTheme.textLight),
                      ),
                    ],
                  ),
                  // Señales de alarma
                  if (stats.hasAlarmSigns)
                    const Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, size: 16, color: AppTheme.alertRed),
                        SizedBox(width: 4),
                        Text(
                          'Sint. Alarma',
                          style: TextStyle(fontSize: 12, color: AppTheme.alertRed, fontWeight: FontWeight.bold),
                        ),
                      ],
                    )
                  else if (stats.logsCount24h == 0)
                    const Row(
                      children: [
                        Icon(Icons.history_toggle_off_rounded, size: 16, color: AppTheme.alertRed),
                        SizedBox(width: 4),
                        Text(
                          'Sin reportes',
                          style: TextStyle(fontSize: 12, color: AppTheme.alertRed, fontWeight: FontWeight.bold),
                        ),
                      ],
                    )
                  else
                    Row(
                      children: [
                        const Icon(Icons.check_circle_outline_rounded, size: 16, color: AppTheme.alertGreen),
                        const SizedBox(width: 4),
                        Text(
                          'Estable (${stats.logsCount24h} rep)',
                          style: const TextStyle(fontSize: 12, color: AppTheme.alertGreen),
                        ),
                      ],
                    ),
                ],
              ),
              // Dueño
              if (pet.owner != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.person_outline_rounded, size: 14, color: AppTheme.textMuted),
                    const SizedBox(width: 4),
                    Text(
                      'Dueño: ${pet.owner!.name}',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                    if (pet.owner!.phone != null) ...[
                      const Spacer(),
                      const Icon(Icons.phone_outlined, size: 14, color: AppTheme.textMuted),
                      const SizedBox(width: 4),
                      Text(
                        pet.owner!.phone!,
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                    ],
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
