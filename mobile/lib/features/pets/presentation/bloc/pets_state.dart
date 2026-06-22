import 'package:equatable/equatable.dart';
import '../../data/models/pet_model.dart';

abstract class PetsState extends Equatable {
  const PetsState();

  @override
  List<Object?> get props => [];
}

class PetsInitial extends PetsState {}

class PetsLoading extends PetsState {}

class PetsLoaded extends PetsState {
  final List<PetModel> pets;
  const PetsLoaded(this.pets);

  @override
  List<Object?> get props => [pets];
}

class PetDetailLoaded extends PetsState {
  final PetModel pet;
  const PetDetailLoaded(this.pet);

  @override
  List<Object?> get props => [pet];
}

class PetsOperationSuccess extends PetsState {
  final String message;
  const PetsOperationSuccess(this.message);

  @override
  List<Object?> get props => [message];
}

class PetsSearchResultsLoaded extends PetsState {
  final List<PetModel> results;
  const PetsSearchResultsLoaded(this.results);

  @override
  List<Object?> get props => [results];
}

class PetsError extends PetsState {
  final String message;
  const PetsError(this.message);

  @override
  List<Object?> get props => [message];
}
