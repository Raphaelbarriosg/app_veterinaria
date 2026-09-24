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
    
    switch (priority.toUpperCase()) {
      case 'RED':
        color = AppTheme.alertRed;
        break;
      case 'YELLOW':
        color = AppTheme.alertYellow;
        break;
      case 'GREEN':
      default:
        color = AppTheme.alertGreen;
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
            color: color.withValues(alpha: 0.6),
            blurRadius: 8,
            spreadRadius: 2,
          ),
        ],
      ),
    );
  }
}
