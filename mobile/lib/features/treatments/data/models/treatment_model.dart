import '../../../pets/data/models/pet_model.dart';
import '../../../auth/data/models/user_model.dart';

class TreatmentRuleModel {
  final String id;
  final String treatmentId;
  final String medicineName;
  final String dosage;
  final int frequencyHours;
  final bool requirePhoto;

  const TreatmentRuleModel({
    required this.id,
    required this.treatmentId,
    required this.medicineName,
    required this.dosage,
    required this.frequencyHours,
    required this.requirePhoto,
  });

  factory TreatmentRuleModel.fromJson(Map<String, dynamic> json) {
    return TreatmentRuleModel(
      id: json['id'] as String,
      treatmentId: json['treatmentId'] as String,
      medicineName: json['medicineName'] as String,
      dosage: json['dosage'] as String,
      frequencyHours: json['frequencyHours'] as int,
      requirePhoto: json['requirePhoto'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'treatmentId': treatmentId,
      'medicineName': medicineName,
      'dosage': dosage,
      'frequencyHours': frequencyHours,
      'requirePhoto': requirePhoto,
    };
  }
}

class TreatmentModel {
  final String id;
  final String vetId;
  final String petId;
  final String diagnosis;
  final DateTime startDate;
  final DateTime? endDate;
  final String status;
  final DateTime? createdAt;
  final List<TreatmentRuleModel> rules;
  final PetModel? pet;
  final UserModel? vet;
  final List<dynamic>? dailyLogs; // Tipar a DailyLogModel después

  const TreatmentModel({
    required this.id,
    required this.vetId,
    required this.petId,
    required this.diagnosis,
    required this.startDate,
    this.endDate,
    required this.status,
    this.createdAt,
    required this.rules,
    this.pet,
    this.vet,
    this.dailyLogs,
  });

  factory TreatmentModel.fromJson(Map<String, dynamic> json) {
    final rulesJson = json['rules'] as List<dynamic>? ?? [];
    return TreatmentModel(
      id: json['id'] as String,
      vetId: json['vetId'] as String,
      petId: json['petId'] as String,
      diagnosis: json['diagnosis'] as String,
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: json['endDate'] != null ? DateTime.parse(json['endDate'] as String) : null,
      status: json['status'] as String? ?? 'ACTIVE',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : null,
      rules: rulesJson.map((r) => TreatmentRuleModel.fromJson(r as Map<String, dynamic>)).toList(),
      pet: json['pet'] != null ? PetModel.fromJson(json['pet'] as Map<String, dynamic>) : null,
      vet: json['vet'] != null ? UserModel.fromJson(json['vet'] as Map<String, dynamic>) : null,
      dailyLogs: json['dailyLogs'] as List<dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'vetId': vetId,
      'petId': petId,
      'diagnosis': diagnosis,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      'status': status,
      'rules': rules.map((r) => r.toJson()).toList(),
    };
  }
}
