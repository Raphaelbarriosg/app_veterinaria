import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../config/constants/api_constants.dart';
import '../models/user_model.dart';

class AuthRepository {
  final ApiClient _apiClient;
  final SecureStorage _storage = SecureStorage();

  AuthRepository(this._apiClient);

  /// Registrar nuevo usuario
  Future<UserModel> register({
    required String email,
    required String password,
    required String name,
    String? phone,
    required String role,
  }) async {
    final response = await _apiClient.dio.post(
      ApiConstants.register,
      data: {
        'email': email,
        'password': password,
        'name': name,
        'phone': phone,
        'role': role,
      },
    );

    final data = response.data;
    await _storage.saveToken(data['accessToken']);
    await _storage.saveRole(data['user']['role']);

    return UserModel.fromJson(data['user']);
  }

  /// Iniciar sesión
  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.dio.post(
      ApiConstants.login,
      data: {
        'email': email,
        'password': password,
      },
    );

    final data = response.data;
    await _storage.saveToken(data['accessToken']);
    await _storage.saveRole(data['user']['role']);

    return UserModel.fromJson(data['user']);
  }

  /// Obtener perfil del usuario actual
  Future<UserModel> getProfile() async {
    final response = await _apiClient.dio.get(ApiConstants.userMe);
    return UserModel.fromJson(response.data);
  }

  /// Actualizar perfil
  Future<UserModel> updateProfile({String? name, String? phone}) async {
    final response = await _apiClient.dio.patch(
      ApiConstants.userMe,
      data: {
        if (name != null) 'name': name,
        if (phone != null) 'phone': phone,
      },
    );
    return UserModel.fromJson(response.data);
  }

  /// Cerrar sesión
  Future<void> logout() async {
    await _storage.clearAll();
  }

  /// Verificar si hay sesión activa
  Future<bool> hasActiveSession() async {
    final token = await _storage.getToken();
    return token != null && token.isNotEmpty;
  }

  /// Obtener rol guardado
  Future<String?> getSavedRole() async {
    return await _storage.getRole();
  }
}
