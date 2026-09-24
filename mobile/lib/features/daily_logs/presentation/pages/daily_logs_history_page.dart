import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/theme/app_theme.dart';
import '../../widgets/log_timeline_card.dart';
import '../bloc/daily_logs_bloc.dart';
import '../bloc/daily_logs_event.dart';
import '../bloc/daily_logs_state.dart';

class DailyLogsHistoryPage extends StatefulWidget {
  final String treatmentId;

  const DailyLogsHistoryPage({super.key, required this.treatmentId});

  @override
  State<DailyLogsHistoryPage> createState() => _DailyLogsHistoryPageState();
}

class _DailyLogsHistoryPageState extends State<DailyLogsHistoryPage> {
  @override
  void initState() {
    super.initState();
    context.read<DailyLogsBloc>().add(LoadDailyLogs(widget.treatmentId));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Historial de Evolución', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: BlocBuilder<DailyLogsBloc, DailyLogsState>(
        builder: (context, state) {
          if (state is DailyLogsLoading) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.primaryMint));
          } else if (state is DailyLogsLoaded) {
            final logs = state.logs;

            if (logs.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.history_toggle_off_rounded,
                        size: 64,
                        color: AppTheme.textMuted.withValues(alpha: 0.3),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Aún no hay reportes de evolución',
                        style: TextStyle(color: AppTheme.textMuted, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Registra el primer reporte diario desde la ficha de tu mascota.',
                        style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            }

            return RefreshIndicator(
              color: AppTheme.primaryMint,
              onRefresh: () async {
                context.read<DailyLogsBloc>().add(LoadDailyLogs(widget.treatmentId));
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: logs.length,
                itemBuilder: (context, index) {
                  final log = logs[index];
                  return LogTimelineCard(log: log);
                },
              ),
            );
          } else if (state is DailyLogsError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline_rounded, color: AppTheme.alertRed, size: 48),
                  const SizedBox(height: 16),
                  Text(state.message, style: const TextStyle(color: AppTheme.textLight)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.read<DailyLogsBloc>().add(LoadDailyLogs(widget.treatmentId)),
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
}
