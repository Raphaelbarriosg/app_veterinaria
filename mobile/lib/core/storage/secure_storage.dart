import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage();
  static const _keyToken = 'access_token';
  static const _keyRefreshToken = 'refresh_token';
  static const _keyRole = 'user_role';
  static const _keyDeviceToken = 'device_token';

  // Guardar token JWT (Access Token)
  Future<void> saveToken(String token) async {
    await _storage.write(key: _keyToken, value: token);
  }

  // Obtener token JWT (Access Token)
  Future<String?> getToken() async {
    return await _storage.read(key: _keyToken);
  }

  // Guardar Refresh Token
  Future<void> saveRefreshToken(String refreshToken) async {
    await _storage.write(key: _keyRefreshToken, value: refreshToken);
  }

  // Obtener Refresh Token
  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _keyRefreshToken);
  }

  // Guardar rol del usuario
  Future<void> saveRole(String role) async {
    await _storage.write(key: _keyRole, value: role);
  }

  // Obtener rol del usuario
  Future<String?> getRole() async {
    return await _storage.read(key: _keyRole);
  }

  // Guardar Device Token (Push FCM)
  Future<void> saveDeviceToken(String token) async {
    await _storage.write(key: _keyDeviceToken, value: token);
  }

  // Obtener Device Token (Push FCM)
  Future<String?> getDeviceToken() async {
    return await _storage.read(key: _keyDeviceToken);
  }

  // Borrar credenciales (Logout)
  Future<void> clearAll() async {
    await _storage.delete(key: _keyToken);
    await _storage.delete(key: _keyRefreshToken);
    await _storage.delete(key: _keyRole);
    await _storage.delete(key: _keyDeviceToken);
  }
}
