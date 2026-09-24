import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Paleta clínica en Dark Mode
  static const Color primaryMint = Color(0xFF00E676);      // Verde menta vibrante
  static const Color primaryMintDark = Color(0xFF00B248);  // Verde menta oscuro
  static const Color darkMetallic = Color(0xFF1E293B);     // Gris metálico oscuro
  static const Color backgroundCharcoal = Color(0xFF0F172A); // Negro carbón slate
  static const Color surfaceSlate = Color(0xFF1E293B);      // Gris pizarra para tarjetas
  static const Color textLight = Color(0xFFF8FAFC);         // Blanco humo
  static const Color textMuted = Color(0xFF94A3B8);         // Gris apagado

  // Colores de alerta para el Semáforo
  static const Color alertRed = Color(0xFFEF4444);
  static const Color alertYellow = Color(0xFFF59E0B);
  static const Color alertGreen = Color(0xFF10B981);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: primaryMint,
      scaffoldBackgroundColor: backgroundCharcoal,
      
      // Esquema de Colores
      colorScheme: const ColorScheme.dark(
        primary: primaryMint,
        secondary: primaryMintDark,
        surface: surfaceSlate,
        error: alertRed,
      ),

      // Tipografía
      textTheme: TextTheme(
        headlineLarge: GoogleFonts.outfit(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: textLight,
        ),
        titleLarge: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textLight,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 16,
          color: textLight,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          color: textMuted,
        ),
      ),

      // Estilo de tarjetas
      cardTheme: const CardThemeData(
        color: surfaceSlate,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
      ),

      // Estilo de botones
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryMint,
          foregroundColor: backgroundCharcoal,
          elevation: 0,
          textStyle: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),

      // Estilo de inputs (Text fields)
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkMetallic.withValues(alpha: 0.5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: darkMetallic, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryMint, width: 2),
        ),
        labelStyle: GoogleFonts.inter(color: textMuted),
        hintStyle: GoogleFonts.inter(color: textMuted.withValues(alpha: 0.5)),
      ),
    );
  }
}
