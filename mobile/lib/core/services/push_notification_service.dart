import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import '../network/api_client.dart';
import '../storage/secure_storage.dart';
import '../../config/constants/api_constants.dart';

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  final SecureStorage _storage = SecureStorage();
  late final ApiClient _apiClient = ApiClient();

  /// Determina la plataforma en tiempo de ejecución
  String get _currentPlatform {
    if (kIsWeb) return 'web';
    if (Platform.isIOS) return 'ios';
    return 'android';
  }

  /// Genera o recupera un token único de instalación del dispositivo
  Future<String> getOrGenerateDeviceToken() async {
    String? token = await _storage.getDeviceToken();
    if (token == null || token.isEmpty) {
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      token = 'vetcare_fcm_${_currentPlatform}_$timestamp';
      await _storage.saveDeviceToken(token);
    }
    return token;
  }

  /// Registra el token del dispositivo en el backend tras el login
  Future<bool> registerWithBackend({String? customToken}) async {
    try {
      final token = customToken ?? await getOrGenerateDeviceToken();
      final response = await _apiClient.dio.post(
        ApiConstants.deviceToken,
        data: {
          'token': token,
          'platform': _currentPlatform,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        await _storage.saveDeviceToken(token);
        debugPrint('[PushNotificationService] Token registrado con éxito: $token');
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('[PushNotificationService] Error al registrar device token: $e');
      return false;
    }
  }

  /// Revoca el token del dispositivo en el backend al cerrar sesión
  Future<void> unregisterFromBackend() async {
    try {
      final token = await _storage.getDeviceToken();
      if (token != null && token.isNotEmpty) {
        await _apiClient.dio.delete('${ApiConstants.deviceToken}/$token');
        debugPrint('[PushNotificationService] Token revocado con éxito: $token');
      }
    } catch (e) {
      debugPrint('[PushNotificationService] Error revocando device token: $e');
    }
  }
}
