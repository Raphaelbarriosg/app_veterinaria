import '../../../../core/network/api_client.dart';
import '../../../../config/constants/api_constants.dart';
import '../models/pet_model.dart';

class PetsRepository {
  final ApiClient _apiClient;

  PetsRepository(this._apiClient);

  /// Obtener mascotas del dueño actual
  Future<List<PetModel>> getMyPets() async {
    final response = await _apiClient.dio.get(ApiConstants.pets);
    final list = response.data as List<dynamic>;
    return list.map((json) => PetModel.fromJson(json)).toList();
  }

  /// Obtener detalle de mascota
  Future<PetModel> getPetDetail(String id) async {
    final response = await _apiClient.dio.get('${ApiConstants.pets}/$id');
    return PetModel.fromJson(response.data);
  }

  /// Crear mascota (solo OWNER)
  Future<PetModel> createPet({
    required String name,
    required String species,
    String? breed,
    double? weight,
    DateTime? birthDate,
  }) async {
    final response = await _apiClient.dio.post(
      ApiConstants.pets,
      data: {
        'name': name,
        'species': species,
        if (breed != null && breed.isNotEmpty) 'breed': breed,
        if (weight != null) 'weight': weight,
        if (birthDate != null) 'birthDate': birthDate.toIso8601String(),
      },
    );
    return PetModel.fromJson(response.data);
  }

  /// Actualizar mascota (solo OWNER)
  Future<PetModel> updatePet(
    String id, {
    String? name,
    String? species,
    String? breed,
    double? weight,
    DateTime? birthDate,
  }) async {
    final response = await _apiClient.dio.patch(
      '${ApiConstants.pets}/$id',
      data: {
        if (name != null) 'name': name,
        if (species != null) 'species': species,
        if (breed != null) 'breed': breed,
        if (weight != null) 'weight': weight,
        if (birthDate != null) 'birthDate': birthDate.toIso8601String(),
      },
    );
    return PetModel.fromJson(response.data);
  }

  /// Eliminar mascota (solo OWNER)
  Future<void> deletePet(String id) async {
    await _apiClient.dio.delete('${ApiConstants.pets}/$id');
  }

  /// Buscar mascotas por nombre (solo VET)
  Future<List<PetModel>> searchPets(String query) async {
    final response = await _apiClient.dio.get(
      '${ApiConstants.pets}/search',
      queryParameters: {'q': query},
    );
    final list = response.data as List<dynamic>;
    return list.map((json) => PetModel.fromJson(json)).toList();
  }
}
