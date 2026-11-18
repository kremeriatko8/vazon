-- AlterTable
ALTER TABLE "plants" ADD COLUMN     "species_id" UUID;

-- CreateTable
CREATE TABLE "species" (
    "id" UUID NOT NULL,
    "scientific_name" VARCHAR(150) NOT NULL,
    "common_name" VARCHAR(150) NOT NULL,
    "recommended_light" "LightCondition" NOT NULL,
    "photo_url" VARCHAR(500),
    "photo_attribution" VARCHAR(300),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "species_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "species_scientific_name_key" ON "species"("scientific_name");

-- CreateIndex
CREATE INDEX "plants_species_id_idx" ON "plants"("species_id");

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species"("id") ON DELETE SET NULL ON UPDATE CASCADE;
