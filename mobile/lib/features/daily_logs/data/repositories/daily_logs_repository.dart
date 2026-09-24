import 'dart:io';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../config/constants/api_constants.dart';
import '../models/daily_log_model.dart';

class DailyLogsRepository {
  final ApiClient _apiClient;

  DailyLogsRepository(this._apiClient);

  /// Sube una imagen al backend (Supabase Storage vía /upload/image).
  /// Retorna la URL pública de la imagen, o null si falla.
  Future<String?> uploadImage(String filePath) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) return null;

      final fileName = filePath.split('/').last;
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          filePath,
          filename: fileName,
        ),
      });

      final response = await _apiClient.dio.post(
        ApiConstants.uploadImage,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data['url'] as String?;
      }
      return null;
    } catch (e) {
      // Si falla el upload, continuamos sin imagen
      return null;
    }
  }


  /// Crear un daily log de evolución
  Future<DailyLogModel> createLog({
    required String treatmentId,
    required bool medicineTaken,
    required int appetiteLevel,
    required int energyLevel,
    int? painLevel,
    double? temperature,
    String? alarmSigns,
    String? observations,
    String? imageUrl,
  }) async {
    final response = await _apiClient.dio.post(
      ApiConstants.dailyLogs,
      data: {
        'treatmentId': treatmentId,
        'medicineTaken': medicineTaken,
        'appetiteLevel': appetiteLevel,
        'energyLevel': energyLevel,
        if (painLevel != null) 'painLevel': painLevel,
        if (temperature != null) 'temperature': temperature,
        if (alarmSigns != null && alarmSigns.isNotEmpty) 'alarmSigns': alarmSigns,
        if (observations != null && observations.isNotEmpty) 'observations': observations,
        if (imageUrl != null) 'imageUrl': imageUrl,
      },
    );
    return DailyLogModel.fromJson(response.data);
  }

  /// Obtener historial de logs de un tratamiento (respuesta paginada)
  Future<List<DailyLogModel>> getLogsByTreatment(String treatmentId) async {
    final response = await _apiClient.dio.get(
      '${ApiConstants.treatmentLogs}/$treatmentId',
    );
    final data = response.data['data'] as List<dynamic>? ?? response.data as List<dynamic>;
    return data.map((json) => DailyLogModel.fromJson(json)).toList();
  }
}
