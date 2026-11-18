-- Water need per species, used by the schedule engine.
--
-- Data status: TO VERIFY. The groups below are a first pass by the team, not
-- checked against a horticultural source yet (see docs/care-rules.md).
-- Species are matched by genus (case-insensitive), so the groups do not depend
-- on the exact spelling or cultivar left by 20261118133100_clean_species_catalog.

CREATE TYPE "WaterNeed" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

ALTER TABLE "species" ADD COLUMN "water_need" "WaterNeed" NOT NULL DEFAULT 'MEDIUM';

-- Cacti, succulents and other drought-tolerant plants.
UPDATE "species" SET "water_need" = 'LOW' WHERE LOWER(TRIM("scientific_name")) LIKE ANY (ARRAY[
  'aloe %',
  'zamioculcas %',
  'crassula %',
  'epiphyllum %',
  'pachypodium %',
  'opuntia%',
  'sansevieria %',
  'beaucarnea %',
  'yucca %',
  'senecio herreianus%',
  'ceropegia %',
  'hoya %'
]);

-- Ferns, prayer plants and other plants that like evenly moist soil.
UPDATE "species" SET "water_need" = 'HIGH' WHERE LOWER(TRIM("scientific_name")) LIKE ANY (ARRAY[
  'nephrolepis %',
  'asplenium %',
  'davallia %',
  'microsorum %',
  'adiantum %',
  'platycerium %',
  'calathea %',
  'stromanthe %',
  'maranta %',
  'spathiphyllum %'
]);
