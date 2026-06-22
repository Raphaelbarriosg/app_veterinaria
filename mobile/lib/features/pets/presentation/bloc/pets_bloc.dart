import 'package:flutter_bloc/flutter_bloc.dart';
import '../../data/repositories/pets_repository.dart';
import 'pets_event.dart';
import 'pets_state.dart';

class PetsBloc extends Bloc<PetsEvent, PetsState> {
  final PetsRepository _petsRepository;

  PetsBloc(this._petsRepository) : super(PetsInitial()) {
    on<LoadPets>(_onLoadPets);
    on<LoadPetDetail>(_onLoadPetDetail);
    on<CreatePetRequested>(_onCreatePetRequested);
    on<UpdatePetRequested>(_onUpdatePetRequested);
    on<DeletePetRequested>(_onDeletePetRequested);
    on<SearchPetsRequested>(_onSearchPetsRequested);
  }

  Future<void> _onLoadPets(LoadPets event, Emitter<PetsState> emit) async {
    emit(PetsLoading());
    try {
      final pets = await _petsRepository.getMyPets();
      emit(PetsLoaded(pets));
    } catch (e) {
      emit(PetsError('Error al cargar la lista de mascotas: ${e.toString()}'));
    }
  }

  Future<void> _onLoadPetDetail(LoadPetDetail event, Emitter<PetsState> emit) async {
    emit(PetsLoading());
    try {
      final pet = await _petsRepository.getPetDetail(event.id);
      emit(PetDetailLoaded(pet));
    } catch (e) {
      emit(PetsError('Error al cargar el detalle de la mascota: ${e.toString()}'));
    }
  }

  Future<void> _onCreatePetRequested(CreatePetRequested event, Emitter<PetsState> emit) async {
    emit(PetsLoading());
    try {
      await _petsRepository.createPet(
        name: event.name,
        species: event.species,
        breed: event.breed,
        weight: event.weight,
        birthDate: event.birthDate,
      );
      emit(const PetsOperationSuccess('Mascota agregada correctamente'));
    } catch (e) {
      emit(PetsError('Error al crear la mascota: ${e.toString()}'));
    }
  }

  Future<void> _onUpdatePetRequested(UpdatePetRequested event, Emitter<PetsState> emit) async {
    emit(PetsLoading());
    try {
      await _petsRepository.updatePet(
        event.id,
        name: event.name,
        species: event.species,
        breed: event.breed,
        weight: event.weight,
        birthDate: event.birthDate,
      );
      emit(const PetsOperationSuccess('Mascota actualizada correctamente'));
    } catch (e) {
      emit(PetsError('Error al actualizar la mascota: ${e.toString()}'));
    }
  }

  Future<void> _onDeletePetRequested(DeletePetRequested event, Emitter<PetsState> emit) async {
    emit(PetsLoading());
    try {
      await _petsRepository.deletePet(event.id);
      emit(const PetsOperationSuccess('Mascota eliminada correctamente'));
    } catch (e) {
      emit(PetsError('Error al eliminar la mascota: ${e.toString()}'));
    }
  }

  Future<void> _onSearchPetsRequested(SearchPetsRequested event, Emitter<PetsState> emit) async {
    emit(PetsLoading());
    try {
      final results = await _petsRepository.searchPets(event.query);
      emit(PetsSearchResultsLoaded(results));
    } catch (e) {
      emit(PetsError('Error al buscar mascotas: ${e.toString()}'));
    }
  }
}
