import 'dart:io';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../config/constants/api_constants.dart';
import '../models/daily_log_model.dart';

class DailyLogsRepository {
  final ApiClient _apiClient;

  DailyLogsRepository(this._apiClient);

  /// Obtener firma y subir imagen a Cloudinary (Signed Upload)
  Future<String?> uploadImageToCloudinary(String filePath) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) return null;

      // 1. Obtener firma del backend
      final sigResponse = await _apiClient.dio.get(
        ApiConstants.cloudinarySignature,
        queryParameters: {'folder': 'vet_app/daily_logs'},
      );
      final sigData = sigResponse.data;

      final String cloudName = sigData['cloudName'];
      final String apiKey = sigData['apiKey'];
      final int timestamp = sigData['timestamp'];
      final String signature = sigData['signature'];
      final String folder = sigData['folder'];

      // 2. Subir imagen directamente a Cloudinary mediante FormData
      final cloudinaryUrl = 'https://api.cloudinary.com/v1_1/$cloudName/image/upload';
      final fileName = filePath.split('/').last;

      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath, filename: fileName),
        'api_key': apiKey,
        'timestamp': timestamp.toString(),
        'signature': signature,
        'folder': folder,
      });

      // Creamos un dio limpio para la petición externa a Cloudinary sin interceptor JWT
      final cleanDio = Dio();
      final uploadResponse = await cleanDio.post(cloudinaryUrl, data: formData);

      if (uploadResponse.statusCode == 200 || uploadResponse.statusCode == 201) {
        return uploadResponse.data['secure_url'] as String;
      }
      return null;
    } catch (e) {
      // Si falla Cloudinary (por ejemplo, si las credenciales no están configuradas), retornamos null
      return null;
    }
  }

  /// Crear un daily log de evolución
  Future<DailyLogModel> createLog({
    required String treatmentId,
    required bool medicineTaken,
    required int appetiteLevel,
    required int energyLevel,
    String? alarmSigns,
    String? imageUrl,
  }) async {
    final response = await _apiClient.dio.post(
      ApiConstants.dailyLogs,
      data: {
        'treatmentId': treatmentId,
        'medicineTaken': medicineTaken,
        'appetiteLevel': appetiteLevel,
        'energyLevel': energyLevel,
        if (alarmSigns != null && alarmSigns.isNotEmpty) 'alarmSigns': alarmSigns,
        if (imageUrl != null) 'imageUrl': imageUrl,
      },
    );
    return DailyLogModel.fromJson(response.data);
  }

  /// Obtener historial de logs de un tratamiento
  Future<List<DailyLogModel>> getLogsByTreatment(String treatmentId) async {
    final response = await _apiClient.dio.get(
      '${ApiConstants.treatmentLogs}/$treatmentId',
    );
    final list = response.data as List<dynamic>;
    return list.map((json) => DailyLogModel.fromJson(json)).toList();
  }
}
