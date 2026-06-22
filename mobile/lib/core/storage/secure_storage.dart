import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage();
  static const _keyToken = 'access_token';
  static const _keyRole = 'user_role';

  // Guardar token JWT
  Future<void> saveToken(String token) async {
    await _storage.write(key: _keyToken, value: token);
  }

  // Obtener token JWT
  Future<String?> getToken() async {
    return await _storage.read(key: _keyToken);
  }

  // Guardar rol del usuario
  Future<void> saveRole(String role) async {
    await _storage.write(key: _keyRole, value: role);
  }

  // Obtener rol del usuario
  Future<String?> getRole() async {
    return await _storage.read(key: _keyRole);
  }

  // Borrar credenciales (Logout)
  Future<void> clearAll() async {
    await _storage.delete(key: _keyToken);
    await _storage.delete(key: _keyRole);
  }
}
