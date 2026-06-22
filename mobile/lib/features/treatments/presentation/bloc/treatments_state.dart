import 'package:equatable/equatable.dart';
import '../../data/models/treatment_model.dart';
import '../../data/repositories/treatments_repository.dart';

abstract class TreatmentsState extends Equatable {
  const TreatmentsState();

  @override
  List<Object?> get props => [];
}

class TreatmentsInitial extends TreatmentsState {}

class TreatmentsLoading extends TreatmentsState {}

class VetDashboardLoaded extends TreatmentsState {
  final List<DashboardItemModel> dashboardItems;
  const VetDashboardLoaded(this.dashboardItems);

  @override
  List<Object?> get props => [dashboardItems];
}

class TreatmentsLoaded extends TreatmentsState {
  final List<TreatmentModel> treatments;
  const TreatmentsLoaded(this.treatments);

  @override
  List<Object?> get props => [treatments];
}

class TreatmentDetailLoaded extends TreatmentsState {
  final TreatmentModel treatment;
  const TreatmentDetailLoaded(this.treatment);

  @override
  List<Object?> get props => [treatment];
}

class TreatmentOperationSuccess extends TreatmentsState {
  final String message;
  const TreatmentOperationSuccess(this.message);

  @override
  List<Object?> get props => [message];
}

class TreatmentsError extends TreatmentsState {
  final String message;
  const TreatmentsError(this.message);

  @override
  List<Object?> get props => [message];
}
