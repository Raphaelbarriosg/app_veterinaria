import 'package:flutter_bloc/flutter_bloc.dart';
import '../../data/repositories/treatments_repository.dart';
import 'treatments_event.dart';
import 'treatments_state.dart';

class TreatmentsBloc extends Bloc<TreatmentsEvent, TreatmentsState> {
  final TreatmentsRepository _treatmentsRepository;

  TreatmentsBloc(this._treatmentsRepository) : super(TreatmentsInitial()) {
    on<LoadVetDashboard>(_onLoadVetDashboard);
    on<LoadVetTreatments>(_onLoadVetTreatments);
    on<LoadPetTreatments>(_onLoadPetTreatments);
    on<LoadTreatmentDetail>(_onLoadTreatmentDetail);
    on<CreateTreatmentRequested>(_onCreateTreatmentRequested);
    on<UpdateTreatmentRequested>(_onUpdateTreatmentRequested);
  }

  Future<void> _onLoadVetDashboard(LoadVetDashboard event, Emitter<TreatmentsState> emit) async {
    emit(TreatmentsLoading());
    try {
      final dashboardItems = await _treatmentsRepository.getVetDashboard();
      emit(VetDashboardLoaded(dashboardItems));
    } catch (e) {
      emit(TreatmentsError('Error al cargar el dashboard: ${e.toString()}'));
    }
  }

  Future<void> _onLoadVetTreatments(LoadVetTreatments event, Emitter<TreatmentsState> emit) async {
    emit(TreatmentsLoading());
    try {
      final treatments = await _treatmentsRepository.getVetTreatments(status: event.status);
      emit(TreatmentsLoaded(treatments));
    } catch (e) {
      emit(TreatmentsError('Error al cargar tratamientos: ${e.toString()}'));
    }
  }

  Future<void> _onLoadPetTreatments(LoadPetTreatments event, Emitter<TreatmentsState> emit) async {
    emit(TreatmentsLoading());
    try {
      final treatments = await _treatmentsRepository.getPetTreatments(event.petId);
      emit(TreatmentsLoaded(treatments));
    } catch (e) {
      emit(TreatmentsError('Error al cargar tratamientos de la mascota: ${e.toString()}'));
    }
  }

  Future<void> _onLoadTreatmentDetail(LoadTreatmentDetail event, Emitter<TreatmentsState> emit) async {
    emit(TreatmentsLoading());
    try {
      final treatment = await _treatmentsRepository.getTreatmentDetail(event.id);
      emit(TreatmentDetailLoaded(treatment));
    } catch (e) {
      emit(TreatmentsError('Error al cargar detalle del tratamiento: ${e.toString()}'));
    }
  }

  Future<void> _onCreateTreatmentRequested(CreateTreatmentRequested event, Emitter<TreatmentsState> emit) async {
    emit(TreatmentsLoading());
    try {
      await _treatmentsRepository.createTreatment(
        petId: event.petId,
        diagnosis: event.diagnosis,
        startDate: event.startDate,
        endDate: event.endDate,
        rules: event.rules,
      );
      emit(const TreatmentOperationSuccess('Tratamiento creado con éxito'));
    } catch (e) {
      emit(TreatmentsError('Error al crear tratamiento: ${e.toString()}'));
    }
  }

  Future<void> _onUpdateTreatmentRequested(UpdateTreatmentRequested event, Emitter<TreatmentsState> emit) async {
    emit(TreatmentsLoading());
    try {
      await _treatmentsRepository.updateTreatment(
        event.id,
        diagnosis: event.diagnosis,
        endDate: event.endDate,
        status: event.status,
      );
      emit(const TreatmentOperationSuccess('Tratamiento actualizado con éxito'));
    } catch (e) {
      emit(TreatmentsError('Error al actualizar tratamiento: ${e.toString()}'));
    }
  }
}
