class UserModel {
  final String id;
  final String email;
  final String name;
  final String? phone;
  final String role;
  final DateTime? createdAt;
  final int petCount;

  const UserModel({
    required this.id,
    required this.email,
    required this.name,
    this.phone,
    required this.role,
    this.createdAt,
    this.petCount = 0,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      phone: json['phone']?.toString(),
      role: json['role']?.toString() ?? 'OWNER',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      petCount: json['_count'] is Map && json['_count']['ownedPets'] is int
          ? json['_count']['ownedPets'] as int
          : 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'name': name,
        'phone': phone,
        'role': role,
      };

  bool get isVet => role == 'VET';
  bool get isOwner => role == 'OWNER';
}
