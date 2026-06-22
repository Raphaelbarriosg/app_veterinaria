import 'package:flutter/material.dart';
import '../../../config/theme/app_theme.dart';

class SemaphoreIndicator extends StatelessWidget {
  final String priority; // 'RED' | 'YELLOW' | 'GREEN'
  final double size;

  const SemaphoreIndicator({
    super.key,
    required this.priority,
    this.size = 14.0,
  });

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;
    
    switch (priority.toUpperCase()) {
      case 'RED':
        color = AppTheme.alertRed;
        label = 'Crítico';
        break;
      case 'YELLOW':
        color = AppTheme.alertYellow;
        label = 'Alerta';
        break;
      case 'GREEN':
      default:
        color = AppTheme.alertGreen;
        label = 'Estable';
        break;
    }

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.6),
            blurRadius: 8,
            spreadRadius: 2,
          ),
        ],
      ),
    );
  }
}
