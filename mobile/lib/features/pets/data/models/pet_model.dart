import '../../../auth/data/models/user_model.dart';

class PetModel {
  final String id;
  final String ownerId;
  final String name;
  final String species;
  final String? breed;
  final double? weight;
  final DateTime? birthDate;
  final DateTime? createdAt;
  final UserModel? owner;
  final List<dynamic>? treatments; // Se puede tipar a TreatmentModel después

  const PetModel({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.species,
    this.breed,
    this.weight,
    this.birthDate,
    this.createdAt,
    this.owner,
    this.treatments,
  });

  factory PetModel.fromJson(Map<String, dynamic> json) {
    return PetModel(
      id: json['id'] as String,
      ownerId: json['ownerId'] as String,
      name: json['name'] as String,
      species: json['species'] as String,
      breed: json['breed'] as String?,
      weight: json['weight'] != null ? (json['weight'] as num).toDouble() : null,
      birthDate: json['birthDate'] != null ? DateTime.parse(json['birthDate'] as String) : null,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : null,
      owner: json['owner'] != null ? UserModel.fromJson(json['owner'] as Map<String, dynamic>) : null,
      treatments: json['treatments'] as List<dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ownerId': ownerId,
      'name': name,
      'species': species,
      'breed': breed,
      'weight': weight,
      'birthDate': birthDate?.toIso8601String(),
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  int get ageInMonths {
    if (birthDate == null) return 0;
    final now = DateTime.now();
    return (now.year - birthDate!.year) * 12 + now.month - birthDate!.month;
  }

  String get ageString {
    if (birthDate == null) return 'Edad desconocida';
    final months = ageInMonths;
    if (months < 12) {
      return '$months meses';
    } else {
      final years = (months / 12).floor();
      final remainingMonths = months % 12;
      if (remainingMonths == 0) {
        return '$years ${years == 1 ? "año" : "años"}';
      }
      return '$years ${years == 1 ? "año" : "años"} y $remainingMonths ${remainingMonths == 1 ? "mes" : "meses"}';
    }
  }
}
