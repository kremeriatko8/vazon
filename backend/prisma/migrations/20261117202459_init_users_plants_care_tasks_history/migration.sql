-- CreateEnum
CREATE TYPE "LightCondition" AS ENUM ('LOW', 'MEDIUM', 'BRIGHT_INDIRECT', 'DIRECT');

-- CreateEnum
CREATE TYPE "PotSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "RadiatorDistance" AS ENUM ('NEAR', 'MEDIUM', 'FAR', 'NONE');

-- CreateEnum
CREATE TYPE "CareTaskType" AS ENUM ('WATER', 'FEED', 'REPOT');

-- CreateEnum
CREATE TYPE "CareTaskStatus" AS ENUM ('PENDING', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "CareActionType" AS ENUM ('DONE', 'SOIL_WET', 'WATERED', 'FED', 'REPOTTED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plants" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "species" VARCHAR(150) NOT NULL,
    "light_condition" "LightCondition" NOT NULL,
    "pot_size" "PotSize" NOT NULL,
    "radiator_distance" "RadiatorDistance" NOT NULL DEFAULT 'NONE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_tasks" (
    "id" UUID NOT NULL,
    "plant_id" UUID NOT NULL,
    "task_type" "CareTaskType" NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "status" "CareTaskStatus" NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "care_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_history" (
    "id" UUID NOT NULL,
    "plant_id" UUID NOT NULL,
    "care_task_id" UUID,
    "action_type" "CareActionType" NOT NULL,
    "action_date" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "care_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "plants_owner_id_idx" ON "plants"("owner_id");

-- CreateIndex
CREATE INDEX "care_tasks_plant_id_scheduled_date_idx" ON "care_tasks"("plant_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "care_tasks_status_scheduled_date_idx" ON "care_tasks"("status", "scheduled_date");

-- CreateIndex
CREATE INDEX "care_history_plant_id_action_date_idx" ON "care_history"("plant_id", "action_date");

-- CreateIndex
CREATE INDEX "care_history_care_task_id_idx" ON "care_history"("care_task_id");

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_tasks" ADD CONSTRAINT "care_tasks_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_history" ADD CONSTRAINT "care_history_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_history" ADD CONSTRAINT "care_history_care_task_id_fkey" FOREIGN KEY ("care_task_id") REFERENCES "care_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
