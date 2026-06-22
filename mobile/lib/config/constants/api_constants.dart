class ApiConstants {
  static const String baseUrl = 'http://192.168.1.199:3000/api/v1';

  // Auth Endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';

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

  // Cloudinary Endpoints
  static const String cloudinarySignature = '/cloudinary/signature';
}
