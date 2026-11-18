-- Plant status set by the owner: healthy, needs attention, or dead.
CREATE TYPE "PlantStatus" AS ENUM ('HEALTHY', 'NEEDS_ATTENTION', 'DEAD');

ALTER TABLE "plants" ADD COLUMN "status" "PlantStatus" NOT NULL DEFAULT 'HEALTHY';
ALTER TABLE "plants" ADD COLUMN "status_changed_at" TIMESTAMPTZ(3);
