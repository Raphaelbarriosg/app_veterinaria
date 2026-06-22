import 'package:equatable/equatable.dart';

abstract class TreatmentsEvent extends Equatable {
  const TreatmentsEvent();

  @override
  List<Object?> get props => [];
}

class LoadVetDashboard extends TreatmentsEvent {}

class LoadVetTreatments extends TreatmentsEvent {
  final String? status;
  const LoadVetTreatments({this.status});

  @override
  List<Object?> get props => [status];
}

class LoadPetTreatments extends TreatmentsEvent {
  final String petId;
  const LoadPetTreatments(this.petId);

  @override
  List<Object?> get props => [petId];
}

class LoadTreatmentDetail extends TreatmentsEvent {
  final String id;
  const LoadTreatmentDetail(this.id);

  @override
  List<Object?> get props => [id];
}

class CreateTreatmentRequested extends TreatmentsEvent {
  final String petId;
  final String diagnosis;
  final DateTime startDate;
  final DateTime? endDate;
  final List<Map<String, dynamic>> rules;

  const CreateTreatmentRequested({
    required this.petId,
    required this.diagnosis,
    required this.startDate,
    this.endDate,
    required this.rules,
  });

  @override
  List<Object?> get props => [petId, diagnosis, startDate, endDate, rules];
}

class UpdateTreatmentRequested extends TreatmentsEvent {
  final String id;
  final String? diagnosis;
  final DateTime? endDate;
  final String? status;

  const UpdateTreatmentRequested({
    required this.id,
    this.diagnosis,
    this.endDate,
    this.status,
  });

  @override
  List<Object?> get props => [id, diagnosis, endDate, status];
}
