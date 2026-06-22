import 'package:equatable/equatable.dart';
import '../../data/models/daily_log_model.dart';

abstract class DailyLogsState extends Equatable {
  const DailyLogsState();

  @override
  List<Object?> get props => [];
}

class DailyLogsInitial extends DailyLogsState {}

class DailyLogsLoading extends DailyLogsState {}

class DailyLogsLoaded extends DailyLogsState {
  final List<DailyLogModel> logs;
  const DailyLogsLoaded(this.logs);

  @override
  List<Object?> get props => [logs];
}

class DailyLogsOperationSuccess extends DailyLogsState {
  final String message;
  const DailyLogsOperationSuccess(this.message);

  @override
  List<Object?> get props => [message];
}

class DailyLogsError extends DailyLogsState {
  final String message;
  const DailyLogsError(this.message);

  @override
  List<Object?> get props => [message];
}
