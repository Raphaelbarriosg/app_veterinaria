import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/theme/app_theme.dart';
import '../../widgets/treatment_card.dart';
import '../bloc/treatments_bloc.dart';
import '../bloc/treatments_event.dart';
import '../bloc/treatments_state.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  @override
  void initState() {
    super.initState();
    context.read<TreatmentsBloc>().add(LoadVetDashboard());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard Prioridades', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.primaryMint),
            onPressed: () {
              context.read<TreatmentsBloc>().add(LoadVetDashboard());
            },
          ),
        ],
      ),
      body: BlocBuilder<TreatmentsBloc, TreatmentsState>(
        builder: (context, state) {
          if (state is TreatmentsLoading) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.primaryMint));
          } else if (state is VetDashboardLoaded) {
            final items = state.dashboardItems;

            if (items.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.dashboard_customize_outlined,
                        size: 80,
                        color: AppTheme.textMuted.withValues(alpha: 0.3),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Sin pacientes en seguimiento',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textLight),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Los tratamientos post-operatorios activos de tus pacientes se listarán aquí ordenados por prioridad.',
                        style: TextStyle(color: AppTheme.textMuted),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                          onPressed: () {
                            Navigator.of(context).pushNamed('/create-treatment').then((_) {
                              if (!context.mounted) return;
                              context.read<TreatmentsBloc>().add(LoadVetDashboard());
                            });
                          },
                          icon: const Icon(Icons.add_rounded),
                          label: const Text('Crear Tratamiento'),
                        ),
                      ],
                    ),
                  ),
                );
              }

              // Separar y contar estados para el resumen superior
            final redCount = items.where((i) => i.priority == 'RED').length;
            final yellowCount = items.where((i) => i.priority == 'YELLOW').length;
            final greenCount = items.where((i) => i.priority == 'GREEN').length;

            return RefreshIndicator(
              color: AppTheme.primaryMint,
              onRefresh: () async {
                context.read<TreatmentsBloc>().add(LoadVetDashboard());
              },
              child: Column(
                children: [
                  // Resumen de Estado del Semáforo
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        _buildStatusHeaderCard('Críticos', redCount, AppTheme.alertRed),
                        const SizedBox(width: 12),
                        _buildStatusHeaderCard('Alertas', yellowCount, AppTheme.alertYellow),
                        const SizedBox(width: 12),
                        _buildStatusHeaderCard('Estables', greenCount, AppTheme.alertGreen),
                      ],
                    ),
                  ),
                  
                  // Lista de pacientes
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: items.length,
                      itemBuilder: (context, index) {
                        final item = items[index];
                        return TreatmentCard(
                          item: item,
                          onTap: () {
                            Navigator.of(context).pushNamed(
                              '/treatment-detail',
                              arguments: item.treatmentId,
                            ).then((_) {
                              if (!context.mounted) return;
                              context.read<TreatmentsBloc>().add(LoadVetDashboard());
                            });
                          },
                        );
                      },
                    ),
                  ),
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
                    onPressed: () => context.read<TreatmentsBloc>().add(LoadVetDashboard()),
                    child: const Text('Reintentar'),
                  ),
                ],
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primaryMint,
        foregroundColor: AppTheme.backgroundCharcoal,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        onPressed: () {
          Navigator.of(context).pushNamed('/create-treatment').then((_) {
            if (!context.mounted) return;
            context.read<TreatmentsBloc>().add(LoadVetDashboard());
          });
        },
        child: const Icon(Icons.add_rounded, size: 28),
      ),
    );
  }

  Widget _buildStatusHeaderCard(String label, int count, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3), width: 1),
        ),
        child: Column(
          children: [
            Text(
              count.toString(),
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
