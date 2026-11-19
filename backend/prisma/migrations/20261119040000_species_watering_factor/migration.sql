-- Genus watering factor per species. It multiplies the base WATER interval
-- (7 days for medium light and a medium pot) instead of the water-need group
-- factor, so a Monstera and a Ficus lyrata no longer get the same schedule.
--
-- Data status: TO VERIFY. A first pass from common houseplant care guidance:
-- 0.6–0.7 keep the soil evenly moist; 0.9–1.1 water when the top 2–3 cm are
-- dry; 1.2–1.6 let the soil dry deeper; 2–3 let it dry out almost completely.
-- Matched by genus (case-insensitive). Species not listed keep NULL and use
-- their water-need group.

ALTER TABLE "species" ADD COLUMN "watering_factor" DOUBLE PRECISION;

UPDATE "species" SET "watering_factor" = CASE
  -- keep evenly moist
  WHEN LOWER(TRIM("scientific_name")) LIKE 'adiantum %' THEN 0.6
  WHEN LOWER(TRIM("scientific_name")) LIKE 'calathea %' THEN 0.7
  WHEN LOWER(TRIM("scientific_name")) LIKE 'maranta %' THEN 0.7
  WHEN LOWER(TRIM("scientific_name")) LIKE 'stromanthe %' THEN 0.7
  WHEN LOWER(TRIM("scientific_name")) LIKE 'nephrolepis %' THEN 0.7
  WHEN LOWER(TRIM("scientific_name")) LIKE 'asplenium %' THEN 0.7
  WHEN LOWER(TRIM("scientific_name")) LIKE 'davallia %' THEN 0.8
  WHEN LOWER(TRIM("scientific_name")) LIKE 'microsorum %' THEN 0.8
  WHEN LOWER(TRIM("scientific_name")) LIKE 'spathiphyllum %' THEN 0.7
  WHEN LOWER(TRIM("scientific_name")) LIKE 'hibiscus %' THEN 0.7
  -- top 2–3 cm dry
  WHEN LOWER(TRIM("scientific_name")) LIKE 'chamaedorea %' THEN 0.9
  WHEN LOWER(TRIM("scientific_name")) LIKE 'chrysalidocarpus %' THEN 0.9
  WHEN LOWER(TRIM("scientific_name")) LIKE 'codiaeum %' THEN 0.9
  WHEN LOWER(TRIM("scientific_name")) LIKE 'tradescantia %' THEN 0.9
  WHEN LOWER(TRIM("scientific_name")) LIKE 'monstera %' THEN 1.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'philodendron %' THEN 1.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'dieffenbachia%' THEN 1.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'ficus benjamina%' THEN 1.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'ficus microcarpa%' THEN 1.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'platycerium %' THEN 1.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'begonia %' THEN 1.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'chlorophytum %' THEN 1.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'pilea %' THEN 1.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'araucaria %' THEN 1.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'medinilla %' THEN 1.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'oxalis %' THEN 1.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'gloriosa %' THEN 1.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'epipremnum %' THEN 1.1
  WHEN LOWER(TRIM("scientific_name")) LIKE 'scindapsus %' THEN 1.1
  WHEN LOWER(TRIM("scientific_name")) LIKE 'aglaonema %' THEN 1.1
  WHEN LOWER(TRIM("scientific_name")) LIKE 'howea %' THEN 1.1
  WHEN LOWER(TRIM("scientific_name")) LIKE 'strelitzia %' THEN 1.1
  WHEN LOWER(TRIM("scientific_name")) LIKE 'cissus %' THEN 1.1
  WHEN LOWER(TRIM("scientific_name")) LIKE 'aeschynanthus %' THEN 1.1
  WHEN LOWER(TRIM("scientific_name")) LIKE 'ficus %' AND LOWER("scientific_name") NOT LIKE 'ficus lyrata%' AND LOWER("scientific_name") NOT LIKE 'ficus elastica%' THEN 1.1
  -- let the soil dry deeper
  WHEN LOWER(TRIM("scientific_name")) LIKE 'ficus lyrata%' THEN 1.2
  WHEN LOWER(TRIM("scientific_name")) LIKE 'schefflera %' THEN 1.2
  WHEN LOWER(TRIM("scientific_name")) LIKE 'ficus elastica%' THEN 1.3
  WHEN LOWER(TRIM("scientific_name")) LIKE 'dracaena %' THEN 1.4
  WHEN LOWER(TRIM("scientific_name")) LIKE 'aspidistra %' THEN 1.4
  WHEN LOWER(TRIM("scientific_name")) LIKE 'peperomia %' THEN 1.4
  WHEN LOWER(TRIM("scientific_name")) LIKE 'dischidia %' THEN 1.4
  WHEN LOWER(TRIM("scientific_name")) LIKE 'rhipsalis%' THEN 1.4
  WHEN LOWER(TRIM("scientific_name")) LIKE 'aechmea %' THEN 1.4
  WHEN LOWER(TRIM("scientific_name")) LIKE 'vriesea %' THEN 1.4
  WHEN LOWER(TRIM("scientific_name")) LIKE 'hoya %' THEN 1.6
  WHEN LOWER(TRIM("scientific_name")) LIKE 'epiphyllum %' THEN 1.6
  -- let it dry out almost completely
  WHEN LOWER(TRIM("scientific_name")) LIKE 'ceropegia %' THEN 2.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'senecio %' THEN 2.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'yucca %' THEN 2.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'aloe %' THEN 2.5
  WHEN LOWER(TRIM("scientific_name")) LIKE 'crassula %' THEN 2.5
  WHEN LOWER(TRIM("scientific_name")) LIKE 'beaucarnea %' THEN 2.5
  WHEN LOWER(TRIM("scientific_name")) LIKE 'pachypodium %' THEN 2.5
  WHEN LOWER(TRIM("scientific_name")) LIKE 'sansevieria %' THEN 3.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'zamioculcas %' THEN 3.0
  WHEN LOWER(TRIM("scientific_name")) LIKE 'opuntia%' THEN 3.0
  ELSE NULL
END;
