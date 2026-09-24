import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/theme/app_theme.dart';
import '../../../auth/widgets/auth_text_field.dart';
import '../../data/models/pet_model.dart';
import '../bloc/pets_bloc.dart';
import '../bloc/pets_event.dart';
import '../bloc/pets_state.dart';

class PetFormPage extends StatefulWidget {
  final PetModel? petToEdit;

  const PetFormPage({super.key, this.petToEdit});

  @override
  State<PetFormPage> createState() => _PetFormPageState();
}

class _PetFormPageState extends State<PetFormPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _breedController;
  late final TextEditingController _weightController;
  
  String _selectedSpecies = 'Perro';
  DateTime? _selectedBirthDate;

  final List<String> _speciesOptions = ['Perro', 'Gato', 'Conejo', 'Ave', 'Otro'];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.petToEdit?.name ?? '');
    _breedController = TextEditingController(text: widget.petToEdit?.breed ?? '');
    _weightController = TextEditingController(
      text: widget.petToEdit?.weight != null ? widget.petToEdit!.weight.toString() : '',
    );
    
    if (widget.petToEdit != null) {
      if (_speciesOptions.contains(widget.petToEdit!.species)) {
        _selectedSpecies = widget.petToEdit!.species;
      } else {
        _selectedSpecies = 'Otro';
      }
      _selectedBirthDate = widget.petToEdit!.birthDate;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _breedController.dispose();
    _weightController.dispose();
    super.dispose();
  }

  Future<void> _selectBirthDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedBirthDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
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
    if (picked != null && picked != _selectedBirthDate) {
      setState(() {
        _selectedBirthDate = picked;
      });
    }
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final name = _nameController.text.trim();
      final breed = _breedController.text.trim();
      final weight = double.tryParse(_weightController.text.trim());

      if (widget.petToEdit != null) {
        context.read<PetsBloc>().add(
          UpdatePetRequested(
            id: widget.petToEdit!.id,
            name: name,
            species: _selectedSpecies,
            breed: breed.isEmpty ? null : breed,
            weight: weight,
            birthDate: _selectedBirthDate,
          ),
        );
      } else {
        context.read<PetsBloc>().add(
          CreatePetRequested(
            name: name,
            species: _selectedSpecies,
            breed: breed.isEmpty ? null : breed,
            weight: weight,
            birthDate: _selectedBirthDate,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.petToEdit != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Editar Mascota' : 'Registrar Mascota', style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: BlocConsumer<PetsBloc, PetsState>(
        listener: (context, state) {
          if (state is PetsOperationSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppTheme.alertGreen),
            );
            Navigator.of(context).pop(true);
          } else if (state is PetsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppTheme.alertRed),
            );
          }
        },
        builder: (context, state) {
          final isLoading = state is PetsLoading;

          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Campo Nombre
                    AuthTextField(
                      controller: _nameController,
                      labelText: 'Nombre de la Mascota',
                      hintText: 'Ej. Firulais',
                      prefixIcon: Icons.pets_rounded,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Por favor ingresa el nombre';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Selector de Especie (Dropdown)
                    DropdownButtonFormField<String>(
                      initialValue: _selectedSpecies,
                      decoration: const InputDecoration(
                        labelText: 'Especie',
                        prefixIcon: Icon(Icons.category_outlined, color: AppTheme.textMuted),
                      ),
                      dropdownColor: AppTheme.surfaceSlate,
                      style: const TextStyle(color: AppTheme.textLight),
                      items: _speciesOptions.map((species) {
                        return DropdownMenuItem<String>(
                          value: species,
                          child: Text(species),
                        );
                      }).toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() {
                            _selectedSpecies = value;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 16),

                    // Campo Raza
                    AuthTextField(
                      controller: _breedController,
                      labelText: 'Raza (Opcional)',
                      hintText: 'Ej. Golden Retriever',
                      prefixIcon: Icons.info_outline_rounded,
                    ),
                    const SizedBox(height: 16),

                    // Campo Peso
                    AuthTextField(
                      controller: _weightController,
                      labelText: 'Peso en kg (Opcional)',
                      hintText: 'Ej. 12.5',
                      prefixIcon: Icons.monitor_weight_outlined,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      validator: (value) {
                        if (value != null && value.isNotEmpty) {
                          if (double.tryParse(value) == null) {
                            return 'Ingresa un número válido';
                          }
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Selector de Fecha de Nacimiento
                    GestureDetector(
                      onTap: () => _selectBirthDate(context),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                        decoration: BoxDecoration(
                          color: AppTheme.darkMetallic.withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.darkMetallic, width: 1),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.cake_outlined, color: AppTheme.textMuted),
                            const SizedBox(width: 12),
                            Text(
                              _selectedBirthDate == null
                                  ? 'Fecha de Nacimiento (Opcional)'
                                  : 'Nacimiento: ${_selectedBirthDate!.day}/${_selectedBirthDate!.month}/${_selectedBirthDate!.year}',
                              style: TextStyle(
                                color: _selectedBirthDate == null ? AppTheme.textMuted : AppTheme.textLight,
                                fontSize: 16,
                              ),
                            ),
                            const Spacer(),
                            const Icon(Icons.arrow_drop_down_rounded, color: AppTheme.textMuted),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 40),

                    // Botón Guardar
                    ElevatedButton(
                      onPressed: isLoading ? null : _submit,
                      child: isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(AppTheme.backgroundCharcoal),
                              ),
                            )
                          : Text(isEditing ? 'Guardar Cambios' : 'Registrar Mascota'),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
