import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../config/theme/app_theme.dart';
import '../bloc/treatments_bloc.dart';
import '../bloc/treatments_event.dart';
import '../bloc/treatments_state.dart';

class TreatmentsListPage extends StatefulWidget {
  const TreatmentsListPage({super.key});

  @override
  State<TreatmentsListPage> createState() => _TreatmentsListPageState();
}

class _TreatmentsListPageState extends State<TreatmentsListPage> {
  String? _selectedFilter; // null (Todos), 'ACTIVE' (Activos), 'COMPLETED' (Finalizados)

  @override
  void initState() {
    super.initState();
    _fetchTreatments();
  }

  void _fetchTreatments() {
    context.read<TreatmentsBloc>().add(LoadVetTreatments(status: _selectedFilter));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Historial Clínico', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: Column(
        children: [
          // Chips de Filtro
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _buildFilterChip('Todos', null),
                const SizedBox(width: 8),
                _buildFilterChip('Activos', 'ACTIVE'),
                const SizedBox(width: 8),
                _buildFilterChip('Finalizados', 'COMPLETED'),
              ],
            ),
          ),
          // Lista de tratamientos
          Expanded(
            child: BlocBuilder<TreatmentsBloc, TreatmentsState>(
              builder: (context, state) {
                if (state is TreatmentsLoading) {
                  return const Center(child: CircularProgressIndicator(color: AppTheme.primaryMint));
                } else if (state is TreatmentsLoaded) {
                  final treatments = state.treatments;

                  if (treatments.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.history_edu_outlined,
                              size: 64,
                              color: AppTheme.textMuted.withOpacity(0.3),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Sin registros encontrados',
                              style: TextStyle(color: AppTheme.textMuted, fontSize: 16),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return RefreshIndicator(
                    color: AppTheme.primaryMint,
                    onRefresh: () async => _fetchTreatments(),
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: treatments.length,
                      itemBuilder: (context, index) {
                        final t = treatments[index];
                        final isCompleted = t.status == 'COMPLETED';

                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () {
                              Navigator.of(context).pushNamed(
                                '/treatment-detail',
                                arguments: t.id,
                              ).then((_) => _fetchTreatments());
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        t.pet?.name ?? 'Mascota',
                                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                      ),
                                      const Spacer(),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: isCompleted
                                              ? AppTheme.alertGreen.withOpacity(0.15)
                                              : AppTheme.primaryMint.withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          isCompleted ? 'Finalizado' : 'Activo',
                                          style: TextStyle(
                                            color: isCompleted ? AppTheme.alertGreen : AppTheme.primaryMint,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    t.diagnosis,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: AppTheme.textLight, fontSize: 14),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Inicio: ${t.startDate.day}/${t.startDate.month}/${t.startDate.year}',
                                    style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  );
                } else if (state is TreatmentsError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(state.message, style: const TextStyle(color: AppTheme.alertRed)),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _fetchTreatments,
                          child: const Text('Reintentar'),
                        ),
                      ],
                    ),
                  );
                }

                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String? filterValue) {
    final isSelected = _selectedFilter == filterValue;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedFilter = filterValue;
          });
          _fetchTreatments();
        }
      },
      selectedColor: AppTheme.primaryMint.withOpacity(0.2),
      disabledColor: Colors.transparent,
      side: BorderSide(
        color: isSelected ? AppTheme.primaryMint : AppTheme.darkMetallic,
        width: 1,
      ),
      labelStyle: TextStyle(
        color: isSelected ? AppTheme.primaryMint : AppTheme.textMuted,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }
}
