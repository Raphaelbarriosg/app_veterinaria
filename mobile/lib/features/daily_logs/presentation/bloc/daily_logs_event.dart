import 'package:equatable/equatable.dart';

abstract class DailyLogsEvent extends Equatable {
  const DailyLogsEvent();

  @override
  List<Object?> get props => [];
}

class LoadDailyLogs extends DailyLogsEvent {
  final String treatmentId;
  const LoadDailyLogs(this.treatmentId);

  @override
  List<Object?> get props => [treatmentId];
}

class CreateDailyLogRequested extends DailyLogsEvent {
  final String treatmentId;
  final bool medicineTaken;
  final int appetiteLevel;
  final int energyLevel;
  final String? alarmSigns;
  final String? imagePath; // Path local para subir a Cloudinary

  const CreateDailyLogRequested({
    required this.treatmentId,
    required this.medicineTaken,
    required this.appetiteLevel,
    required this.energyLevel,
    this.alarmSigns,
    this.imagePath,
  });

  @override
  List<Object?> get props => [treatmentId, medicineTaken, appetiteLevel, energyLevel, alarmSigns, imagePath];
}
