import 'package:flutter/material.dart';
import '../../../config/theme/app_theme.dart';
import '../data/models/pet_model.dart';

class PetCard extends StatelessWidget {
  final PetModel pet;
  final VoidCallback onTap;

  const PetCard({
    super.key,
    required this.pet,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasActiveTreatments = pet.treatments != null && pet.treatments!.isNotEmpty;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              // Avatar con inicial
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: AppTheme.primaryMint.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.primaryMint.withValues(alpha: 0.3), width: 1.5),
                ),
                child: Center(
                  child: Text(
                    pet.name[0].toUpperCase(),
                    style: const TextStyle(
                      color: AppTheme.primaryMint,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              // Datos de la mascota
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      pet.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_getSpeciesEmoji(pet.species)} ${pet.speciesDisplay}${pet.breed != null ? " • ${pet.breed}" : ""}',
                      style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      pet.ageString,
                      style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                    ),
                  ],
                ),
              ),
              // Estado del tratamiento (Badge)
              if (hasActiveTreatments)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.alertYellow.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppTheme.alertYellow.withValues(alpha: 0.5), width: 1),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.healing_rounded, size: 12, color: AppTheme.alertYellow),
                      SizedBox(width: 4),
                      Text(
                        'En Tratamiento',
                        style: TextStyle(
                          color: AppTheme.alertYellow,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                )
              else
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: AppTheme.textMuted,
                  size: 16,
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _getSpeciesEmoji(String species) {
    final normalized = species.toLowerCase();
    if (normalized.contains('perro') || normalized.contains('can')) return '🐶';
    if (normalized.contains('gato') || normalized.contains('fel')) return '🐱';
    if (normalized.contains('ave') || normalized.contains('paj')) return '🐦';
    if (normalized.contains('conej')) return '🐰';
    return '🐾';
  }
}
