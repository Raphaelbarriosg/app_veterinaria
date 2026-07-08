-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VET', 'OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TreatmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "PetSpecies" AS ENUM ('DOG', 'CAT', 'BIRD', 'RODENT', 'REPTILE', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" VARCHAR(20),
    "role" "Role" NOT NULL,
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "species" "PetSpecies" NOT NULL,
    "breed" VARCHAR(100),
    "weight" DECIMAL(5,2),
    "birth_date" TIMESTAMP(3),
    "color" VARCHAR(50),
    "microchip" VARCHAR(50),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatments" (
    "id" UUID NOT NULL,
    "vet_id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "notes" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" "TreatmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_rules" (
    "id" UUID NOT NULL,
    "treatment_id" UUID NOT NULL,
    "medicine_name" VARCHAR(200) NOT NULL,
    "dosage" VARCHAR(100) NOT NULL,
    "frequency_hours" INTEGER NOT NULL,
    "require_photo" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "start_time" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" UUID NOT NULL,
    "treatment_id" UUID NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medicine_taken" BOOLEAN NOT NULL DEFAULT false,
    "appetite_level" SMALLINT NOT NULL,
    "energy_level" SMALLINT NOT NULL,
    "pain_level" SMALLINT,
    "temperature" DECIMAL(4,1),
    "alarm_signs" TEXT,
    "observations" TEXT,
    "image_url" TEXT,
    "vet_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "pets_microchip_key" ON "pets"("microchip");

-- CreateIndex
CREATE INDEX "pets_owner_id_idx" ON "pets"("owner_id");

-- CreateIndex
CREATE INDEX "pets_species_idx" ON "pets"("species");

-- CreateIndex
CREATE INDEX "pets_name_idx" ON "pets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pets_name_owner_id_key" ON "pets"("name", "owner_id");

-- CreateIndex
CREATE INDEX "treatments_pet_id_idx" ON "treatments"("pet_id");

-- CreateIndex
CREATE INDEX "treatments_vet_id_idx" ON "treatments"("vet_id");

-- CreateIndex
CREATE INDEX "treatments_status_idx" ON "treatments"("status");

-- CreateIndex
CREATE INDEX "treatments_priority_idx" ON "treatments"("priority");

-- CreateIndex
CREATE INDEX "treatments_start_date_idx" ON "treatments"("start_date");

-- CreateIndex
CREATE INDEX "treatments_created_at_idx" ON "treatments"("created_at");

-- CreateIndex
CREATE INDEX "treatment_rules_treatment_id_idx" ON "treatment_rules"("treatment_id");

-- CreateIndex
CREATE INDEX "treatment_rules_is_active_idx" ON "treatment_rules"("is_active");

-- CreateIndex
CREATE INDEX "treatment_rules_require_photo_idx" ON "treatment_rules"("require_photo");

-- CreateIndex
CREATE INDEX "daily_logs_treatment_id_registered_at_idx" ON "daily_logs"("treatment_id", "registered_at");

-- CreateIndex
CREATE INDEX "daily_logs_registered_at_idx" ON "daily_logs"("registered_at");

-- CreateIndex
CREATE INDEX "daily_logs_medicine_taken_idx" ON "daily_logs"("medicine_taken");

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_vet_id_fkey" FOREIGN KEY ("vet_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_rules" ADD CONSTRAINT "treatment_rules_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
