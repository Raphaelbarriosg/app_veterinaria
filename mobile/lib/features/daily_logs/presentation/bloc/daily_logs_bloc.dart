import 'package:flutter_bloc/flutter_bloc.dart';
import '../../data/repositories/daily_logs_repository.dart';
import 'daily_logs_event.dart';
import 'daily_logs_state.dart';

class DailyLogsBloc extends Bloc<DailyLogsEvent, DailyLogsState> {
  final DailyLogsRepository _dailyLogsRepository;

  DailyLogsBloc(this._dailyLogsRepository) : super(DailyLogsInitial()) {
    on<LoadDailyLogs>(_onLoadDailyLogs);
    on<CreateDailyLogRequested>(_onCreateDailyLogRequested);
  }

  Future<void> _onLoadDailyLogs(LoadDailyLogs event, Emitter<DailyLogsState> emit) async {
    emit(DailyLogsLoading());
    try {
      final logs = await _dailyLogsRepository.getLogsByTreatment(event.treatmentId);
      emit(DailyLogsLoaded(logs));
    } catch (e) {
      emit(DailyLogsError('Error al cargar historial: ${e.toString()}'));
    }
  }

  Future<void> _onCreateDailyLogRequested(CreateDailyLogRequested event, Emitter<DailyLogsState> emit) async {
    emit(DailyLogsLoading());
    try {
      String? imageUrl;

      // 1. Subir a Cloudinary si hay una foto adjunta
      if (event.imagePath != null) {
        imageUrl = await _dailyLogsRepository.uploadImageToCloudinary(event.imagePath!);
      }

      // 2. Guardar el log en la base de datos
      await _dailyLogsRepository.createLog(
        treatmentId: event.treatmentId,
        medicineTaken: event.medicineTaken,
        appetiteLevel: event.appetiteLevel,
        energyLevel: event.energyLevel,
        alarmSigns: event.alarmSigns,
        imageUrl: imageUrl,
      );

      emit(const DailyLogsOperationSuccess('Reporte diario guardado con éxito'));
    } catch (e) {
      emit(DailyLogsError('Error al registrar reporte: ${e.toString()}'));
    }
  }
}
