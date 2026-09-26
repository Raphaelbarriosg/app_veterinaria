import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/theme/app_theme.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../auth/data/repositories/auth_repository.dart';
import '../../data/models/pet_model.dart';
import '../../data/repositories/pets_repository.dart';

class TutorsListPage extends StatefulWidget {
  const TutorsListPage({super.key});

  @override
  State<TutorsListPage> createState() => _TutorsListPageState();
}

class _TutorsListPageState extends State<TutorsListPage> {
  final TextEditingController _searchController = TextEditingController();
  List<UserModel> _tutors = [];
  bool _isLoading = false;
  String? _errorMessage;

  // Mapa de mascotas por tutor (cargadas bajo demanda al expandir)
  final Map<String, List<PetModel>> _tutorPets = {};
  final Set<String> _loadingPetsTutorIds = {};
  final Set<String> _expandedTutorIds = {};

  @override
  void initState() {
    super.initState();
    _loadTutors();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadTutors([String? query]) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authRepo = context.read<AuthRepository>();
      final results = await authRepo.getTutors(query: query);
      if (mounted) {
        setState(() {
          _tutors = results;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error al cargar tutores: ${e.toString()}';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadPetsForTutor(String tutorId) async {
    if (_tutorPets.containsKey(tutorId) || _loadingPetsTutorIds.contains(tutorId)) {
      return;
    }

    setState(() {
      _loadingPetsTutorIds.add(tutorId);
    });

    try {
      final petsRepo = context.read<PetsRepository>();
      final pets = await petsRepo.getPetsByOwner(tutorId);
      if (mounted) {
        setState(() {
          _tutorPets[tutorId] = pets;
          _loadingPetsTutorIds.remove(tutorId);
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loadingPetsTutorIds.remove(tutorId);
        });
      }
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
                          'Nuevo Tutor / Cliente',
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
                        hintText: 'Ej. María González',
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
                        hintText: 'ejemplo@correo.com',
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
                        prefixIcon: const Icon(Icons.phone_outlined, color: AppTheme.textMuted),
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
                                  await authRepo.createTutor(
                                    name: nameCtrl.text.trim(),
                                    email: emailCtrl.text.trim().toLowerCase(),
                                    phone: phoneCtrl.text.trim().isEmpty ? null : phoneCtrl.text.trim(),
                                  );
                                  if (mounted) {
                                    Navigator.pop(ctx);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Tutor registrado correctamente'),
                                        backgroundColor: AppTheme.alertGreen,
                                      ),
                                    );
                                    _loadTutors();
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
                          : const Text('Guardar Tutor'),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pacientes y Tutores', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_alt_1_rounded, color: AppTheme.primaryMint),
            tooltip: 'Nuevo Tutor',
            onPressed: _showCreateTutorDialog,
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.textMuted),
            onPressed: () => _loadTutors(_searchController.text.trim()),
          ),
        ],
      ),
      body: Column(
        children: [
          // Campo de búsqueda
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: TextField(
              controller: _searchController,
              style: const TextStyle(color: AppTheme.textLight),
              decoration: InputDecoration(
                labelText: 'Buscar por tutor, correo o teléfono...',
                prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.textMuted),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, color: AppTheme.textMuted),
                        onPressed: () {
                          _searchController.clear();
                          _loadTutors();
                        },
                      )
                    : null,
              ),
              onChanged: (val) {
                _loadTutors(val.trim());
              },
            ),
          ),

          // Estado del listado
          Expanded(
            child: _buildBody(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.primaryMint,
        foregroundColor: AppTheme.backgroundCharcoal,
        icon: const Icon(Icons.person_add_rounded),
        label: const Text('Nuevo Tutor', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: _showCreateTutorDialog,
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primaryMint));
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded, color: AppTheme.alertRed, size: 48),
              const SizedBox(height: 16),
              Text(_errorMessage!, style: const TextStyle(color: AppTheme.textLight), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => _loadTutors(),
                child: const Text('Reintentar'),
              ),
            ],
          ),
        ),
      );
    }

    if (_tutors.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.people_outline_rounded, size: 72, color: AppTheme.textMuted.withValues(alpha: 0.3)),
              const SizedBox(height: 16),
              const Text(
                'Sin tutores registrados',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textLight),
              ),
              const SizedBox(height: 8),
              const Text(
                'Agrega a los dueños de mascotas para poder asociar pacientes y recetar tratamientos post-operatorios.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppTheme.textMuted),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _showCreateTutorDialog,
                icon: const Icon(Icons.person_add_rounded),
                label: const Text('Registrar Primer Tutor'),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: AppTheme.primaryMint,
      onRefresh: () async => _loadTutors(_searchController.text.trim()),
      child: ListView.builder(
        padding: const EdgeInsets.only(left: 16, right: 16, bottom: 80, top: 8),
        itemCount: _tutors.length,
        itemBuilder: (context, index) {
          final tutor = _tutors[index];
          final isExpanded = _expandedTutorIds.contains(tutor.id);
          final pets = _tutorPets[tutor.id];
          final isLoadingPets = _loadingPetsTutorIds.contains(tutor.id);

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                initiallyExpanded: isExpanded,
                onExpansionChanged: (expanded) {
                  setState(() {
                    if (expanded) {
                      _expandedTutorIds.add(tutor.id);
                      _loadPetsForTutor(tutor.id);
                    } else {
                      _expandedTutorIds.remove(tutor.id);
                    }
                  });
                },
                leading: CircleAvatar(
                  backgroundColor: AppTheme.primaryMint.withValues(alpha: 0.15),
                  child: Text(
                    tutor.name.isNotEmpty ? tutor.name[0].toUpperCase() : 'T',
                    style: const TextStyle(color: AppTheme.primaryMint, fontWeight: FontWeight.bold),
                  ),
                ),
                title: Text(
                  tutor.name,
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textLight),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 2),
                    Text(tutor.email, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                    if (tutor.phone != null && tutor.phone!.isNotEmpty)
                      Text(tutor.phone!, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                  ],
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.darkMetallic.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${tutor.petCount} masc.',
                        style: const TextStyle(color: AppTheme.primaryMint, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      isExpanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                      color: AppTheme.textMuted,
                    ),
                  ],
                ),
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    color: AppTheme.backgroundCharcoal.withValues(alpha: 0.3),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            const Text(
                              'Mascotas del tutor:',
                              style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textLight, fontSize: 13),
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
                                    'ownerId': tutor.id,
                                    'ownerName': tutor.name,
                                  },
                                ).then((created) {
                                  if (created == true) {
                                    _tutorPets.remove(tutor.id);
                                    _loadPetsForTutor(tutor.id);
                                    _loadTutors();
                                  }
                                });
                              },
                              icon: const Icon(Icons.add_rounded, size: 18),
                              label: const Text('+ Agregar Mascota', style: TextStyle(fontSize: 12)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        if (isLoadingPets)
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
                        else if (pets == null || pets.isEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12.0),
                            child: Row(
                              children: [
                                const Icon(Icons.pets_rounded, size: 18, color: AppTheme.textMuted),
                                const SizedBox(width: 8),
                                const Text(
                                  'Este tutor aún no tiene mascotas.',
                                  style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                ),
                                const Spacer(),
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
                                        'ownerId': tutor.id,
                                        'ownerName': tutor.name,
                                      },
                                    ).then((created) {
                                      if (created == true) {
                                        _tutorPets.remove(tutor.id);
                                        _loadPetsForTutor(tutor.id);
                                        _loadTutors();
                                      }
                                    });
                                  },
                                  child: const Text('Agregar', style: TextStyle(fontSize: 11)),
                                ),
                              ],
                            ),
                          )
                        else
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: pets.length,
                            separatorBuilder: (_, __) => const Divider(color: AppTheme.darkMetallic, height: 12),
                            itemBuilder: (context, pIndex) {
                              final pet = pets[pIndex];
                              return Row(
                                children: [
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundColor: AppTheme.primaryMint.withValues(alpha: 0.15),
                                    child: Icon(
                                      _getSpeciesIcon(pet.species),
                                      size: 16,
                                      color: AppTheme.primaryMint,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          pet.name,
                                          style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textLight, fontSize: 13),
                                        ),
                                        Text(
                                          '${pet.species} • ${pet.breed ?? "Sin raza"} ${pet.weight != null ? "• ${pet.weight} kg" : ""}',
                                          style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                                        ),
                                      ],
                                    ),
                                  ),
                                  ElevatedButton.icon(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.primaryMint,
                                      foregroundColor: AppTheme.backgroundCharcoal,
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      minimumSize: Size.zero,
                                    ),
                                    onPressed: () {
                                      Navigator.of(context).pushNamed(
                                        '/create-treatment',
                                        arguments: pet,
                                      );
                                    },
                                    icon: const Icon(Icons.medical_services_outlined, size: 14),
                                    label: const Text('Tratar', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              );
                            },
                          ),
                        const SizedBox(height: 8),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
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
