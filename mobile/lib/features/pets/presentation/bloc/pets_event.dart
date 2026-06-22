import 'package:equatable/equatable.dart';

abstract class PetsEvent extends Equatable {
  const PetsEvent();

  @override
  List<Object?> get props => [];
}

class LoadPets extends PetsEvent {}

class LoadPetDetail extends PetsEvent {
  final String id;
  const LoadPetDetail(this.id);

  @override
  List<Object?> get props => [id];
}

class CreatePetRequested extends PetsEvent {
  final String name;
  final String species;
  final String? breed;
  final double? weight;
  final DateTime? birthDate;

  const CreatePetRequested({
    required this.name,
    required this.species,
    this.breed,
    this.weight,
    this.birthDate,
  });

  @override
  List<Object?> get props => [name, species, breed, weight, birthDate];
}

class UpdatePetRequested extends PetsEvent {
  final String id;
  final String name;
  final String species;
  final String? breed;
  final double? weight;
  final DateTime? birthDate;

  const UpdatePetRequested({
    required this.id,
    required this.name,
    required this.species,
    this.breed,
    this.weight,
    this.birthDate,
  });

  @override
  List<Object?> get props => [id, name, species, breed, weight, birthDate];
}

class DeletePetRequested extends PetsEvent {
  final String id;
  const DeletePetRequested(this.id);

  @override
  List<Object?> get props => [id];
}

class SearchPetsRequested extends PetsEvent {
  final String query;
  const SearchPetsRequested(this.query);

  @override
  List<Object?> get props => [query];
}
