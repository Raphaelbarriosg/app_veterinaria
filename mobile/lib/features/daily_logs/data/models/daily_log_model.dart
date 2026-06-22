class DailyLogModel {
  final String id;
  final String treatmentId;
  final DateTime registeredAt;
  final bool medicineTaken;
  final int appetiteLevel;
  final int energyLevel;
  final String? alarmSigns;
  final String? imageUrl;

  const DailyLogModel({
    required this.id,
    required this.treatmentId,
    required this.registeredAt,
    required this.medicineTaken,
    required this.appetiteLevel,
    required this.energyLevel,
    this.alarmSigns,
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
      alarmSigns: json['alarmSigns'] as String?,
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
      'alarmSigns': alarmSigns,
      'imageUrl': imageUrl,
    };
  }
}
