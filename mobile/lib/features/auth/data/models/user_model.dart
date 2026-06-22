class UserModel {
  final String id;
  final String email;
  final String name;
  final String? phone;
  final String role;
  final DateTime? createdAt;

  const UserModel({
    required this.id,
    required this.email,
    required this.name,
    this.phone,
    required this.role,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String?,
      role: json['role'] as String,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
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
