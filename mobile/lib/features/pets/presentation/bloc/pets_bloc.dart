import 'package:dio/dio.dart';
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
      emit(PetsError(_parseError(e, 'Error al cargar la lista de mascotas')));
    }
  }

  Future<void> _onLoadPetDetail(LoadPetDetail event, Emitter<PetsState> emit) async {
    emit(PetsLoading());
    try {
      final pet = await _petsRepository.getPetDetail(event.id);
      emit(PetDetailLoaded(pet));
    } catch (e) {
      emit(PetsError(_parseError(e, 'Error al cargar el detalle de la mascota')));
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
      emit(PetsError(_parseError(e, 'Error al crear la mascota')));
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
      emit(PetsError(_parseError(e, 'Error al actualizar la mascota')));
    }
  }

  Future<void> _onDeletePetRequested(DeletePetRequested event, Emitter<PetsState> emit) async {
    emit(PetsLoading());
    try {
      await _petsRepository.deletePet(event.id);
      emit(const PetsOperationSuccess('Mascota eliminada correctamente'));
    } catch (e) {
      emit(PetsError(_parseError(e, 'Error al eliminar la mascota')));
    }
  }

  Future<void> _onSearchPetsRequested(SearchPetsRequested event, Emitter<PetsState> emit) async {
    emit(PetsLoading());
    try {
      final results = await _petsRepository.searchPets(event.query);
      emit(PetsSearchResultsLoaded(results));
    } catch (e) {
      emit(PetsError(_parseError(e, 'Error al buscar mascotas')));
    }
  }

  String _parseError(dynamic e, String prefix) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        final msg = data['message'];
        if (msg is List) return '$prefix: ${msg.join(', ')}';
        return '$prefix: $msg';
      }
      if (e.response?.statusCode == 409) return '$prefix: Ya tienes una mascota registrada con este nombre.';
      if (e.response?.statusCode == 404) return '$prefix: Mascota no encontrada.';
      if (e.response?.statusCode == 403) return '$prefix: No tienes permisos para esta acción.';
      if (e.response?.statusCode == 400) return '$prefix: Datos inválidos. Revisa el formulario.';
      if (e.response?.statusCode == 500) return '$prefix: Error interno del servidor. Inténtalo más tarde.';
      return '$prefix: Error de conexión con el servidor.';
    }
    return '$prefix: ${e.toString()}';
  }
}
