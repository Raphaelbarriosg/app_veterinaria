import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/theme/app_theme.dart';
import '../../../pets/data/models/pet_model.dart';
import '../../../pets/presentation/bloc/pets_bloc.dart';
import '../../../pets/presentation/bloc/pets_event.dart';
import '../../../pets/presentation/bloc/pets_state.dart';
import '../../../auth/widgets/auth_text_field.dart';
import '../bloc/treatments_bloc.dart';
import '../bloc/treatments_event.dart';
import '../bloc/treatments_state.dart';

class CreateTreatmentPage extends StatefulWidget {
  const CreateTreatmentPage({super.key});

  @override
  State<CreateTreatmentPage> createState() => _CreateTreatmentPageState();
}

class _CreateTreatmentPageState extends State<CreateTreatmentPage> {
  final _formKey = GlobalKey<FormState>();
  final _diagnosisController = TextEditingController();
  final _searchController = TextEditingController();
  
  // Controladores para agregar reglas
  final _medicineNameController = TextEditingController();
  final _dosageController = TextEditingController();
  int _selectedFrequencyHours = 8;
  bool _requirePhoto = false;

  PetModel? _selectedPet;
  final DateTime _startDate = DateTime.now();
  DateTime? _endDate;

  final List<Map<String, dynamic>> _rules = [];

  @override
  void dispose() {
    _diagnosisController.dispose();
    _searchController.dispose();
    _medicineNameController.dispose();
    _dosageController.dispose();
    super.dispose();
  }

  void _addRule() {
    final medName = _medicineNameController.text.trim();
    final dosage = _dosageController.text.trim();

    if (medName.isEmpty || dosage.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ingresa el nombre del medicamento y la dosis'), backgroundColor: AppTheme.alertRed),
      );
      return;
    }

