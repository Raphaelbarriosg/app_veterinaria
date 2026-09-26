class DailyLogModel {
  final String id;
  final String treatmentId;
  final DateTime registeredAt;
  final bool medicineTaken;
  final int appetiteLevel;
  final int energyLevel;
  final int? painLevel;
  final double? temperature;
  final String? alarmSigns;
  final String? observations;
  final String? imageUrl;

  const DailyLogModel({
    required this.id,
    required this.treatmentId,
    required this.registeredAt,
    required this.medicineTaken,
    required this.appetiteLevel,
    required this.energyLevel,
    this.painLevel,
    this.temperature,
    this.alarmSigns,
    this.observations,
    this.imageUrl,
  });

  factory DailyLogModel.fromJson(Map<String, dynamic> json) {
    return DailyLogModel(
      id: json['id'] as String? ?? '',
      treatmentId: json['treatmentId'] as String? ?? '',
      registeredAt: DateTime.tryParse(json['registeredAt']?.toString() ?? '') ?? DateTime.now(),
      medicineTaken: json['medicineTaken'] == true,
      appetiteLevel: _toInt(json['appetiteLevel'], 5),
      energyLevel: _toInt(json['energyLevel'], 5),
      painLevel: _toIntOrNull(json['painLevel']),
      temperature: _toDouble(json['temperature']),
      alarmSigns: json['alarmSigns'] as String?,
      observations: json['observations'] as String?,
      imageUrl: json['imageUrl'] as String?,
    );
  }

  static int _toInt(dynamic val, [int defaultValue = 0]) {
    if (val == null) return defaultValue;
    if (val is num) return val.toInt();
    if (val is String) return int.tryParse(val) ?? defaultValue;
    return defaultValue;
  }

  static int? _toIntOrNull(dynamic val) {
    if (val == null) return null;
    if (val is num) return val.toInt();
    if (val is String) return int.tryParse(val);
    return null;
  }

  static double? _toDouble(dynamic val) {
    if (val == null) return null;
    if (val is num) return val.toDouble();
    if (val is String) return double.tryParse(val);
    return null;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'treatmentId': treatmentId,
      'registeredAt': registeredAt.toIso8601String(),
      'medicineTaken': medicineTaken,
      'appetiteLevel': appetiteLevel,
      'energyLevel': energyLevel,
      'painLevel': painLevel,
      'temperature': temperature,
      'alarmSigns': alarmSigns,
      'observations': observations,
      'imageUrl': imageUrl,
    };
  }
}
