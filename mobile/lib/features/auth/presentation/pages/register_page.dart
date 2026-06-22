import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../config/theme/app_theme.dart';
import '../../widgets/auth_text_field.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  String _selectedRole = 'OWNER'; // OWNER por defecto
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      context.read<AuthBloc>().add(
        RegisterRequested(
          name: _nameController.text.trim(),
          email: _emailController.text.trim(),
          phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
          password: _passwordController.text,
          role: _selectedRole,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppTheme.alertRed,
              ),
            );
          } else if (state is Authenticated) {
            final route = state.user.role == 'VET' ? '/vet-home' : '/owner-home';
            Navigator.of(context).pushNamedAndRemoveUntil(route, (route) => false);
          }
        },
        builder: (context, state) {
          final isLoading = state is AuthLoading;

          return SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Crear Cuenta',
                        style: Theme.of(context).textTheme.headlineLarge,
                        textAlign: TextAlign.left,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Únete a la plataforma de cuidado post-operatorio',
                        style: TextStyle(color: AppTheme.textMuted),
                      ),
                      const SizedBox(height: 32),

                      // Selección de Rol (Premium Toggle)
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _selectedRole = 'OWNER'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                decoration: BoxDecoration(
                                  color: _selectedRole == 'OWNER'
                                      ? AppTheme.primaryMint.withOpacity(0.15)
                                      : AppTheme.darkMetallic.withOpacity(0.3),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: _selectedRole == 'OWNER' ? AppTheme.primaryMint : AppTheme.darkMetallic,
                                    width: 1.5,
                                  ),
                                ),
                                child: Column(
                                  children: [
                                    Icon(
                                      Icons.person_outline_rounded,
                                      color: _selectedRole == 'OWNER' ? AppTheme.primaryMint : AppTheme.textMuted,
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Dueño de Mascota',
                                      style: TextStyle(
                                        color: _selectedRole == 'OWNER' ? AppTheme.textLight : AppTheme.textMuted,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _selectedRole = 'VET'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                decoration: BoxDecoration(
                                  color: _selectedRole == 'VET'
                                      ? AppTheme.primaryMint.withOpacity(0.15)
                                      : AppTheme.darkMetallic.withOpacity(0.3),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: _selectedRole == 'VET' ? AppTheme.primaryMint : AppTheme.darkMetallic,
                                    width: 1.5,
                                  ),
                                ),
                                child: Column(
                                  children: [
                                    Icon(
                                      Icons.local_hospital_outlined,
                                      color: _selectedRole == 'VET' ? AppTheme.primaryMint : AppTheme.textMuted,
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Veterinario',
                                      style: TextStyle(
                                        color: _selectedRole == 'VET' ? AppTheme.textLight : AppTheme.textMuted,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Campo Nombre
                      AuthTextField(
                        controller: _nameController,
                        labelText: 'Nombre Completo',
                        hintText: 'Juan Pérez',
                        prefixIcon: Icons.person_outline_rounded,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Por favor ingresa tu nombre';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Campo Email
                      AuthTextField(
                        controller: _emailController,
                        labelText: 'Correo Electrónico',
                        hintText: 'ejemplo@correo.com',
                        prefixIcon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Por favor ingresa tu correo';
                          }
                          if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                            return 'Ingresa un correo electrónico válido';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Campo Teléfono
                      AuthTextField(
                        controller: _phoneController,
                        labelText: 'Teléfono (Opcional)',
                        hintText: '+56 9 1234 5678',
                        prefixIcon: Icons.phone_outlined,
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 16),

                      // Campo Password
                      AuthTextField(
                        controller: _passwordController,
                        labelText: 'Contraseña',
                        hintText: '••••••••',
                        prefixIcon: Icons.lock_outline_rounded,
                        isPassword: _obscurePassword,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            color: AppTheme.textMuted,
                          ),
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Por favor ingresa una contraseña';
                          }
                          if (value.length < 6) {
                            return 'La contraseña debe tener al menos 6 caracteres';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 32),

                      // Botón Registrar
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
                            : const Text('Registrarse'),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
