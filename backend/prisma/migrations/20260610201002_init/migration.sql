-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VET', 'OWNER');

-- CreateEnum
CREATE TYPE "TreatmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "weight" DOUBLE PRECISION,
    "birth_date" TIMESTAMP(3),
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
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" "TreatmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_rules" (
    "id" UUID NOT NULL,
    "treatment_id" UUID NOT NULL,
    "medicine_name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency_hours" INTEGER NOT NULL,
    "require_photo" BOOLEAN NOT NULL DEFAULT false,
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
    "alarm_signs" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "pets_owner_id_idx" ON "pets"("owner_id");

-- CreateIndex
CREATE INDEX "treatments_pet_id_idx" ON "treatments"("pet_id");

-- CreateIndex
CREATE INDEX "treatments_vet_id_idx" ON "treatments"("vet_id");

-- CreateIndex
CREATE INDEX "treatments_status_idx" ON "treatments"("status");

-- CreateIndex
CREATE INDEX "treatment_rules_treatment_id_idx" ON "treatment_rules"("treatment_id");

-- CreateIndex
CREATE INDEX "daily_logs_treatment_id_registered_at_idx" ON "daily_logs"("treatment_id", "registered_at");

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
