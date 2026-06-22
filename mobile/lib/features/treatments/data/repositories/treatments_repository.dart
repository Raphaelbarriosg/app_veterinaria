import '../../../../core/network/api_client.dart';
import '../../../../config/constants/api_constants.dart';
import '../../../pets/data/models/pet_model.dart';
import '../models/treatment_model.dart';

class DashboardStats {
  final int expectedDoses;
  final int actualDoses;
  final bool hasAlarmSigns;
  final bool hasLowLevels;
  final int logsCount24h;

  const DashboardStats({
    required this.expectedDoses,
    required this.actualDoses,
    required this.hasAlarmSigns,
    required this.hasLowLevels,
    required this.logsCount24h,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      expectedDoses: json['expectedDoses'] as int? ?? 0,
      actualDoses: json['actualDoses'] as int? ?? 0,
      hasAlarmSigns: json['hasAlarmSigns'] as bool? ?? false,
      hasLowLevels: json['hasLowLevels'] as bool? ?? false,
      logsCount24h: json['logsCount24h'] as int? ?? 0,
    );
  }
}

class DashboardItemModel {
  final String treatmentId;
  final PetModel pet;
  final String diagnosis;
  final DateTime startDate;
  final String priority; // 'RED' | 'YELLOW' | 'GREEN'
  final DashboardStats stats;
  final List<dynamic> recentLogs;

  const DashboardItemModel({
    required this.treatmentId,
    required this.pet,
    required this.diagnosis,
    required this.startDate,
    required this.priority,
    required this.stats,
    required this.recentLogs,
  });

  factory DashboardItemModel.fromJson(Map<String, dynamic> json) {
    return DashboardItemModel(
      treatmentId: json['treatmentId'] as String,
      pet: PetModel.fromJson(json['pet'] as Map<String, dynamic>),
      diagnosis: json['diagnosis'] as String,
      startDate: DateTime.parse(json['startDate'] as String),
      priority: json['priority'] as String,
      stats: DashboardStats.fromJson(json['stats'] as Map<String, dynamic>),
      recentLogs: json['recentLogs'] as List<dynamic>? ?? [],
    );
  }
}

class TreatmentsRepository {
  final ApiClient _apiClient;

  TreatmentsRepository(this._apiClient);

  /// Obtener dashboard de semáforo del veterinario
  Future<List<DashboardItemModel>> getVetDashboard() async {
    final response = await _apiClient.dio.get(ApiConstants.vetDashboard);
    final list = response.data as List<dynamic>;
    return list.map((json) => DashboardItemModel.fromJson(json)).toList();
  }

  /// Obtener tratamientos del veterinario con filtro de estatus opcional
  Future<List<TreatmentModel>> getVetTreatments({String? status}) async {
    final queryParameters = <String, dynamic>{};
    if (status != null && status.isNotEmpty) {
      queryParameters['status'] = status;
    }
    
    final response = await _apiClient.dio.get(
      '${ApiConstants.treatments}/by-vet',
      queryParameters: queryParameters,
    );
    final list = response.data as List<dynamic>;
    return list.map((json) => TreatmentModel.fromJson(json)).toList();
  }

  /// Obtener tratamientos de una mascota específica
  Future<List<TreatmentModel>> getPetTreatments(String petId) async {
    final response = await _apiClient.dio.get('${ApiConstants.petTreatments}/$petId');
    final list = response.data as List<dynamic>;
    return list.map((json) => TreatmentModel.fromJson(json)).toList();
  }

  /// Obtener detalle de tratamiento
  Future<TreatmentModel> getTreatmentDetail(String id) async {
    final response = await _apiClient.dio.get('${ApiConstants.treatments}/$id');
    return TreatmentModel.fromJson(response.data);
  }

  /// Crear tratamiento (solo VET)
  Future<TreatmentModel> createTreatment({
    required String petId,
    required String diagnosis,
    required DateTime startDate,
    DateTime? endDate,
    required List<Map<String, dynamic>> rules,
  }) async {
    final response = await _apiClient.dio.post(
      ApiConstants.treatments,
      data: {
        'petId': petId,
        'diagnosis': diagnosis,
        'startDate': startDate.toIso8601String(),
        if (endDate != null) 'endDate': endDate.toIso8601String(),
        'rules': rules,
      },
    );
    return TreatmentModel.fromJson(response.data);
  }

  /// Actualizar tratamiento (solo VET)
  Future<TreatmentModel> updateTreatment(
    String id, {
    String? diagnosis,
    DateTime? endDate,
    String? status,
  }) async {
    final response = await _apiClient.dio.patch(
      '${ApiConstants.treatments}/$id',
      data: {
        if (diagnosis != null) 'diagnosis': diagnosis,
        if (endDate != null) 'endDate': endDate.toIso8601String(),
        if (status != null) 'status': status,
      },
    );
    return TreatmentModel.fromJson(response.data);
  }
}
