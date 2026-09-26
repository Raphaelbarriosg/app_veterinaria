import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/theme/app_theme.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../auth/data/repositories/auth_repository.dart';
import '../../../pets/data/models/pet_model.dart';
import '../../../pets/data/repositories/pets_repository.dart';
import '../../../pets/presentation/bloc/pets_bloc.dart';
import '../../../pets/presentation/bloc/pets_event.dart';
import '../../../pets/presentation/bloc/pets_state.dart';
import '../../../auth/widgets/auth_text_field.dart';
import '../bloc/treatments_bloc.dart';
import '../bloc/treatments_event.dart';
import '../bloc/treatments_state.dart';

class CreateTreatmentPage extends StatefulWidget {
  final PetModel? initialPet;

  const CreateTreatmentPage({super.key, this.initialPet});

  @override
  State<CreateTreatmentPage> createState() => _CreateTreatmentPageState();
}

class _CreateTreatmentPageState extends State<CreateTreatmentPage> {
  final _formKey = GlobalKey<FormState>();
  final _diagnosisController = TextEditingController();
  final _searchController = TextEditingController();
  final _tutorSearchController = TextEditingController();
  
  // Controladores para agregar reglas
  final _medicineNameController = TextEditingController();
  final _dosageController = TextEditingController();
  int _selectedFrequencyHours = 8;
  bool _requirePhoto = false;

  PetModel? _selectedPet;
  UserModel? _selectedTutor;
  List<PetModel> _tutorPets = [];
  bool _isLoadingTutorPets = false;
  List<UserModel> _tutorsList = [];
  bool _isLoadingTutors = false;

  // Modo de selección: 0 = Por Tutor (recomendado), 1 = Por Nombre Mascota
  int _selectionMode = 0;

  final DateTime _startDate = DateTime.now();
  DateTime? _endDate;

  final List<Map<String, dynamic>> _rules = [];

  @override
  void initState() {
    super.initState();
    if (widget.initialPet != null) {
      _selectedPet = widget.initialPet;
    } else {
      _loadTutors();
    }
  }

  @override
  void dispose() {
    _diagnosisController.dispose();
    _searchController.dispose();
    _tutorSearchController.dispose();
    _medicineNameController.dispose();
    _dosageController.dispose();
    super.dispose();
  }

