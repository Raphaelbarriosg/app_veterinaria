import 'package:dio/dio.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/services/push_notification_service.dart';
import '../../data/repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;
  final PushNotificationService _pushService = PushNotificationService();

  AuthBloc(this._authRepository) : super(AuthInitial()) {
    on<CheckAuthStatus>(_onCheckAuthStatus);
    on<LoginRequested>(_onLoginRequested);
    on<RegisterRequested>(_onRegisterRequested);
    on<LogoutRequested>(_onLogoutRequested);
  }

  Future<void> _onCheckAuthStatus(CheckAuthStatus event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final hasSession = await _authRepository.hasActiveSession();
      if (hasSession) {
        final user = await _authRepository.getProfile();
        // Registrar token si ya tiene sesión activa
        _pushService.registerWithBackend().ignore();
        emit(Authenticated(user));
      } else {
        emit(Unauthenticated());
      }
    } catch (e) {
      // Si falla obtener el perfil, consideramos la sesión como expirada/inválida
      await _authRepository.logout();
      emit(Unauthenticated());
    }
  }

  Future<void> _onLoginRequested(LoginRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final user = await _authRepository.login(
        email: event.email,
        password: event.password,
      );
      // Registrar dispositivo para notificaciones push tras login exitoso
      _pushService.registerWithBackend().ignore();
      emit(Authenticated(user));
    } catch (e) {
      emit(AuthError(_parseError(e)));
    }
  }

  Future<void> _onRegisterRequested(RegisterRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final user = await _authRepository.register(
        email: event.email,
        password: event.password,
        name: event.name,
        phone: event.phone,
        role: event.role,
      );
      // Registrar dispositivo tras registro exitoso
      _pushService.registerWithBackend().ignore();
      emit(Authenticated(user));
    } catch (e) {
      emit(AuthError(_parseError(e)));
    }
  }

  Future<void> _onLogoutRequested(LogoutRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      await _pushService.unregisterFromBackend();
      await _authRepository.logout();
      emit(Unauthenticated());
    } catch (e) {
      emit(const AuthError('Error al cerrar sesión'));
    }
  }

  String _parseError(dynamic e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        final msg = data['message'];
        if (msg is List) return msg.join(', ');
        return msg.toString();
      }
      if (e.response?.statusCode == 409) {
        return 'El correo electrónico ya está registrado.';
      }
      if (e.response?.statusCode == 401) {
        return 'Credenciales inválidas. Verifica tu correo o contraseña.';
      }
      if (e.response?.statusCode == 400) {
        return 'Datos de registro inválidos. Verifica la información ingresada.';
      }
      if (e.response?.statusCode == 500) {
        return 'Error en el servidor. Inténtalo de nuevo más tarde.';
      }
      return 'Error de conexión con el servidor. Verifica tu internet.';
    }
    if (e.toString().contains('401') || e.toString().contains('Unauthorized')) {
      return 'Credenciales inválidas. Verifica tu correo o contraseña.';
    }
    if (e.toString().contains('Conflict') || e.toString().contains('409')) {
      return 'El correo electrónico ya está registrado.';
    }
    return 'Ocurrió un error. Inténtalo de nuevo más tarde.';
  }
}
