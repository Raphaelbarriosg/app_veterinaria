import 'package:flutter/material.dart';
import '../../../config/theme/app_theme.dart';
import '../data/models/daily_log_model.dart';
import 'log_image_viewer_page.dart';

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
      color: AppTheme.surfaceSlate.withValues(alpha: 0.4),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: hasAlarm ? AppTheme.alertRed.withValues(alpha: 0.5) : AppTheme.darkMetallic,
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
                        ? AppTheme.alertGreen.withValues(alpha: 0.15)
                        : AppTheme.alertRed.withValues(alpha: 0.15),
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
                      _buildIndicatorBar('Apetito', log.appetiteLevel, max: 5),
                      const SizedBox(height: 12),
                      _buildIndicatorBar('Energía', log.energyLevel, max: 5),
                      if (log.painLevel != null) ...[
                        const SizedBox(height: 12),
                        _buildIndicatorBar('Dolor', log.painLevel!, max: 10, isPain: true),
                      ],
                    ],
                  ),
                ),
                if (log.imageUrl != null) ...[
                  const SizedBox(width: 16),
                  // Imagen miniatura con apertura a pantalla completa
                  Tooltip(
                    message: 'Tocar para ver imagen completa',
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(12),
                        onTap: () {
                          LogImageViewerPage.open(context, log, 'log_image_${log.id}');
                        },
                        child: Stack(
                          children: [
                            Hero(
                              tag: 'log_image_${log.id}',
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.network(
                                  log.imageUrl!,
                                  width: 64,
                                  height: 64,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) => Container(
                                    width: 64,
                                    height: 64,
                                    color: AppTheme.darkMetallic,
                                    child: const Icon(Icons.broken_image_outlined, size: 20, color: AppTheme.textMuted),
                                  ),
                                ),
                              ),
                            ),
                            // Indicador visual de lupa/zoom
                            Positioned(
                              bottom: 3,
                              right: 3,
                              child: Container(
                                padding: const EdgeInsets.all(3),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.65),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 0.8),
                                ),
                                child: const Icon(
                                  Icons.zoom_in_rounded,
                                  color: Colors.white,
                                  size: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),

            // Temperatura
            if (log.temperature != null) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.thermostat_outlined, size: 16, color: AppTheme.textMuted),
                  const SizedBox(width: 6),
                  const Text(
                    'Temperatura: ',
                    style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  ),
                  Text(
                    '${log.temperature!.toStringAsFixed(1)}°C',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: log.temperature! >= 37.5 && log.temperature! <= 39.5
                          ? AppTheme.alertGreen : AppTheme.alertYellow,
                    ),
                  ),
                ],
              ),
            ],

            // Observaciones
            if (log.observations != null && log.observations!.trim().isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.darkMetallic.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.notes_rounded, size: 16, color: AppTheme.textMuted),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        log.observations!,
                        style: const TextStyle(color: AppTheme.textLight, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Signos de Alarma
            if (hasAlarm) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.alertRed.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.alertRed.withValues(alpha: 0.2), width: 1),
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

  Widget _buildIndicatorBar(String label, int value, {int max = 5, bool isPain = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
            Text('$value/$max', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textLight)),
          ],
        ),
        const SizedBox(height: 4),
        Row(
          children: List.generate(max, (index) {
            final active = index < value;
            Color barColor;
            if (isPain) {
              final ratio = value / max;
              barColor = ratio <= 0.3 ? AppTheme.alertGreen :
                         ratio <= 0.6 ? AppTheme.alertYellow :
                         AppTheme.alertRed;
            } else {
              barColor = AppTheme.primaryMint;
            }
            return Expanded(
              child: Container(
                height: 6,
                margin: EdgeInsets.only(right: index == max - 1 ? 0 : 4),
                decoration: BoxDecoration(
                  color: active ? barColor : AppTheme.darkMetallic,
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
