class ApiConstants {
  /// URL base de la API. Se puede sobreescribir en tiempo de compilación:
  ///   flutter run --dart-define=API_BASE_URL=http://192.168.1.X:3000/api/v1
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://192.168.16.107:3000/api/v1',
  );

  // Auth Endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refresh = '/auth/refresh';

  // Users Endpoints
  static const String userMe = '/users/me';

  // Pets Endpoints
  static const String pets = '/pets';

  // Treatments Endpoints
  static const String treatments = '/treatments';
  static const String vetDashboard = '/treatments/dashboard';
  static const String petTreatments = '/treatments/by-pet';

  // Daily Logs Endpoints
  static const String dailyLogs = '/daily-logs';
  static const String treatmentLogs = '/daily-logs/treatment';

  // Upload Endpoint (Supabase Storage via backend)
  static const String uploadImage = '/upload/image';

  // Notifications Endpoints
  static const String deviceToken = '/notifications/device-token';
  static const String testPush = '/notifications/test';
}
