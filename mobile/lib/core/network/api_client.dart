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

    // Interceptor para inyectar token JWT y rotación transparente en 401
    _dio.interceptors.add(
      QueuedInterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          // Si la respuesta es 401 y no proviene de login o refresh
          if (error.response?.statusCode == 401 &&
              !error.requestOptions.path.contains(ApiConstants.login) &&
              !error.requestOptions.path.contains(ApiConstants.refresh)) {
            final refreshToken = await _storage.getRefreshToken();
            if (refreshToken != null && refreshToken.isNotEmpty) {
              try {
                final refreshDio = Dio(BaseOptions(baseUrl: ApiConstants.baseUrl));
                final refreshResponse = await refreshDio.post(
                  ApiConstants.refresh,
                  data: {'refreshToken': refreshToken},
                );

                if (refreshResponse.statusCode == 200 || refreshResponse.statusCode == 201) {
                  final newAccessToken = refreshResponse.data['accessToken'];
                  final newRefreshToken = refreshResponse.data['refreshToken'];

                  await _storage.saveToken(newAccessToken);
                  if (newRefreshToken != null) {
                    await _storage.saveRefreshToken(newRefreshToken);
                  }

                  final opts = error.requestOptions;
                  opts.headers['Authorization'] = 'Bearer $newAccessToken';
                  final clonedResponse = await _dio.fetch(opts);
                  return handler.resolve(clonedResponse);
                }
              } catch (e) {
                await _storage.clearAll();
              }
            } else {
              await _storage.clearAll();
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;
}
