import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../config/theme/app_theme.dart';
import '../bloc/daily_logs_bloc.dart';
import '../bloc/daily_logs_event.dart';
import '../bloc/daily_logs_state.dart';

class DailyLogFormPage extends StatefulWidget {
  final String treatmentId;

  const DailyLogFormPage({super.key, required this.treatmentId});

  @override
  State<DailyLogFormPage> createState() => _DailyLogFormPageState();
}

class _DailyLogFormPageState extends State<DailyLogFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _alarmSignsController = TextEditingController();
  final _observationsController = TextEditingController();
  final _temperatureController = TextEditingController();

  bool _medicineTaken = true;
  double _appetiteLevel = 3.0; // 1-5
  double _energyLevel = 3.0;   // 1-5
  double _painLevel = 5.0;     // 1-10

  File? _selectedImage;
  final ImagePicker _picker = ImagePicker();

  @override
  void dispose() {
    _alarmSignsController.dispose();
    _observationsController.dispose();
    _temperatureController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      if (image != null) {
        setState(() {
          _selectedImage = File(image.path);
        });
      }
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error al seleccionar la imagen'), backgroundColor: AppTheme.alertRed),
      );
    }
  }

  void _showImagePickerOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surfaceSlate,
      builder: (BuildContext context) {
        return SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library_outlined, color: AppTheme.primaryMint),
                title: const Text('Galería', style: TextStyle(color: AppTheme.textLight)),
                onTap: () {
                  Navigator.of(context).pop();
                  _pickImage(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt_outlined, color: AppTheme.primaryMint),
                title: const Text('Cámara', style: TextStyle(color: AppTheme.textLight)),
                onTap: () {
                  Navigator.of(context).pop();
                  _pickImage(ImageSource.camera);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final temp = double.tryParse(_temperatureController.text.trim());
      context.read<DailyLogsBloc>().add(
        CreateDailyLogRequested(
          treatmentId: widget.treatmentId,
          medicineTaken: _medicineTaken,
          appetiteLevel: _appetiteLevel.toInt(),
          energyLevel: _energyLevel.toInt(),
          painLevel: _painLevel.toInt(),
          temperature: temp,
          alarmSigns: _alarmSignsController.text.trim(),
          observations: _observationsController.text.trim(),
          imagePath: _selectedImage?.path,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reportar Evolución', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: BlocConsumer<DailyLogsBloc, DailyLogsState>(
        listener: (context, state) {
          if (state is DailyLogsOperationSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppTheme.alertGreen),
            );
            Navigator.of(context).pop(true);
          } else if (state is DailyLogsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppTheme.alertRed),
            );
          }
        },
        builder: (context, state) {
          final isLoading = state is DailyLogsLoading;

          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // 1. MEDICAMENTOS
                    Card(
                      child: SwitchListTile(
                        title: const Text('¿Tomó su medicina hoy?', style: TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: const Text('Confirma si cumplió con la dosis estipulada.', style: TextStyle(fontSize: 12)),
                        value: _medicineTaken,
                        activeThumbColor: AppTheme.primaryMint,
                        onChanged: isLoading ? null : (val) {
                          setState(() {
                            _medicineTaken = val;
                          });
                        },
                      ),
                    ),
                    const SizedBox(height: 20),

                    // 2. APETITO Y ENERGÍA
                    const Text('Estado General', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textLight)),
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          children: [
                            // Apetito Slider
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Nivel de Apetito:', style: TextStyle(fontWeight: FontWeight.bold)),
                                Text('${_appetiteLevel.toInt()}/5', style: const TextStyle(color: AppTheme.primaryMint, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            Slider(
                              value: _appetiteLevel,
                              min: 1.0,
                              max: 5.0,
                              divisions: 4,
                              activeColor: AppTheme.primaryMint,
                              inactiveColor: AppTheme.darkMetallic,
                              onChanged: isLoading ? null : (val) {
                                setState(() {
                                  _appetiteLevel = val;
                                });
                              },
                            ),
                            const Divider(color: AppTheme.darkMetallic, height: 24),
                            // Energía Slider
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Nivel de Energía:', style: TextStyle(fontWeight: FontWeight.bold)),
                                Text('${_energyLevel.toInt()}/5', style: const TextStyle(color: AppTheme.primaryMint, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            Slider(
                              value: _energyLevel,
                              min: 1.0,
                              max: 5.0,
                              divisions: 4,
                              activeColor: AppTheme.primaryMint,
                              inactiveColor: AppTheme.darkMetallic,
                              onChanged: isLoading ? null : (val) {
                                setState(() {
                                  _energyLevel = val;
                                });
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // 3. DOLOR Y TEMPERATURA
                    const Text('Signos Vitales', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textLight)),
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          children: [
                            // Nivel de Dolor Slider (1-10)
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Nivel de Dolor:', style: TextStyle(fontWeight: FontWeight.bold)),
                                Row(
                                  children: [
                                    Icon(
                                      _painLevel <= 3 ? Icons.sentiment_very_satisfied :
                                      _painLevel <= 6 ? Icons.sentiment_neutral :
                                      Icons.sentiment_very_dissatisfied,
                                      color: _painLevel <= 3 ? AppTheme.alertGreen :
                                             _painLevel <= 6 ? AppTheme.alertYellow :
                                             AppTheme.alertRed,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 6),
                                    Text('${_painLevel.toInt()}/10', style: const TextStyle(color: AppTheme.primaryMint, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ],
                            ),
                            Slider(
                              value: _painLevel,
                              min: 1.0,
                              max: 10.0,
                              divisions: 9,
                              activeColor: _painLevel <= 3 ? AppTheme.alertGreen :
                                           _painLevel <= 6 ? AppTheme.alertYellow :
                                           AppTheme.alertRed,
                              inactiveColor: AppTheme.darkMetallic,
                              onChanged: isLoading ? null : (val) {
                                setState(() {
                                  _painLevel = val;
                                });
                              },
                            ),
                            const Divider(color: AppTheme.darkMetallic, height: 24),
                            // Temperatura Rectal
                            const Row(
                              children: [
                                Icon(Icons.thermostat_outlined, color: AppTheme.textMuted, size: 20),
                                SizedBox(width: 8),
                                Text('Temperatura Rectal (°C):', style: TextStyle(fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            TextFormField(
                              controller: _temperatureController,
                              style: const TextStyle(color: AppTheme.textLight),
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(
                                hintText: 'Ej. 38.5',
                                labelText: 'Temperatura en °C',
                                prefixIcon: Icon(Icons.thermostat_outlined, color: AppTheme.primaryMint),
                              ),
                              validator: (value) {
                                if (value != null && value.isNotEmpty) {
                                  final parsed = double.tryParse(value);
                                  if (parsed == null) {
                                    return 'Ingresa un número válido';
                                  }
                                  if (parsed < 35 || parsed > 43) {
                                    return 'La temperatura debe estar entre 35°C y 43°C';
                                  }
                                }
                                return null;
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // 4. OBSERVACIONES
                    const Text('Observaciones (Opcional)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textLight)),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _observationsController,
                      style: const TextStyle(color: AppTheme.textLight),
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Notas adicionales sobre la evolución',
                        hintText: 'Ej. Ha comido bien pero sigue algo decaído.',
                        alignLabelWithHint: true,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // 5. SÍNTOMAS DE ALARMA
                    const Text('Síntomas de Alarma (Opcional)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textLight)),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _alarmSignsController,
                      style: const TextStyle(color: AppTheme.textLight),
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Describir si vomita, cojea, etc.',
                        hintText: 'Ej. Ha estado cojeando un poco o tiene la herida ligeramente inflamada.',
                        alignLabelWithHint: true,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // 6. ADJUNTAR FOTO
                    const Text('Foto de la Recuperación', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textLight)),
                    const SizedBox(height: 12),
                    if (_selectedImage == null)
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppTheme.primaryMint),
                          foregroundColor: AppTheme.primaryMint,
                          minimumSize: const Size.fromHeight(60),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: isLoading ? null : _showImagePickerOptions,
                        icon: const Icon(Icons.add_a_photo_outlined),
                        label: const Text('Adjuntar Foto de la Herida/Paciente'),
                      )
                    else
                      Card(
                        child: Column(
                          children: [
                            ClipRRect(
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                              child: Image.file(
                                _selectedImage!,
                                height: 200,
                                width: double.infinity,
                                fit: BoxFit.cover,
                              ),
                            ),
                            ListTile(
                              title: const Text('Foto adjunta', style: TextStyle(fontSize: 13, color: AppTheme.textLight)),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete_outline_rounded, color: AppTheme.alertRed),
                                onPressed: () {
                                  setState(() {
                                    _selectedImage = null;
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 40),

                    // BOTÓN ENVIAR
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
                          : const Text('Enviar Reporte Diario'),
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
