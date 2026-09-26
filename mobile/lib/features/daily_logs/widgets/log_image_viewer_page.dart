import 'package:flutter/material.dart';
import '../../../config/theme/app_theme.dart';
import '../data/models/daily_log_model.dart';

class LogImageViewerPage extends StatefulWidget {
  final DailyLogModel log;
  final String heroTag;

  const LogImageViewerPage({
    super.key,
    required this.log,
    required this.heroTag,
  });

  static void open(BuildContext context, DailyLogModel log, String heroTag) {
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierDismissible: true,
        barrierColor: Colors.black.withValues(alpha: 0.92),
        transitionDuration: const Duration(milliseconds: 250),
        reverseTransitionDuration: const Duration(milliseconds: 200),
        pageBuilder: (context, animation, secondaryAnimation) {
          return FadeTransition(
            opacity: animation,
            child: LogImageViewerPage(log: log, heroTag: heroTag),
          );
        },
      ),
    );
  }

  @override
  State<LogImageViewerPage> createState() => _LogImageViewerPageState();
}

class _LogImageViewerPageState extends State<LogImageViewerPage> {
  final TransformationController _transformationController = TransformationController();
  TapDownDetails? _doubleTapDetails;
  bool _showControls = true;
  bool _isZoomed = false;

  @override
  void initState() {
    super.initState();
    _transformationController.addListener(() {
      final zoomed = _transformationController.value.getMaxScaleOnAxis() > 1.05;
      if (zoomed != _isZoomed) {
        setState(() {
          _isZoomed = zoomed;
        });
      }
    });
  }

  @override
  void dispose() {
    _transformationController.dispose();
    super.dispose();
  }

  void _handleDoubleTapDown(TapDownDetails details) {
    _doubleTapDetails = details;
  }

  void _handleDoubleTap() {
    if (_transformationController.value != Matrix4.identity()) {
      _transformationController.value = Matrix4.identity();
    } else {
      final position = _doubleTapDetails?.localPosition ?? Offset.zero;
      _transformationController.value = Matrix4.identity()
        ..translate(-position.dx * 1.5, -position.dy * 1.5)
        ..scale(2.5);
    }
  }

  void _toggleControls() {
    setState(() {
      _showControls = !_showControls;
    });
  }

  @override
  Widget build(BuildContext context) {
    final log = widget.log;
    final dateStr = '${log.registeredAt.day}/${log.registeredAt.month}/${log.registeredAt.year}';
    final timeStr = '${log.registeredAt.hour.toString().padLeft(2, '0')}:${log.registeredAt.minute.toString().padLeft(2, '0')}';
    final hasAlarm = log.alarmSigns != null && log.alarmSigns!.trim().isNotEmpty;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Imagen interactiva con Zoom y Pan
          GestureDetector(
            onTap: _toggleControls,
            onDoubleTapDown: _handleDoubleTapDown,
            onDoubleTap: _handleDoubleTap,
            child: Center(
              child: Hero(
                tag: widget.heroTag,
                child: InteractiveViewer(
                  transformationController: _transformationController,
                  minScale: 0.8,
                  maxScale: 5.0,
                  panEnabled: true,
                  scaleEnabled: true,
                  child: Image.network(
                    log.imageUrl!,
                    fit: BoxFit.contain,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Center(
                        child: CircularProgressIndicator(
                          color: AppTheme.primaryMint,
                          value: loadingProgress.expectedTotalBytes != null
                              ? loadingProgress.cumulativeBytesLoaded /
                                  loadingProgress.expectedTotalBytes!
                              : null,
                        ),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) => Container(
                      padding: const EdgeInsets.all(24),
                      color: AppTheme.surfaceSlate,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.broken_image_rounded, size: 64, color: AppTheme.alertRed),
                          SizedBox(height: 12),
                          Text(
                            'No se pudo cargar la imagen en alta resolución',
                            style: TextStyle(color: AppTheme.textMuted),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Barra Superior Flotante
          AnimatedPositioned(
            duration: const Duration(milliseconds: 200),
            top: _showControls ? MediaQuery.of(context).padding.top + 8 : -80,
            left: 16,
            right: 16,
            child: Row(
              children: [
                // Botón Cerrar
                Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.6),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.white, size: 24),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ),
                const SizedBox(width: 12),
                // Información de Fecha
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Detalle Fotográfico de Evolución',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '$dateStr a las $timeStr',
                          style: const TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (_isZoomed) ...[
                  const SizedBox(width: 8),
                  // Botón reiniciar zoom
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.restart_alt_rounded, color: AppTheme.primaryMint, size: 22),
                      tooltip: 'Reiniciar Zoom',
                      onPressed: () {
                        _transformationController.value = Matrix4.identity();
                      },
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Ficha Clínica Inferior Flotante
          AnimatedPositioned(
            duration: const Duration(milliseconds: 200),
            bottom: _showControls ? MediaQuery.of(context).padding.bottom + 16 : -250,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surfaceSlate.withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: hasAlarm
                      ? AppTheme.alertRed.withValues(alpha: 0.5)
                      : Colors.white.withValues(alpha: 0.12),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.5),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Constantes clínicas
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildChip(
                        icon: Icons.restaurant_rounded,
                        label: 'Apetito',
                        value: '${log.appetiteLevel}/5',
                        color: AppTheme.primaryMint,
                      ),
                      _buildChip(
                        icon: Icons.bolt_rounded,
                        label: 'Energía',
                        value: '${log.energyLevel}/5',
                        color: AppTheme.primaryMint,
                      ),
                      if (log.painLevel != null)
                        _buildChip(
                          icon: Icons.sentiment_dissatisfied_rounded,
                          label: 'Dolor',
                          value: '${log.painLevel}/10',
                          color: log.painLevel! > 3 ? AppTheme.alertRed : AppTheme.alertYellow,
                        ),
                      if (log.temperature != null)
                        _buildChip(
                          icon: Icons.thermostat_rounded,
                          label: 'Temp.',
                          value: '${log.temperature!.toStringAsFixed(1)}°C',
                          color: log.temperature! >= 37.5 && log.temperature! <= 39.5
                              ? AppTheme.alertGreen
                              : AppTheme.alertYellow,
                        ),
                    ],
                  ),

                  // Observaciones
                  if (log.observations != null && log.observations!.trim().isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.notes_rounded, size: 14, color: AppTheme.textMuted),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            log.observations!,
                            style: const TextStyle(color: AppTheme.textLight, fontSize: 12),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],

                  // Alarma
                  if (hasAlarm) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppTheme.alertRed.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded, size: 14, color: AppTheme.alertRed),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Alarma: ${log.alarmSigns!}',
                              style: const TextStyle(
                                color: AppTheme.alertRed,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 4),
                  const Center(
                    child: Text(
                      'Pellizca para hacer zoom • Toca para ocultar detalles',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 10),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChip({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 9,
            color: AppTheme.textMuted,
          ),
        ),
      ],
    );
  }
}