    setState(() {
      _rules.add({
        'medicineName': medName,
        'dosage': dosage,
        'frequencyHours': _selectedFrequencyHours,
        'requirePhoto': _requirePhoto,
      });
      _medicineNameController.clear();
      _dosageController.clear();
      _selectedFrequencyHours = 8;
      _requirePhoto = false;
    });
  }

  void _removeRule(int index) {
    setState(() {
      _rules.removeAt(index);
    });
  }

  Future<void> _selectEndDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _endDate ?? DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppTheme.primaryMint,
              onPrimary: AppTheme.backgroundCharcoal,
              surface: AppTheme.surfaceSlate,
              onSurface: AppTheme.textLight,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _endDate = picked;
      });
    }
  }

  void _submit() {
    if (_selectedPet == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor busca y selecciona una mascota'), backgroundColor: AppTheme.alertRed),
      );
      return;
    }

    if (_formKey.currentState!.validate()) {
      if (_rules.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Debes agregar al menos una regla de medicación'), backgroundColor: AppTheme.alertRed),
        );
        return;
      }

      context.read<TreatmentsBloc>().add(
        CreateTreatmentRequested(
          petId: _selectedPet!.id,
          diagnosis: _diagnosisController.text.trim(),
          startDate: _startDate,
          endDate: _endDate,
          rules: _rules,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nuevo Tratamiento', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: BlocListener<TreatmentsBloc, TreatmentsState>(
        listener: (context, state) {
          if (state is TreatmentOperationSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppTheme.alertGreen),
            );
            Navigator.of(context).pop(true);
          } else if (state is TreatmentsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppTheme.alertRed),
            );
          }
        },
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. BUSCAR MASCOTA
                  const Text(
                    '1. Seleccionar Mascota',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryMint),
                  ),
                  const SizedBox(height: 12),
                  if (_selectedPet == null) ...[
                    // Campo de búsqueda
                    TextField(
                      controller: _searchController,
                      style: const TextStyle(color: AppTheme.textLight),
                      decoration: const InputDecoration(
                        labelText: 'Buscar mascota por nombre...',
                        prefixIcon: Icon(Icons.search_rounded, color: AppTheme.textMuted),
                      ),
                      onChanged: (val) {
                        context.read<PetsBloc>().add(SearchPetsRequested(val));
                      },
                    ),
                    const SizedBox(height: 8),
                    // Resultados de búsqueda
                    BlocBuilder<PetsBloc, PetsState>(
                      builder: (context, state) {
                        if (state is PetsLoading) {
                          return const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: SizedBox(
                                height: 24,
                                width: 24,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryMint),
                              ),
                            ),
                          );
                        } else if (state is PetsSearchResultsLoaded) {
                          final results = state.results;
                          if (results.isEmpty) {
                            return const Padding(
                              padding: EdgeInsets.all(8.0),
                              child: Text('No se encontraron mascotas', style: TextStyle(color: AppTheme.textMuted)),
                            );
                          }
                          return Container(
                            constraints: const BoxConstraints(maxHeight: 150),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceSlate,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: ListView.builder(
                              shrinkWrap: true,
                              itemCount: results.length,
                              itemBuilder: (context, index) {
                                final pet = results[index];
                                return ListTile(
                                  title: Text(pet.name, style: const TextStyle(color: AppTheme.textLight)),
                                  subtitle: Text(
                                    '${pet.species} • Propietario: ${pet.owner?.name ?? "N/A"}',
                                    style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                  ),
                                  trailing: const Icon(Icons.add_circle_outline_rounded, color: AppTheme.primaryMint),
                                  onTap: () {
                                    setState(() {
                                      _selectedPet = pet;
                                      _searchController.clear();
                                    });
                                  },
                                );
                              },
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                  ] else ...[
                    // Tarjeta Mascota Seleccionada
                    Card(
                      color: AppTheme.primaryMint.withValues(alpha: 0.05),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: const BorderSide(color: AppTheme.primaryMint, width: 1),
                      ),
                      child: ListTile(
                        leading: const CircleAvatar(
                          backgroundColor: AppTheme.primaryMint,
                          child: Icon(Icons.pets_rounded, color: AppTheme.backgroundCharcoal),
                        ),
                        title: Text(_selectedPet!.name, style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textLight)),
                        subtitle: Text(
                          'Especie: ${_selectedPet!.species} • Dueño: ${_selectedPet!.owner?.name ?? "N/A"}',
                          style: const TextStyle(color: AppTheme.textMuted),
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.close_rounded, color: AppTheme.alertRed),
                          onPressed: () {
                            setState(() {
                              _selectedPet = null;
                            });
                          },
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),

                  // 2. DIAGNÓSTICO
                  const Text(
                    '2. Diagnóstico Médico',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryMint),
                  ),
                  const SizedBox(height: 12),
                  AuthTextField(
                    controller: _diagnosisController,
                    labelText: 'Diagnóstico',
                    hintText: 'Ej. Cirugía de ligamento cruzado en pata trasera izquierda.',
                    prefixIcon: Icons.healing_outlined,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Por favor ingresa el diagnóstico';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // 3. FECHAS
                  GestureDetector(
                    onTap: () => _selectEndDate(context),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppTheme.darkMetallic.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.darkMetallic, width: 1),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.date_range_outlined, color: AppTheme.textMuted),
                          const SizedBox(width: 12),
                          Text(
                            _endDate == null
                                ? 'Establecer Fecha de Fin (Opcional)'
                                : 'Finalización: ${_endDate!.day}/${_endDate!.month}/${_endDate!.year}',
                            style: TextStyle(
                              color: _endDate == null ? AppTheme.textMuted : AppTheme.textLight,
                              fontSize: 16,
                            ),
                          ),
                          const Spacer(),
                          const Icon(Icons.arrow_drop_down_rounded, color: AppTheme.textMuted),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 4. AGREGAR REGLAS DE MEDICACIÓN
                  const Text(
                    '3. Configurar Dosificaciones',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryMint),
                  ),
                  const SizedBox(height: 12),
                  Card(
                    color: AppTheme.surfaceSlate.withValues(alpha: 0.5),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          TextField(
                            controller: _medicineNameController,
                            style: const TextStyle(color: AppTheme.textLight),
                            decoration: const InputDecoration(
                              labelText: 'Medicamento',
                              hintText: 'Ej. Tramadol 50mg',
                              prefixIcon: Icon(Icons.medication_outlined, color: AppTheme.textMuted),
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _dosageController,
                            style: const TextStyle(color: AppTheme.textLight),
                            decoration: const InputDecoration(
                              labelText: 'Dosis',
                              hintText: 'Ej. 1 tableta / 2 ml',
                              prefixIcon: Icon(Icons.scale_outlined, color: AppTheme.textMuted),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              const Icon(Icons.timer_outlined, color: AppTheme.textMuted),
                              const SizedBox(width: 8),
                              const Text('Frecuencia: ', style: TextStyle(color: AppTheme.textMuted)),
                              const Spacer(),
                              DropdownButton<int>(
                                value: _selectedFrequencyHours,
                                dropdownColor: AppTheme.surfaceSlate,
                                style: const TextStyle(color: AppTheme.textLight, fontWeight: FontWeight.bold),
                                items: [4, 6, 8, 12, 24].map((hours) {
                                  return DropdownMenuItem<int>(
                                    value: hours,
                                    child: Text('Cada $hours horas'),
                                  );
                                }).toList(),
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() {
                                      _selectedFrequencyHours = val;
                                    });
                                  }
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.camera_alt_outlined, color: AppTheme.textMuted),
                              const SizedBox(width: 8),
                              const Text('Requerir foto de confirmación', style: TextStyle(color: AppTheme.textMuted)),
                              const Spacer(),
                              Switch(
                                value: _requirePhoto,
                                activeThumbColor: AppTheme.primaryMint,
                                onChanged: (val) {
                                  setState(() {
                                    _requirePhoto = val;
                                  });
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.darkMetallic,
                              foregroundColor: AppTheme.primaryMint,
                            ),
                            onPressed: _addRule,
                            icon: const Icon(Icons.add_rounded),
                            label: const Text('Agregar Regla'),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Listado de reglas agregadas
                  if (_rules.isNotEmpty) ...[
                    const Text('Reglas agregadas:', style: TextStyle(color: AppTheme.textLight, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _rules.length,
                      itemBuilder: (context, index) {
                        final r = _rules[index];
                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.check_circle_outline_rounded, color: AppTheme.primaryMint),
                          title: Text(
                            '${r['medicineName']} • ${r['dosage']}',
                            style: const TextStyle(color: AppTheme.textLight, fontSize: 14),
                          ),
                          subtitle: Text(
                            'Cada ${r['frequencyHours']} horas ${r['requirePhoto'] ? "(Requiere foto)" : ""}',
                            style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                          ),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline_rounded, color: AppTheme.alertRed),
                            onPressed: () => _removeRule(index),
                          ),
                        );
                      },
                    ),
                  ],

                  const SizedBox(height: 32),

                  // Botón Enviar
                  ElevatedButton(
                    onPressed: _submit,
                    child: const Text('Crear e Iniciar Tratamiento'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
