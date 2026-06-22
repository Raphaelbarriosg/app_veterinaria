import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../config/theme/app_theme.dart';
import '../../widgets/pet_card.dart';
import '../bloc/pets_bloc.dart';
import '../bloc/pets_event.dart';
import '../bloc/pets_state.dart';

class PetsListPage extends StatefulWidget {
  const PetsListPage({super.key});

  @override
  State<PetsListPage> createState() => _PetsListPageState();
}

class _PetsListPageState extends State<PetsListPage> {
  @override
  void initState() {
    super.initState();
    context.read<PetsBloc>().add(LoadPets());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Mascotas', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: BlocBuilder<PetsBloc, PetsState>(
        builder: (context, state) {
          if (state is PetsLoading) {
            return const Center(
              child: CircularProgressIndicator(color: AppTheme.primaryMint),
            );
          } else if (state is PetsLoaded) {
            final pets = state.pets;

            if (pets.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.pets_outlined,
                        size: 80,
                        color: AppTheme.textMuted.withOpacity(0.3),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Aún no tienes mascotas registradas',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textLight),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Agrega a tu compañero para llevar el control de su recuperación post-operatoria.',
                        style: TextStyle(color: AppTheme.textMuted),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: () {
                          Navigator.of(context).pushNamed('/pet-form').then((_) {
                            context.read<PetsBloc>().add(LoadPets());
                          });
                        },
                        icon: const Icon(Icons.add_rounded),
                        label: const Text('Registrar Mascota'),
                      ),
                    ],
                  ),
                ),
              );
            }

            return RefreshIndicator(
              color: AppTheme.primaryMint,
              onRefresh: () async {
                context.read<PetsBloc>().add(LoadPets());
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: pets.length,
                itemBuilder: (context, index) {
                  final pet = pets[index];
                  return PetCard(
                    pet: pet,
                    onTap: () {
                      Navigator.of(context).pushNamed(
                        '/pet-detail',
                        arguments: pet.id,
                      ).then((_) {
                        context.read<PetsBloc>().add(LoadPets());
                      });
                    },
                  );
                },
              ),
            );
          } else if (state is PetsError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline_rounded, color: AppTheme.alertRed, size: 48),
                  const SizedBox(height: 16),
                  Text(state.message, style: const TextStyle(color: AppTheme.textLight)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.read<PetsBloc>().add(LoadPets()),
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
          Navigator.of(context).pushNamed('/pet-form').then((_) {
            context.read<PetsBloc>().add(LoadPets());
          });
        },
        child: const Icon(Icons.add_rounded, size: 28),
      ),
    );
  }
}
