-- Corrections to 20261119000000_species_water_need. Data status: TO VERIFY.
-- Hibiscus (Rose of China) likes evenly moist soil, especially in flower.
UPDATE "species" SET "water_need" = 'HIGH' WHERE LOWER(TRIM("scientific_name")) LIKE 'hibiscus %';
-- Rhipsalis is a forest cactus: more water than desert cacti, still less than
-- leafy houseplants. Same group as Epiphyllum, the other forest cactus.
UPDATE "species" SET "water_need" = 'LOW' WHERE LOWER(TRIM("scientific_name")) LIKE 'rhipsalis%';