  Future<void> _loadTutors([String? query]) async {
    setState(() => _isLoadingTutors = true);
    try {
      final authRepo = context.read<AuthRepository>();
      final list = await authRepo.getTutors(query: query);
      if (mounted) {
        setState(() {
          _tutorsList = list;
          _isLoadingTutors = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingTutors = false);
    }
  }

  Future<void> _selectTutor(UserModel tutor) async {
    setState(() {
      _selectedTutor = tutor;
      _isLoadingTutorPets = true;
      _tutorPets = [];
    });

    try {
      final petsRepo = context.read<PetsRepository>();
      final pets = await petsRepo.getPetsByOwner(tutor.id);
      if (mounted) {
        setState(() {
          _tutorPets = pets;
          _isLoadingTutorPets = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingTutorPets = false);
    }
  }

  void _showCreateTutorDialog() {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceSlate,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        const CircleAvatar(
                          backgroundColor: AppTheme.primaryMint,
                          child: Icon(Icons.person_add_rounded, color: AppTheme.backgroundCharcoal),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'Registrar Tutor / Dueño',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textLight),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, color: AppTheme.textMuted),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: nameCtrl,
                      style: const TextStyle(color: AppTheme.textLight),
                      decoration: const InputDecoration(
                        labelText: 'Nombre Completo del Tutor',
                        hintText: 'Ej. Carolina Reyes',
                        prefixIcon: Icon(Icons.person_outline_rounded, color: AppTheme.textMuted),
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'Ingresa el nombre' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      style: const TextStyle(color: AppTheme.textLight),
                      decoration: const InputDecoration(
                        labelText: 'Correo Electrónico',
                        hintText: 'cliente@correo.com',
                        prefixIcon: Icon(Icons.email_outlined, color: AppTheme.textMuted),
                      ),
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) return 'Ingresa el correo';
                        if (!val.contains('@')) return 'Ingresa un correo válido';
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: phoneCtrl,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(color: AppTheme.textLight),
                      decoration: const InputDecoration(
                        labelText: 'Teléfono (Opcional)',
                        hintText: '+56 9 1234 5678',
                        prefixIcon: Icon(Icons.phone_outlined, color: AppTheme.textMuted),
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: isSaving
                          ? null
                          : () async {
                              if (formKey.currentState!.validate()) {
                                setModalState(() => isSaving = true);
                                try {
                                  final authRepo = context.read<AuthRepository>();
                                  final newTutor = await authRepo.createTutor(
                                    name: nameCtrl.text.trim(),
                                    email: emailCtrl.text.trim().toLowerCase(),
                                    phone: phoneCtrl.text.trim().isEmpty ? null : phoneCtrl.text.trim(),
                                  );
                                  if (mounted) {
                                    Navigator.pop(ctx);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Tutor registrado y seleccionado'),
                                        backgroundColor: AppTheme.alertGreen,
                                      ),
                                    );
                                    _loadTutors();
                                    _selectTutor(newTutor);
                                  }
                                } catch (err) {
                                  setModalState(() => isSaving = false);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Error al registrar tutor: ${err.toString()}'),
                                      backgroundColor: AppTheme.alertRed,
                                    ),
                                  );
                                }
                              }
                            },
                      child: isSaving
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.backgroundCharcoal),
                            )
                          : const Text('Registrar y Seleccionar'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
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
        const SnackBar(content: Text('Por favor selecciona una mascota'), backgroundColor: AppTheme.alertRed),
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
                  // 1. SELECCIÓN DE PACIENTE / MASCOTA
                  const Text(
                    '1. Seleccionar Paciente',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryMint),
                  ),
                  const SizedBox(height: 12),

                  if (_selectedPet == null) ...[
                    // Toggle Modo de selección
                    Container(
                      decoration: BoxDecoration(
                        color: AppTheme.darkMetallic.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.all(4),
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _selectionMode = 0),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                decoration: BoxDecoration(
                                  color: _selectionMode == 0 ? AppTheme.primaryMint : Colors.transparent,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  'Por Tutor / Dueño',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                    color: _selectionMode == 0 ? AppTheme.backgroundCharcoal : AppTheme.textMuted,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _selectionMode = 1),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                decoration: BoxDecoration(
                                  color: _selectionMode == 1 ? AppTheme.primaryMint : Colors.transparent,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  'Buscar por Mascota',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                    color: _selectionMode == 1 ? AppTheme.backgroundCharcoal : AppTheme.textMuted,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // MODO 0: SELECCIÓN POR TUTOR
                    if (_selectionMode == 0) ...[
                      if (_selectedTutor == null) ...[
                        // Campo búsqueda de tutor
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _tutorSearchController,
                                style: const TextStyle(color: AppTheme.textLight),
                                decoration: InputDecoration(
                                  labelText: 'Buscar tutor (nombre, correo, fono)...',
                                  prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.textMuted),
                                  suffixIcon: _tutorSearchController.text.isNotEmpty
                                      ? IconButton(
                                          icon: const Icon(Icons.clear_rounded, color: AppTheme.textMuted),
                                          onPressed: () {
                                            _tutorSearchController.clear();
                                            _loadTutors();
                                          },
                                        )
                                      : null,
                                ),
                                onChanged: (val) => _loadTutors(val.trim()),
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton.filled(
                              style: IconButton.styleFrom(
                                backgroundColor: AppTheme.primaryMint,
                                foregroundColor: AppTheme.backgroundCharcoal,
                              ),
                              tooltip: 'Nuevo Tutor',
                              icon: const Icon(Icons.person_add_rounded),
                              onPressed: _showCreateTutorDialog,
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),

                        // Listado de tutores
                        if (_isLoadingTutors)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: SizedBox(
                                height: 24,
                                width: 24,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryMint),
                              ),
                            ),
                          )
                        else if (_tutorsList.isEmpty)
                          Padding(
                            padding: const EdgeInsets.all(12.0),
                            child: Column(
                              children: [
                                const Text('No se encontraron tutores', style: TextStyle(color: AppTheme.textMuted)),
                                const SizedBox(height: 8),
                                OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(foregroundColor: AppTheme.primaryMint),
                                  onPressed: _showCreateTutorDialog,
                                  icon: const Icon(Icons.person_add_rounded, size: 16),
                                  label: const Text('Registrar Nuevo Tutor'),
                                ),
                              ],
                            ),
                          )
                        else
                          Container(
                            constraints: const BoxConstraints(maxHeight: 180),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceSlate,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: ListView.builder(
                              shrinkWrap: true,
                              itemCount: _tutorsList.length,
                              itemBuilder: (context, index) {
                                final tutor = _tutorsList[index];
                                return ListTile(
                                  leading: CircleAvatar(
                                    radius: 16,
                                    backgroundColor: AppTheme.primaryMint.withValues(alpha: 0.15),
                                    child: Text(
                                      tutor.name.isNotEmpty ? tutor.name[0].toUpperCase() : 'T',
                                      style: const TextStyle(color: AppTheme.primaryMint, fontWeight: FontWeight.bold, fontSize: 12),
                                    ),
                                  ),
                                  title: Text(tutor.name, style: const TextStyle(color: AppTheme.textLight, fontSize: 14)),
                                  subtitle: Text(
                                    '${tutor.email} • ${tutor.petCount} masc.',
                                    style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                                  ),
                                  trailing: const Icon(Icons.arrow_forward_ios_rounded, color: AppTheme.primaryMint, size: 14),
                                  onTap: () => _selectTutor(tutor),
                                );
                              },
                            ),
                          ),
                      ] else ...[
                        // Tarjeta Tutor Seleccionado
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceSlate,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.primaryMint.withValues(alpha: 0.3)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundColor: AppTheme.primaryMint,
                                    child: Text(
                                      _selectedTutor!.name[0].toUpperCase(),
                                      style: const TextStyle(color: AppTheme.backgroundCharcoal, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          _selectedTutor!.name,
                                          style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textLight),
                                        ),
                                        Text(
                                          _selectedTutor!.email,
                                          style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                                        ),
                                      ],
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: () {
                                      setState(() {
                                        _selectedTutor = null;
                                        _tutorPets = [];
                                      });
                                    },
                                    child: const Text('Cambiar', style: TextStyle(color: AppTheme.primaryMint, fontSize: 12)),
                                  ),
                                ],
                              ),
                              const Divider(color: AppTheme.darkMetallic, height: 16),
                              Row(
                                children: [
                                  const Text(
                                    'Mascotas de este tutor:',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textLight),
                                  ),
                                  const Spacer(),
                                  TextButton.icon(
                                    style: TextButton.styleFrom(
                                      foregroundColor: AppTheme.primaryMint,
                                      padding: EdgeInsets.zero,
                                    ),
                                    onPressed: () {
                                      Navigator.of(context).pushNamed(
                                        '/pet-form',
                                        arguments: {
                                          'ownerId': _selectedTutor!.id,
                                          'ownerName': _selectedTutor!.name,
                                        },
                                      ).then((created) {
                                        if (created == true) {
                                          _selectTutor(_selectedTutor!);
                                        }
                                      });
                                    },
                                    icon: const Icon(Icons.add_rounded, size: 16),
                                    label: const Text('+ Agregar Mascota', style: TextStyle(fontSize: 11)),
                                  ),
                                ],
                              ),
                              if (_isLoadingTutorPets)
                                const Center(
                                  child: Padding(
                                    padding: EdgeInsets.all(12.0),
                                    child: SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryMint),
                                    ),
                                  ),
                                )
                              else if (_tutorPets.isEmpty)
                                Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.info_outline_rounded, color: AppTheme.textMuted, size: 16),
                                      const SizedBox(width: 8),
                                      const Expanded(
                                        child: Text(
                                          'El tutor aún no tiene mascotas registradas.',
                                          style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                        ),
                                      ),
                                      OutlinedButton(
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: AppTheme.primaryMint,
                                          side: const BorderSide(color: AppTheme.primaryMint),
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          minimumSize: Size.zero,
                                        ),
                                        onPressed: () {
                                          Navigator.of(context).pushNamed(
                                            '/pet-form',
                                            arguments: {
                                              'ownerId': _selectedTutor!.id,
                                              'ownerName': _selectedTutor!.name,
                                            },
                                          ).then((created) {
                                            if (created == true) {
                                              _selectTutor(_selectedTutor!);
                                            }
                                          });
                                        },
                                        child: const Text('Agregar', style: TextStyle(fontSize: 11)),
                                      ),
                                    ],
                                  ),
                                )
                              else
                                Column(
                                  children: _tutorPets.map((p) {
                                    return Card(
                                      color: AppTheme.backgroundCharcoal,
                                      margin: const EdgeInsets.only(top: 6),
                                      child: ListTile(
                                        dense: true,
                                        leading: CircleAvatar(
                                          radius: 14,
                                          backgroundColor: AppTheme.primaryMint.withValues(alpha: 0.15),
                                          child: Icon(_getSpeciesIcon(p.species), size: 14, color: AppTheme.primaryMint),
                                        ),
                                        title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textLight, fontSize: 13)),
                                        subtitle: Text(
                                          '${p.species} • ${p.breed ?? "Sin raza"} ${p.weight != null ? "• ${p.weight} kg" : ""}',
                                          style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                                        ),
                                        trailing: ElevatedButton(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppTheme.primaryMint,
                                            foregroundColor: AppTheme.backgroundCharcoal,
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                                            minimumSize: Size.zero,
                                          ),
                                          onPressed: () {
                                            setState(() {
                                              _selectedPet = p;
                                            });
                                          },
                                          child: const Text('Seleccionar', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ],

                    // MODO 1: BÚSQUEDA POR NOMBRE DE MASCOTA
                    if (_selectionMode == 1) ...[
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
                                child: Text('No se encontraron mascotas con ese nombre', style: TextStyle(color: AppTheme.textMuted)),
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
                                      '${pet.species} • Tutor: ${pet.owner?.name ?? "N/A"}',
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
                    ],
                  ] else ...[
                    // TARJETA MASCOTA SELECCIONADA
                    Card(
                      color: AppTheme.primaryMint.withValues(alpha: 0.08),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: const BorderSide(color: AppTheme.primaryMint, width: 1.5),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 22,
                              backgroundColor: AppTheme.primaryMint,
                              child: Icon(_getSpeciesIcon(_selectedPet!.species), color: AppTheme.backgroundCharcoal, size: 24),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _selectedPet!.name,
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textLight),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${_selectedPet!.species} ${_selectedPet!.breed != null ? "• ${_selectedPet!.breed}" : ""}',
                                    style: const TextStyle(color: AppTheme.primaryMint, fontSize: 12, fontWeight: FontWeight.w600),
                                  ),
                                  Text(
                                    'Tutor: ${_selectedPet!.owner?.name ?? (_selectedTutor?.name ?? "N/A")}',
                                    style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close_rounded, color: AppTheme.alertRed),
                              tooltip: 'Cambiar Mascota',
                              onPressed: () {
                                setState(() {
                                  _selectedPet = null;
                                });
                              },
                            ),
                          ],
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

  IconData _getSpeciesIcon(String species) {
    final s = species.toUpperCase();
    if (s.contains('DOG') || s.contains('PERRO')) return Icons.pets_rounded;
    if (s.contains('CAT') || s.contains('GATO')) return Icons.cruelty_free_rounded;
    if (s.contains('BIRD') || s.contains('AVE')) return Icons.flutter_dash_rounded;
    return Icons.pets_rounded;
  }
}
