import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'config/theme/app_theme.dart';
import 'core/network/api_client.dart';

// Repositories
import 'features/auth/data/repositories/auth_repository.dart';
import 'features/pets/data/repositories/pets_repository.dart';
import 'features/treatments/data/repositories/treatments_repository.dart';
import 'features/daily_logs/data/repositories/daily_logs_repository.dart';

// Blocs
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/bloc/auth_event.dart';
import 'features/auth/presentation/bloc/auth_state.dart';
import 'features/pets/presentation/bloc/pets_bloc.dart';
import 'features/treatments/presentation/bloc/treatments_bloc.dart';
import 'features/daily_logs/presentation/bloc/daily_logs_bloc.dart';

// Pages
import 'features/auth/presentation/pages/login_page.dart';
import 'features/auth/presentation/pages/register_page.dart';
import 'features/home/pages/owner_home_page.dart';
import 'features/home/pages/vet_home_page.dart';
import 'features/pets/presentation/pages/pet_detail_page.dart';
import 'features/pets/presentation/pages/pet_form_page.dart';
import 'features/pets/data/models/pet_model.dart';
import 'features/treatments/presentation/pages/create_treatment_page.dart';
import 'features/treatments/presentation/pages/treatment_detail_page.dart';
import 'features/daily_logs/presentation/pages/daily_log_form_page.dart';
import 'features/daily_logs/presentation/pages/daily_logs_history_page.dart';

class VetApp extends StatelessWidget {
  final ApiClient apiClient;

  const VetApp({super.key, required this.apiClient});

  @override
  Widget build(BuildContext context) {
    // Inicializar Repositorios
    final authRepository = AuthRepository(apiClient);
    final petsRepository = PetsRepository(apiClient);
    final treatmentsRepository = TreatmentsRepository(apiClient);
    final dailyLogsRepository = DailyLogsRepository(apiClient);

    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<AuthRepository>.value(value: authRepository),
        RepositoryProvider<PetsRepository>.value(value: petsRepository),
        RepositoryProvider<TreatmentsRepository>.value(value: treatmentsRepository),
        RepositoryProvider<DailyLogsRepository>.value(value: dailyLogsRepository),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider<AuthBloc>(
            create: (context) => AuthBloc(authRepository)..add(CheckAuthStatus()),
          ),
          BlocProvider<PetsBloc>(
            create: (context) => PetsBloc(petsRepository),
          ),
          BlocProvider<TreatmentsBloc>(
            create: (context) => TreatmentsBloc(treatmentsRepository),
          ),
          BlocProvider<DailyLogsBloc>(
            create: (context) => DailyLogsBloc(dailyLogsRepository),
          ),
        ],
        child: MaterialApp(
          title: 'VetCare MVP',
          theme: AppTheme.darkTheme,
          debugShowCheckedModeBanner: false,
          home: const _AuthGate(),
          onGenerateRoute: (settings) {
            switch (settings.name) {
              case '/login':
                return MaterialPageRoute(builder: (_) => const LoginPage());
              case '/register':
                return MaterialPageRoute(builder: (_) => const RegisterPage());
              case '/owner-home':
                return MaterialPageRoute(builder: (_) => const OwnerHomePage());
              case '/vet-home':
                return MaterialPageRoute(builder: (_) => const VetHomePage());
              case '/pet-detail':
                final petId = settings.arguments as String;
                return MaterialPageRoute(builder: (_) => PetDetailPage(petId: petId));
              case '/pet-form':
                final petToEdit = settings.arguments as PetModel?;
                return MaterialPageRoute(builder: (_) => PetFormPage(petToEdit: petToEdit));
              case '/create-treatment':
                return MaterialPageRoute(builder: (_) => const CreateTreatmentPage());
              case '/treatment-detail':
                final id = settings.arguments as String;
                return MaterialPageRoute(builder: (_) => TreatmentDetailPage(treatmentId: id));
              case '/daily-log-form':
                final treatmentId = settings.arguments as String;
                return MaterialPageRoute(builder: (_) => DailyLogFormPage(treatmentId: treatmentId));
              case '/daily-logs-history':
                final treatmentId = settings.arguments as String;
                return MaterialPageRoute(builder: (_) => DailyLogsHistoryPage(treatmentId: treatmentId));
              default:
                return MaterialPageRoute(
                  builder: (_) => Scaffold(
                    body: Center(
                      child: Text('Ruta no definida: ${settings.name}'),
                    ),
                  ),
                );
            }
          },
        ),
      ),
    );
  }
}

class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is AuthInitial || state is AuthLoading) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(color: AppTheme.primaryMint),
            ),
          );
        } else if (state is Authenticated) {
          if (state.user.role == 'VET') {
            return const VetHomePage();
          } else {
            return const OwnerHomePage();
          }
        } else {
          return const LoginPage();
        }
      },
    );
  }
}
