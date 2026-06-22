import 'package:dio/dio.dart';
import '../storage/secure_storage.dart';
import '../../config/constants/api_constants.dart';

class ApiClient {
  late final Dio _dio;
  final SecureStorage _storage = SecureStorage();

  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        contentType: 'application/json',
      ),
    );

    // Interceptor para inyectar token JWT automáticamente
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) {
          // Si expira el token o da 401, podríamos limpiar sesión aquí
          if (error.response?.statusCode == 401) {
            _storage.clearAll();
          }
          return handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;
}
