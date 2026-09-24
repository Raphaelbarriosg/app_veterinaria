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
      id: json['id'] as String,
      treatmentId: json['treatmentId'] as String,
      registeredAt: DateTime.parse(json['registeredAt'] as String),
      medicineTaken: json['medicineTaken'] as bool,
      appetiteLevel: json['appetiteLevel'] as int,
      energyLevel: json['energyLevel'] as int,
      painLevel: json['painLevel'] as int?,
      temperature: (json['temperature'] as num?)?.toDouble(),
      alarmSigns: json['alarmSigns'] as String?,
      observations: json['observations'] as String?,
      imageUrl: json['imageUrl'] as String?,
    );
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
