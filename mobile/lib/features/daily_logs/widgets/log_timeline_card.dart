import 'package:flutter/material.dart';
import '../../../config/theme/app_theme.dart';
import '../data/models/daily_log_model.dart';

class LogTimelineCard extends StatelessWidget {
  final DailyLogModel log;

  const LogTimelineCard({
    super.key,
    required this.log,
  });

  @override
  Widget build(BuildContext context) {
    final hasAlarm = log.alarmSigns != null && log.alarmSigns!.trim().isNotEmpty;
    final dateStr = '${log.registeredAt.day}/${log.registeredAt.month}/${log.registeredAt.year}';
    final timeStr = '${log.registeredAt.hour.toString().padLeft(2, '0')}:${log.registeredAt.minute.toString().padLeft(2, '0')}';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      color: AppTheme.surfaceSlate.withOpacity(0.4),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: hasAlarm ? AppTheme.alertRed.withOpacity(0.5) : AppTheme.darkMetallic,
          width: 1.5,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Fila superior: Fecha, hora y check de medicina
            Row(
              children: [
                const Icon(Icons.calendar_today_outlined, size: 14, color: AppTheme.textMuted),
                const SizedBox(width: 6),
                Text(
                  '$dateStr a las $timeStr',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textLight),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: log.medicineTaken
                        ? AppTheme.alertGreen.withOpacity(0.15)
                        : AppTheme.alertRed.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        log.medicineTaken ? Icons.check_circle_outline_rounded : Icons.cancel_outlined,
                        size: 12,
                        color: log.medicineTaken ? AppTheme.alertGreen : AppTheme.alertRed,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        log.medicineTaken ? 'Medicamento OK' : 'No tomado',
                        style: TextStyle(
                          color: log.medicineTaken ? AppTheme.alertGreen : AppTheme.alertRed,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(color: AppTheme.darkMetallic, height: 24),

            // Contenido: Indicadores
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildIndicatorBar('Apetito', log.appetiteLevel),
                      const SizedBox(height: 12),
                      _buildIndicatorBar('Energía', log.energyLevel),
                    ],
                  ),
                ),
                if (log.imageUrl != null) ...[
                  const SizedBox(width: 16),
                  // Imagen miniatura
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      log.imageUrl!,
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        width: 60,
                        height: 60,
                        color: AppTheme.darkMetallic,
                        child: const Icon(Icons.broken_image_outlined, size: 20, color: AppTheme.textMuted),
                      ),
                    ),
                  ),
                ],
              ],
            ),

            // Signos de Alarma
            if (hasAlarm) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.alertRed.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.alertRed.withOpacity(0.2), width: 1),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: AppTheme.alertRed, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Síntomas de Alarma Reportados:',
                            style: TextStyle(color: AppTheme.alertRed, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            log.alarmSigns!,
                            style: const TextStyle(color: AppTheme.textLight, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildIndicatorBar(String label, int value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
            Text('$value/5', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textLight)),
          ],
        ),
        const SizedBox(height: 4),
        Row(
          children: List.generate(5, (index) {
            final active = index < value;
            return Expanded(
              child: Container(
                height: 6,
                margin: EdgeInsets.only(right: index == 4 ? 0 : 4),
                decoration: BoxDecoration(
                  color: active ? AppTheme.primaryMint : AppTheme.darkMetallic,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }
}
